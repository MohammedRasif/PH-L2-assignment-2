

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Method - URL - Time:", req.method, req.url, Date.now());
  const log = `
Method -> ${req.method} - Time -> ${Date.now()} - URL -> ${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.controller.ts
import "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET || "your-secret-key-change-in-production"
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'contributor'`
    );
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Database error", error);
  }
};

// src/modules/auth/auth.service.ts
var authService = {
  getUserByEmail: async (email) => {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at, updated_at, password FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] ?? null;
  },
  registerUser: async (payload) => {
    const { name, email, password, role } = payload;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, hashedPassword, role]
    );
    return result.rows[0];
  },
  authenticateUser: async (payload) => {
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
  generateToken: (userId, role) => {
    return jwt.sign({ userId, role }, config_default.jwt_secret, { expiresIn: "7d" });
  }
};

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, email, password"
      });
    }
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }
    const user = await authService.registerUser({
      name,
      email,
      password,
      role: role || "contributor"
    });
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: email, password"
      });
    }
    const user = await authService.authenticateUser({ email, password });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const token = authService.generateToken(user.id, user.role);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", signupUser);
router.post("/login", loginUser);
var authRoute = router;

// src/modules/contributor/contributor.route.ts
import { Router as Router2 } from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (roles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!"
        });
      }
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
      const decoded = jwt2.verify(
        token,
        config_default.jwt_secret
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE id=$1`,
        [decoded.userId]
      );
      const user = userData.rows[0];
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!, This role have no access!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/contributor/contributor.service.ts
var contributorService = {
  createIssueIntoDB: async (payload, reporterId) => {
    const { title, description, type } = payload;
    const result = await pool.query(
      `INSERT INTO issues (title, description, type, reporter_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, type, reporterId]
    );
    return result.rows[0];
  },
  getAllIssuesFromDB: async (sort, type, status) => {
    const order = sort === "oldest" ? "ASC" : "DESC";
    const conditions = [];
    const values = [];
    let idx = 1;
    if (type) {
      conditions.push(`i.type = $${idx++}`);
      values.push(type);
    }
    if (status) {
      conditions.push(`i.status = $${idx++}`);
      values.push(status);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT i.*,
              u.id   AS reporter_user_id,
              u.name AS reporter_name,
              u.role AS reporter_role
       FROM issues i
       LEFT JOIN users u ON i.reporter_id = u.id
       ${whereClause}
       ORDER BY i.created_at ${order}`,
      values
    );
    return result.rows;
  },
  getSingleIssueFromDB: async (id) => {
    const result = await pool.query(
      `SELECT i.*,
              u.id   AS reporter_user_id,
              u.name AS reporter_name,
              u.role AS reporter_role
       FROM issues i
       LEFT JOIN users u ON i.reporter_id = u.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  },
  getIssueByIdFromDB: async (id) => {
    const result = await pool.query(
      `SELECT * FROM issues WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  },
  updateIssueInDB: async (payload, id) => {
    const result = await pool.query(
      `UPDATE issues
       SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         type        = COALESCE($3, type),
         updated_at  = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [payload.title ?? null, payload.description ?? null, payload.type ?? null, id]
    );
    return result.rows[0];
  }
};

// src/modules/contributor/contributor.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, description, type"
      });
    }
    if (!["bug", "feature_request"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'bug' or 'feature_request'"
      });
    }
    const reporterId = req.user.userId;
    const issue = await contributorService.createIssueIntoDB(
      { title, description, type },
      reporterId
    );
    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: issue
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort = "newest", type, status } = req.query;
    const issues = await contributorService.getAllIssuesFromDB(
      sort,
      type,
      status
    );
    const formatted = issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: issue.reporter_user_id,
        name: issue.reporter_name,
        role: issue.reporter_role
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at
    }));
    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const issue = await contributorService.getSingleIssueFromDB(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: {
          id: issue.reporter_user_id,
          name: issue.reporter_name,
          role: issue.reporter_role
        },
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const existingIssue = await contributorService.getIssueByIdFromDB(id);
    if (!existingIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    if (userRole === "contributor") {
      if (existingIssue.reporter_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You can only update your own issues"
        });
      }
      if (existingIssue.status !== "open") {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You can only update issues with status 'open'"
        });
      }
    }
    const { title, description, type } = req.body;
    const updated = await contributorService.updateIssueInDB(
      { title, description, type },
      id
    );
    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updated
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// src/modules/contributor/contributor.route.ts
var router2 = Router2();
router2.get("/", getAllIssues);
router2.get("/:id", getSingleIssue);
router2.post("/", auth_default(["contributor", "maintainer"]), createIssue);
router2.patch("/:id", auth_default(["maintainer"]), updateIssue);
var contributorRoute = router2;

// src/modules/maintainer/maintainer.route.ts
import { Router as Router3 } from "express";

// src/modules/maintainer/maintainer.service.ts
var maintainerService = {
  deleteIssueFromDB: async (id) => {
    const result = await pool.query(
      `DELETE FROM issues WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] ?? null;
  },
  updateIssueStatusInDB: async (status, id) => {
    const result = await pool.query(
      `UPDATE issues
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] ?? null;
  },
  getMetricsFromDB: async () => {
    const totalResult = await pool.query(`SELECT COUNT(*) AS total FROM issues`);
    const byStatusResult = await pool.query(
      `SELECT status, COUNT(*) AS count FROM issues GROUP BY status`
    );
    const byTypeResult = await pool.query(
      `SELECT type, COUNT(*) AS count FROM issues GROUP BY type`
    );
    const totalUsers = await pool.query(`SELECT COUNT(*) AS total FROM users`);
    const byRoleResult = await pool.query(
      `SELECT role, COUNT(*) AS count FROM users GROUP BY role`
    );
    const byStatus = {};
    byStatusResult.rows.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });
    const byType = {};
    byTypeResult.rows.forEach((row) => {
      byType[row.type] = parseInt(row.count, 10);
    });
    const byRole = {};
    byRoleResult.rows.forEach((row) => {
      byRole[row.role] = parseInt(row.count, 10);
    });
    return {
      issues: {
        total: parseInt(totalResult.rows[0].total, 10),
        by_status: byStatus,
        by_type: byType
      },
      users: {
        total: parseInt(totalUsers.rows[0].total, 10),
        by_role: byRole
      }
    };
  }
};

// src/modules/maintainer/maintainer.controller.ts
var deleteIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await maintainerService.deleteIssueFromDB(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
var updateIssueStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: status"
      });
    }
    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be 'open', 'in_progress', or 'resolved'"
      });
    }
    const updated = await maintainerService.updateIssueStatusInDB(status, id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
      data: updated
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
var getMetrics = async (req, res) => {
  try {
    const metrics = await maintainerService.getMetricsFromDB();
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// src/modules/maintainer/maintainer.route.ts
var router3 = Router3();
router3.delete("/:id", auth_default(["maintainer"]), deleteIssue);
router3.patch("/:id/status", auth_default(["maintainer"]), updateIssueStatus);
router3.get("/metrics", auth_default(["maintainer"]), getMetrics);
var maintainerRoute = router3;

// src/app.ts
var app = express();
app.use(express.json());
app.use(logger_default);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Issue Tracker API",
    author: "Next Level"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", contributorRoute);
app.use("/api/issues", maintainerRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map