import { pool } from "../../db/index";
import type { CreateIssuePayload, UpdateIssuePayload } from "./contributor.interface";

export const contributorService = {
  createIssueIntoDB: async (payload: CreateIssuePayload, reporterId: number) => {
    const { title, description, type } = payload;

    const result = await pool.query(
      `INSERT INTO issues (title, description, type, reporter_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, type, reporterId],
    );

    return result.rows[0];
  },

  getAllIssuesFromDB: async (sort: string, type?: string, status?: string) => {
    const order = sort === "oldest" ? "ASC" : "DESC";
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (type) {
      conditions.push(`i.type = $${idx++}`);
      values.push(type);
    }

    if (status) {
      conditions.push(`i.status = $${idx++}`);
      values.push(status);
    }

    const whereClause =
      conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT i.*,
              u.id   AS reporter_user_id,
              u.name AS reporter_name,
              u.role AS reporter_role
       FROM issues i
       LEFT JOIN users u ON i.reporter_id = u.id
       ${whereClause}
       ORDER BY i.created_at ${order}`,
      values,
    );

    return result.rows;
  },

  getSingleIssueFromDB: async (id: string) => {
    const result = await pool.query(
      `SELECT i.*,
              u.id   AS reporter_user_id,
              u.name AS reporter_name,
              u.role AS reporter_role
       FROM issues i
       LEFT JOIN users u ON i.reporter_id = u.id
       WHERE i.id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  },

  getIssueByIdFromDB: async (id: string) => {
    const result = await pool.query(
      `SELECT * FROM issues WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  },

  updateIssueInDB: async (payload: UpdateIssuePayload, id: string) => {
    const result = await pool.query(
      `UPDATE issues
       SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         type        = COALESCE($3, type),
         updated_at  = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [payload.title ?? null, payload.description ?? null, payload.type ?? null, id],
    );

    return result.rows[0];
  },
};
