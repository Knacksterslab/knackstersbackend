/**
 * OnSignupService
 * Post-signup side effects: DB user creation, manager assignment, welcome emails.
 * Called by SuperTokens recipe overrides — extracted here to keep auth config lean.
 *
 * Email flow:
 *  - handleEmailPasswordSignup  → creates DB user, sends verification email (via ST recipe)
 *  - handleEmailVerified        → fires welcome/admin emails + assigns manager (address confirmed)
 *  - handleGoogleSignup         → creates DB user + assigns manager (Google already verified email)
 */

import { UserRole as PrismaUserRole, SolutionType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { prisma } from '../../lib/prisma';
import { avatarFallback } from '../../config/constants';
import ManagerAssignmentService from '../ManagerAssignmentService';
import {
  sendClientWelcomeEmail,
  sendAdminNewClientAlert,
  sendManagerNewClientEmail,
} from '../EmailService';

export interface EmailPasswordSignupInput {
  userId: string;
  email: string;
  fullName: string;
  requestedRole: PrismaUserRole;
  selectedSolution?: SolutionType;
  solutionNotes?: string;
}

export interface GoogleSignupInput {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface EmailVerifiedInput {
  userId: string;
  email: string;
  fullName: string;
  selectedSolution?: SolutionType;
  alreadyHasManager: boolean;
}

export class OnSignupService {
  /**
   * Handle post-signup for email/password sign-ups.
   * Always enforces CLIENT role regardless of what was requested.
   */
  static async handleEmailPasswordSignup(input: EmailPasswordSignupInput): Promise<void> {
    const { userId, email, fullName, requestedRole, selectedSolution, solutionNotes } = input;

    // Security: public signup is always CLIENT
    const role = PrismaUserRole.CLIENT;

    try {
      // Upsert keyed by email — handles SuperTokens DB resets where the Prisma record
      // already exists, re-linking it to the new SuperTokens ID.
      const newUser = await prisma.user.upsert({
        where: { email },
        create: {
          id: userId,
          email,
          role,
          fullName,
          avatarUrl: avatarFallback(email),
          selectedSolution,
          selectedSolutionNotes: solutionNotes,
        },
        update: {
          id: userId,
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

      // Welcome emails and manager assignment are intentionally deferred to
      // handleEmailVerified — we only contact real, confirmed addresses.

      // Small delay to allow DB replication before the verification email is sent
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('Failed to create Prisma user on email/password signup', error);
    }
  }

  /**
   * Handle post-signup for Google OAuth sign-ups.
   * Manager assignment runs async; welcome emails are deferred to onboarding.
   */
  static async handleGoogleSignup(input: GoogleSignupInput): Promise<void> {
    const { userId, email, fullName, avatarUrl } = input;

    try {
      const upsertedUser = await prisma.user.upsert({
        where: { email },
        create: {
          id: userId,
          email,
          role: PrismaUserRole.CLIENT,
          fullName,
          avatarUrl: avatarUrl ?? avatarFallback(email),
        },
        update: {
          avatarUrl: avatarUrl ?? undefined,
        },
      });

      const isNewPrismaUser = upsertedUser.id === userId;

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
    } catch (error) {
      logger.error('Error in Google sign-up post-processing', error);
    }
  }

  /**
   * Called once the user's email address has been verified by SuperTokens.
   * Safe to fire welcome emails and assign a manager at this point.
   */
  static async handleEmailVerified(input: EmailVerifiedInput): Promise<void> {
    const { userId, email, fullName, selectedSolution, alreadyHasManager } = input;

    try {
      if (selectedSolution) {
        OnSignupService.sendClientOnboardingEmails({ fullName, email, selectedSolution });
      }

      if (!alreadyHasManager) {
        OnSignupService.assignManagerAsync(userId, fullName, email, selectedSolution as SolutionType);
      }

      logger.info(`Post-verification side effects completed for ${email}`);
    } catch (error) {
      logger.error('Failed to run post-verification side effects', error);
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private static sendClientOnboardingEmails(data: {
    fullName: string;
    email: string;
    selectedSolution: SolutionType;
  }) {
    sendClientWelcomeEmail(data).catch(err => logger.error('Welcome email failed', err));
    sendAdminNewClientAlert(data).catch(err => logger.error('Admin new client alert failed', err));
  }

  private static assignManagerAsync(
    clientId: string,
    clientName: string,
    clientEmail: string,
    selectedSolution: SolutionType
  ) {
    ManagerAssignmentService.assignManagerToClient(clientId, selectedSolution)
      .then(async (managerId) => {
        if (!managerId) {
          logger.warn(`No manager available for client ${clientId}`);
          return;
        }
        logger.info(`Manager ${managerId} auto-assigned to client ${clientId}`);

        const manager = await prisma.user.findUnique({
          where: { id: managerId },
          select: { fullName: true, email: true },
        });
        if (manager?.email) {
          sendManagerNewClientEmail({
            managerName: manager.fullName || 'there',
            managerEmail: manager.email,
            clientName,
            clientEmail,
            selectedSolution,
          }).catch(err => logger.error('Manager new client email failed', err));
        }
      })
      .catch((error) => logger.error('Manager auto-assignment failed', error));
  }
}

export default OnSignupService;
