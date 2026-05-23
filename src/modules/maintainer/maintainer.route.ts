import { Router } from "express";
import auth from "../../middleware/auth";
import {
  deleteIssue,
  updateIssueStatus,
  getMetrics,
} from "./maintainer.controller";

const router = Router();

router.delete("/:id", auth(["maintainer"]), deleteIssue);
router.patch("/:id/status", auth(["maintainer"]), updateIssueStatus);
router.get("/metrics", auth(["maintainer"]), getMetrics);

export const maintainerRoute = router;
