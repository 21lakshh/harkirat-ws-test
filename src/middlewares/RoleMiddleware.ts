import { Request, Response, NextFunction } from "express";

export function RoleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { userId, role } = req.user || {};

    if (!userId || !role) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    next();
  };
}
