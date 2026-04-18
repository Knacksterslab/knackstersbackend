/**
 * SuperTokens Configuration
 * Initialises the auth layer.  Post-signup side effects are handled by
 * OnSignupService — keep this file to wiring only.
 */

import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import Session from 'supertokens-node/recipe/session';
import Dashboard from 'supertokens-node/recipe/dashboard';
import { UserRole as PrismaUserRole, SolutionType } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import OnSignupService from '../services/auth/OnSignupService';
import { sendPasswordResetEmail, sendEmailVerificationEmail } from '../services/EmailService';

/**
 * Session-layer role values (lowercase, stored in JWT payload).
 * Intentionally separate from the Prisma DB enum (uppercase) — they represent
 * different layers: DB storage vs. session token payload.
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TALENT = 'talent',
  CLIENT = 'client',
}

export function initSupertokens() {
  const apiDomain = process.env.API_DOMAIN || 'http://localhost:3000';
  const websiteDomain = process.env.WEBSITE_DOMAIN || 'http://localhost:3001';

  if (process.env.NODE_ENV !== 'production') {
    logger.info('SuperTokens initialized', { apiDomain, websiteDomain });
  }

  supertokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.com',
      apiKey: process.env.SUPERTOKENS_API_KEY,
    },
    appInfo: {
      appName: process.env.APP_NAME || 'Knacksters',
      apiDomain,
      websiteDomain,
      apiBasePath: '/api/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      EmailPassword.init({
        emailDelivery: {
          override: (originalImplementation) => ({
            ...originalImplementation,
            sendEmail: async function (input) {
              if (input.type === 'PASSWORD_RESET') {
                await sendPasswordResetEmail({
                  email: input.user.email,
                  resetLink: input.passwordResetLink,
                });
                return;
              }
              return originalImplementation.sendEmail(input);
            },
          }),
        },
        signUpFeature: {
          formFields: [
            { id: 'role', optional: true },
            { id: 'name', optional: false },
            { id: 'selectedSolution', optional: true },
            { id: 'solutionNotes', optional: true },
          ],
        },
        override: {
          apis: (originalImplementation) => ({
            ...originalImplementation,
            signUpPOST: async function (input) {
              const formFields = input.formFields;
              const email = formFields.find(f => f.id === 'email')?.value || '';
              const requestedRole = (
                formFields.find(f => f.id === 'role')?.value?.toUpperCase() || 'CLIENT'
              ) as PrismaUserRole;
              const fullName = formFields.find(f => f.id === 'name')?.value || 'User';
              const selectedSolution = formFields.find(f => f.id === 'selectedSolution')?.value as SolutionType | undefined;
              const solutionNotes = formFields.find(f => f.id === 'solutionNotes')?.value as string | undefined;

              const response = await originalImplementation.signUpPOST!(input);

              if (response.status === 'OK') {
                await OnSignupService.handleEmailPasswordSignup({
                  userId: response.user.id,
                  email,
                  fullName,
                  requestedRole,
                  selectedSolution,
                  solutionNotes,
                });
              }

              return response;
            },
          }),
        },
      }),

      ThirdParty.init({
        signInAndUpFeature: {
          providers: [
            {
              config: {
                thirdPartyId: 'google',
                clients: [
                  {
                    clientId: process.env.GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                  },
                ],
              },
            },
          ],
        },
        override: {
          functions: (originalImplementation) => ({
            ...originalImplementation,
            signInUp: async function (input) {
              const response = await originalImplementation.signInUp(input);

              if (response.status === 'OK' && response.createdNewRecipeUser) {
                const email = response.user.emails[0];
                const rawInfo = input.rawUserInfoFromProvider;
                const googleProfile = (
                  rawInfo?.fromIdTokenPayload || rawInfo?.fromUserInfoAPI || {}
                ) as Record<string, string>;
                const fullName =
                  googleProfile?.name ||
                  googleProfile?.given_name ||
                  (email ? email.split('@')[0] : 'User');

                await OnSignupService.handleGoogleSignup({
                  userId: response.user.id,
                  email,
                  fullName,
                  avatarUrl: googleProfile?.picture || undefined,
                }).catch(err =>
                  logger.error('Error in ThirdParty signInUp post-processing', err)
                );
              } else if (response.status === 'OK') {
                logger.info(`Returning Google user signed in: ${response.user.emails[0]}`);
              }

              return response;
            },
          }),
        },
      }),

      EmailVerification.init({
        mode: 'REQUIRED',
        emailDelivery: {
          override: (originalImplementation) => ({
            ...originalImplementation,
            sendEmail: async function (input) {
              if (input.type === 'EMAIL_VERIFICATION') {
                // Look up user's full name for a personalised email
                const dbUser = await prisma.user.findUnique({
                  where: { id: input.user.id },
                  select: { fullName: true },
                }).catch(() => null);

                await sendEmailVerificationEmail({
                  fullName: dbUser?.fullName || input.user.email.split('@')[0],
                  email: input.user.email,
                  verificationLink: input.emailVerifyLink,
                });
                return;
              }
              return originalImplementation.sendEmail(input);
            },
          }),
        },
        override: {
          functions: (originalImplementation) => ({
            ...originalImplementation,
            // Fired server-side the moment the token is validated.
            // This is the correct place to send welcome emails and assign a manager,
            // because we now know the address is real.
            verifyEmailUsingToken: async function (input) {
              const response = await originalImplementation.verifyEmailUsingToken(input);

              if (response.status === 'OK') {
                // In SuperTokens Node v20, verifyEmailUsingToken returns
                // { recipeUserId: RecipeUserId, email: string } — no .id field.
                const userId = response.user.recipeUserId.getAsString();
                const email = response.user.email;

                // Fetch the Prisma user to get solution + name for emails/assignment
                const dbUser = await prisma.user.findUnique({
                  where: { id: userId },
                  select: {
                    fullName: true,
                    selectedSolution: true,
                    accountManagerId: true,
                  },
                }).catch(() => null);

                if (dbUser) {
                  await OnSignupService.handleEmailVerified({
                    userId,
                    email,
                    fullName: dbUser.fullName || email.split('@')[0],
                    selectedSolution: dbUser.selectedSolution ?? undefined,
                    alreadyHasManager: !!dbUser.accountManagerId,
                  });
                }
              }

              return response;
            },
          }),
        },
      }),

      Dashboard.init({
        apiKey: process.env.SUPERTOKENS_DASHBOARD_KEY!,
      }),

      Session.init({
        cookieSameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        cookieSecure: process.env.NODE_ENV === 'production',
        sessionExpiredStatusCode: 401,
        override: {
          functions: (originalImplementation) => ({
            ...originalImplementation,
            createNewSession: async function (input) {
              let user = null;
              let attempts = 0;
              const maxAttempts = 5;

              while (!user && attempts < maxAttempts) {
                try {
                  user = await prisma.user.findUnique({
                    where: { id: input.userId },
                    select: { role: true, email: true, fullName: true },
                  });
                  if (!user && attempts < maxAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                  }
                } catch (error) {
                  logger.error('User lookup failed during session creation', error);
                }
                attempts++;
              }

              input.accessTokenPayload = {
                ...input.accessTokenPayload,
                role: user ? user.role.toLowerCase() : 'client',
                email: user?.email ?? '',
                name: user?.fullName ?? '',
              };

              return originalImplementation.createNewSession(input);
            },
          }),
        },
      }),
    ],
  });
}
