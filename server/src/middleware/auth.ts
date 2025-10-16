import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth";

export interface AuthRequest extends Request {
  user?: any;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("🔐 Authenticating request...");

    // Try to get token from cookies first (web), then fallback to Authorization header (mobile)
    let token = req.cookies.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        console.log("📱 Using Bearer token from header (mobile)");
      }
    } else {
      console.log("🍪 Using token from cookie (web)");
    }

    if (!token) {
      console.log("❌ No token found in cookies or headers");
      return res.status(401).json({
        success: false,
        error: "Missing or invalid authorization",
      });
    }

    console.log("🔍 Verifying token...");
    const user = await AuthService.verifyToken(token);
    console.log("✅ Token verified for user:", user.user_id);

    req.user = user;
    next();
  } catch (error: any) {
    console.error("💥 Token verification failed:", error.message);

    // Check if it's a database connection error
    if (
      error.message?.includes("Can't reach database server") ||
      error.message?.includes("connection")
    ) {
      return res.status(503).json({
        success: false,
        error: "Database temporarily unavailable, please try again",
        retryAfter: 5,
      });
    }

    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
}
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if user has admin privileges
    if (!req.user.is_admin && !req.user.is_super_admin) {
      console.warn(
        `⚠️ Unauthorized admin access attempt by user: ${req.user.email}`
      );
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions. Admin access required.",
      });
    }

    // Additional security: Verify email is verified
    if (!req.user.email_verified) {
      return res.status(403).json({
        success: false,
        error: "Email verification required for admin access",
      });
    }

    console.log(`✅ Admin access granted to: ${req.user.email}`);
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({
      success: false,
      error: "Authorization failed",
    });
  }
};
// Super admin middleware for sensitive operations
export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Must have super admin flag
    if (!req.user.is_super_admin) {
      console.warn(
        `⚠️ Unauthorized super admin access attempt by: ${req.user.email}`
      );
      return res.status(403).json({
        success: false,
        error: "Super admin access required",
      });
    }

    // Additional security check
    if (!req.user.email_verified) {
      return res.status(403).json({
        success: false,
        error: "Email verification required for super admin access",
      });
    }

    console.log(`✅ Super admin access granted to: ${req.user.email}`);
    next();
  } catch (error) {
    console.error("Super admin authorization error:", error);
    res.status(500).json({
      success: false,
      error: "Authorization failed",
    });
  }
};
