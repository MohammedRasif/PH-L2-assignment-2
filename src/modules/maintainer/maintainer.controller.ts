import type { Request, Response } from "express";
import { maintainerService } from "./maintainer.service";

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const deleted = await maintainerService.deleteIssueFromDB(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: status",
      });
    }

    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be 'open', 'in_progress', or 'resolved'",
      });
    }

    const updated = await maintainerService.updateIssueStatusInDB(status, id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
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

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await maintainerService.getMetricsFromDB();

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
