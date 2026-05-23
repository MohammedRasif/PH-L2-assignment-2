import { Router } from "express";
import auth from "../../middleware/auth";
import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
} from "./contributor.controller";

const router = Router();

// public routes
router.get("/", getAllIssues);
router.get("/:id", getSingleIssue);

// authenticated routes (contributor + maintainer)
router.post("/", auth(["contributor", "maintainer"]), createIssue);
router.patch("/:id", auth(["contributor", "maintainer"]), updateIssue);

export const contributorRoute = router;