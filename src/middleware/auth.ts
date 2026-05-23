import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
      }

      // support both: "Authorization: <token>" and "Authorization: Bearer <token>"
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      const decoded = jwt.verify(
        token,
        config.jwt_secret,
      ) as jwt.JwtPayload;

      const userData = await pool.query(
        `SELECT * FROM users WHERE id=$1`,
        [decoded.userId],
      );

      const user = userData.rows[0];

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found!",
        });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!, This role have no access!",
        });
      }

      req.user = decoded;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
