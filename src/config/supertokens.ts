import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import Session from 'supertokens-node/recipe/session';
import Dashboard from 'supertokens-node/recipe/dashboard';
import { PrismaClient, UserRole as PrismaUserRole, SolutionType } from '@prisma/client';
import { logger } from '../utils/logger';
import ManagerAssignmentService from '../services/ManagerAssignmentService';
import { sendClientWelcomeEmail, sendAdminNewClientAlert, sendManagerNewClientEmail, sendPasswordResetEmail } from '../services/EmailService';

const prisma = new PrismaClient();

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TALENT = 'talent',
  CLIENT = 'client'
}

export function initSupertokens() {
  const apiDomain = process.env.API_DOMAIN || 'http://localhost:3000';
  const websiteDomain = process.env.WEBSITE_DOMAIN || 'http://localhost:3001';
  
  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    logger.info('SuperTokens initialized', {
      apiDomain,
      websiteDomain,
    });
  }
  
  supertokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.com',
      apiKey: process.env.SUPERTOKENS_API_KEY,
    },
    appInfo: {
      appName: process.env.APP_NAME || 'Knacksters',
      apiDomain: apiDomain,
      websiteDomain: websiteDomain,
      apiBasePath: '/api/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      EmailPassword.init({
        emailDelivery: {
          override: (originalImplementation) => {
            return {
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
            };
          },
        },
        signUpFeature: {
          formFields: [
            {
              id: 'role',
              optional: true,
            },
            {
              id: 'name',
              optional: false,
            },
            {
              id: 'selectedSolution',
              optional: true,
            },
            {
              id: 'solutionNotes',
              optional: true,
            },
          ],
        },
        override: {
          apis: (originalImplementation) => {
            return {
              ...originalImplementation,
              signUpPOST: async function (input) {
                const formFields = input.formFields;
                const email = formFields.find(f => f.id === 'email')?.value || '';
                const requestedRole = (formFields.find(f => f.id === 'role')?.value?.toUpperCase() || 'CLIENT') as PrismaUserRole;
                // Security: Public signup is always CLIENT. Privileged users are created by existing admins only.
                const role = PrismaUserRole.CLIENT;
                const fullName = formFields.find(f => f.id === 'name')?.value || 'User';
                const selectedSolution = formFields.find(f => f.id === 'selectedSolution')?.value as SolutionType | undefined;
                const solutionNotes = formFields.find(f => f.id === 'solutionNotes')?.value as string | undefined;
                
                const response = await originalImplementation.signUpPOST!(input);

                if (response.status === 'OK') {
                  try {
                    // Upsert user in Prisma keyed by email.
                    // If the email already exists (e.g. SuperTokens DB was reset/cleared but
                    // Prisma still has the old record), we re-link it to the new SuperTokens ID
                    // so the user can log in and retain all their existing data.
                    const newUser = await prisma.user.upsert({
                      where: { email },
                      create: {
                        id: response.user.id,
                        email,
                        role,
                        fullName,
                        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                        selectedSolution,
                        selectedSolutionNotes: solutionNotes,
                      },
                      update: {
                        // Re-link existing record to the new SuperTokens ID and
                        // refresh any fields the user provided during re-registration.
                        id: response.user.id,
                        fullName,
                        selectedSolution: selectedSolution ?? undefined,
                        selectedSolutionNotes: solutionNotes ?? undefined,
                      },
                    });

                    logger.debug(`Prisma user upserted for ${email} with ID ${newUser.id}`);

                    if (requestedRole !== PrismaUserRole.CLIENT) {
                      logger.warn('Blocked non-client role request at public signup', {
                        email,
                        requestedRole,
                        enforcedRole: role,
                      });
                    }
                    logger.info(`User created: ${email} (${role}) with solution: ${selectedSolution}`);

                    // Send welcome emails for CLIENT signups only when they have
                    // selected a solution (always true for email/password flow).
                    // Google sign-up users have no solution yet — their emails are
                    // deferred to PATCH /api/auth/onboarding after solution selection.
                    if (role === PrismaUserRole.CLIENT && selectedSolution) {
                      sendClientWelcomeEmail({
                        fullName,
                        email,
                        selectedSolution,
                      }).catch(err => logger.error('Welcome email failed', err));

                      sendAdminNewClientAlert({
                        fullName,
                        email,
                        selectedSolution,
                      }).catch(err => logger.error('Admin new client alert failed', err));
                    }

                    // Auto-assign manager for CLIENT role
                    if (role === PrismaUserRole.CLIENT && selectedSolution) {
                      try {
                        const managerId = await ManagerAssignmentService.assignManagerToClient(
                          newUser.id,
                          selectedSolution
                        );
                        
                        if (managerId) {
                          logger.info(`Manager ${managerId} auto-assigned to client ${newUser.id}`);
                          // Notify the manager by email
                          prisma.user.findUnique({
                            where: { id: managerId },
                            select: { fullName: true, email: true },
                          }).then((manager) => {
                            if (manager?.email) {
                              sendManagerNewClientEmail({
                                managerName: manager.fullName || 'there',
                                managerEmail: manager.email,
                                clientName: fullName,
                                clientEmail: email,
                                selectedSolution,
                              }).catch(err => logger.error('Manager new client email failed', err));
                            }
                          }).catch(err => logger.error('Failed to fetch manager for email', err));
                        } else {
                          logger.warn(`No manager available for client ${newUser.id}`);
                        }
                      } catch (error) {
                        logger.error('Manager auto-assignment failed', error);
                        // Don't fail signup if manager assignment fails
                      }
                    }

                    await new Promise(resolve => setTimeout(resolve, 100));
                  } catch (error) {
                    logger.error('Failed to create Prisma user', error);
                  }
                }

                return response;
              },
            };
          },
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
          functions: (originalImplementation) => {
            return {
              ...originalImplementation,
              signInUp: async function (input) {
                const response = await originalImplementation.signInUp(input);

                if (response.status === 'OK') {
                  try {
                    const email = response.user.emails[0];
                    const rawInfo = input.rawUserInfoFromProvider;
                    const googleProfile = (rawInfo?.fromIdTokenPayload || rawInfo?.fromUserInfoAPI || {}) as Record<string, string>;
                    const fullName =
                      googleProfile?.name ||
                      googleProfile?.given_name ||
                      (email ? email.split('@')[0] : 'User');
                    const avatarUrl =
                      googleProfile?.picture ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

                    if (response.createdNewRecipeUser) {
                      // New Google sign-up — upsert to handle edge cases where
                      // an email/password account with this email already exists in Prisma
                      const upsertedUser = await prisma.user.upsert({
                        where: { email },
                        create: {
                          id: response.user.id,
                          email,
                          role: PrismaUserRole.CLIENT,
                          fullName,
                          avatarUrl,
                        },
                        update: {
                          // Existing email/password user — update avatar if they don't have one
                          avatarUrl: avatarUrl,
                        },
                      });

                      // Only assign manager if truly new; welcome/admin emails are sent
                      // later (in PATCH /api/auth/onboarding) after solution is chosen.
                      const isNewPrismaUser = upsertedUser.id === response.user.id;
                      if (isNewPrismaUser) {
                        logger.info(`Google user created: ${email} (CLIENT) — emails deferred until onboarding`);

                        ManagerAssignmentService.assignManagerToClient(upsertedUser.id, undefined)
                          .then((managerId) => {
                            if (managerId) {
                              logger.info(`Manager ${managerId} auto-assigned to Google client ${upsertedUser.id}`);
                            }
                          })
                          .catch((err) => logger.error('Manager auto-assignment failed for Google sign-up', err));
                      } else {
                        logger.info(`Google sign-in linked to existing Prisma user: ${email}`);
                      }
                    } else {
                      logger.info(`Returning Google user signed in: ${email}`);
                    }
                  } catch (error) {
                    // Never let post-signup logic cause a 500 — log and continue
                    logger.error('Error in ThirdParty signInUp post-processing', error);
                  }
                }

                return response;
              },
            };
          },
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
          functions: (originalImplementation) => {
            return {
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
                    logger.error('User lookup failed', error);
                  }
                  attempts++;
                }

                if (user) {
                  input.accessTokenPayload = {
                    ...input.accessTokenPayload,
                    role: user.role.toLowerCase(),
                    email: user.email,
                    name: user.fullName,
                  };
                } else {
                  input.accessTokenPayload = {
                    ...input.accessTokenPayload,
                    role: 'client',
                    email: '',
                    name: '',
                  };
                }

                return originalImplementation.createNewSession(input);
              },
            };
          },
        },
      }),
    ],
  });
}
