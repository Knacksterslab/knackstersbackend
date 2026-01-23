import { Response, NextFunction } from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { SessionRequest } from 'supertokens-node/framework/express';
import { UserRole } from '../config/supertokens';

// Extend Express Request type to include session
export interface AuthRequest extends SessionRequest {
  userId?: string;
  role?: UserRole;
}

// Middleware to verify session exists and set userId
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // First verify the session with SuperTokens
  await verifySession({
    sessionRequired: true,
    overrideGlobalClaimValidators: () => [],
  })(req, res, async (err?: any) => {
    if (err) return next(err);
    
    // After session is verified, set userId and role on the request
    if (req.session) {
      req.userId = req.session.getUserId();
      const payload = req.session.getAccessTokenPayload();
      req.role = payload.role as UserRole;
    }
    
    next();
  });
};

// Middleware to check specific roles
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const session = req.session;
      
      if (!session) {
        return _res.status(401).json({ error: 'Unauthorized' });
      }

      const payload = session.getAccessTokenPayload();
      const userRole = payload.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        return _res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      req.role = userRole;
      req.userId = session.getUserId();
      
      return next();
    } catch (error) {
      console.error('Role verification error:', error);
      return _res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Middleware to optionally check auth (doesn't fail if no session)
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.session) {
    const payload = req.session.getAccessTokenPayload();
    req.role = payload.role as UserRole;
    req.userId = req.session.getUserId();
  }
  next();
}
