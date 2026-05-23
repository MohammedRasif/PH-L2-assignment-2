import type { Request, Response } from "express";
import { contributorService } from "./contributor.service";

export const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, description, type",
      });
    }

    if (!["bug", "feature_request"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'bug' or 'feature_request'",
      });
    }

    const reporterId = (req.user as any).userId;

    const issue = await contributorService.createIssueIntoDB(
      { title, description, type },
      reporterId,
    );

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: issue,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort = "newest", type, status } = req.query;

    const issues = await contributorService.getAllIssuesFromDB(
      sort as string,
      type as string | undefined,
      status as string | undefined,
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
        role: issue.reporter_role,
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const issue = await contributorService.getSingleIssueFromDB(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
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
          role: issue.reporter_role,
        },
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any).userId;
    const userRole = (req.user as any).role;

    const existingIssue = await contributorService.getIssueByIdFromDB(id);

    if (!existingIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // contributor can only update their own issue if status is open
    if (userRole === "contributor") {
      if (existingIssue.reporter_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You can only update your own issues",
        });
      }

      if (existingIssue.status !== "open") {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You can only update issues with status 'open'",
        });
      }
    }

    const { title, description, type } = req.body;

    const updated = await contributorService.updateIssueInDB(
      { title, description, type },
      id,
    );

    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
