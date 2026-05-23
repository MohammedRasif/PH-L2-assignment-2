import { Router } from "express";
import auth from "../../middleware/auth";
import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
} from "./contributor.controller";

const router = Router();

router.get("/", getAllIssues);
router.get("/:id", getSingleIssue);

router.post("/", auth(["contributor", "maintainer"]), createIssue);
router.patch("/:id", auth(["contributor", "maintainer"]), updateIssue);

export const contributorRoute = router;