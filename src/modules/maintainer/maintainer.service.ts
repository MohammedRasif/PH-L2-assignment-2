import { pool } from "../../db/index";

export const maintainerService = {
  deleteIssueFromDB: async (id: string) => {
    const result = await pool.query(
      `DELETE FROM issues WHERE id = $1 RETURNING *`,
      [id],
    );

    return result.rows[0] ?? null;
  },

  updateIssueStatusInDB: async (status: string, id: string) => {
    const result = await pool.query(
      `UPDATE issues
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id],
    );

    return result.rows[0] ?? null;
  },

  getMetricsFromDB: async () => {
    const totalResult = await pool.query(`SELECT COUNT(*) AS total FROM issues`);

    const byStatusResult = await pool.query(
      `SELECT status, COUNT(*) AS count FROM issues GROUP BY status`,
    );

    const byTypeResult = await pool.query(
      `SELECT type, COUNT(*) AS count FROM issues GROUP BY type`,
    );

    const totalUsers = await pool.query(`SELECT COUNT(*) AS total FROM users`);

    const byRoleResult = await pool.query(
      `SELECT role, COUNT(*) AS count FROM users GROUP BY role`,
    );

    const byStatus: Record<string, number> = {};
    byStatusResult.rows.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const byType: Record<string, number> = {};
    byTypeResult.rows.forEach((row) => {
      byType[row.type] = parseInt(row.count, 10);
    });

    const byRole: Record<string, number> = {};
    byRoleResult.rows.forEach((row) => {
      byRole[row.role] = parseInt(row.count, 10);
    });

    return {
      issues: {
        total: parseInt(totalResult.rows[0].total, 10),
        by_status: byStatus,
        by_type: byType,
      },
      users: {
        total: parseInt(totalUsers.rows[0].total, 10),
        by_role: byRole,
      },
    };
  },
};
