import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../db/index";
import config from "../../config/index";
import type { LoginPayload, RegisterPayload } from "./auth.interface";

export const authService = {
  getUserByEmail: async (email: string) => {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at, updated_at, password FROM users WHERE email = $1`,
      [email]
    );

    return result.rows[0] ?? null;
  },

  registerUser: async (payload: RegisterPayload) => {
    const { name, email, password, role } = payload;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, hashedPassword, role]
    );

    return result.rows[0];
  },

  authenticateUser: async (payload: LoginPayload) => {
    const { email, password } = payload;
    const result = await pool.query(
      `SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) return null;

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return null;

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  generateToken: (userId: number, role: string) => {
    return jwt.sign({ userId, role }, config.jwt_secret, { expiresIn: "7d" });
  },
};
