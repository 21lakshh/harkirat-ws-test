import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function AuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader =
    req.headers.authorization?.toString() ||
    req.headers.Authorization?.toString() ||
    "";

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "lakshya") as {
    userId: number;
    role: string;
  };

  if (!decoded) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  req.user = {
    userId: decoded.userId,
    role: decoded.role,
  };
  next();
}
