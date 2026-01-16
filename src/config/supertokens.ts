import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { PrismaClient, UserRole as PrismaUserRole } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TALENT = 'talent',
  CLIENT = 'client'
}

export function initSupertokens() {
  supertokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.com',
      apiKey: process.env.SUPERTOKENS_API_KEY,
    },
    appInfo: {
      appName: process.env.APP_NAME || 'Knacksters',
      apiDomain: process.env.API_DOMAIN || 'http://localhost:5000',
      websiteDomain: process.env.WEBSITE_DOMAIN || 'http://localhost:3000',
      apiBasePath: '/api/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      EmailPassword.init({
        signUpFeature: {
          formFields: [
            {
              id: 'role',
              optional: false,
            },
            {
              id: 'name',
              optional: false,
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
                const role = (formFields.find(f => f.id === 'role')?.value?.toUpperCase() || 'CLIENT') as PrismaUserRole;
                const fullName = formFields.find(f => f.id === 'name')?.value || 'User';
                
                const response = await originalImplementation.signUpPOST!(input);

                if (response.status === 'OK') {
                  try {
                    await prisma.user.create({
                      data: {
                        id: response.user.id,
                        email,
                        role,
                        fullName,
                        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                      },
                    });

                    logger.info(`User created: ${email} (${role})`);
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
      Session.init({
        cookieSameSite: 'lax',
        cookieSecure: false,
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
