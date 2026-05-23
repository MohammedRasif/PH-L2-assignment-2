import express, { type Application, type Request, type Response } from "express";
import logger from "./middleware/logger";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { authRoute } from "./modules/auth/auth.route";
import { contributorRoute } from "./modules/contributor/contributor.route";
import { maintainerRoute } from "./modules/maintainer/maintainer.route";

const app: Application = express();

app.use(express.json());
app.use(logger);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Issue Tracker API",
    author: "Next Level",
  });
});

// routes
app.use("/api/auth", authRoute);
app.use("/api/issues", contributorRoute);
app.use("/api/issues", maintainerRoute);

// global error handler
app.use(globalErrorHandler);

export default app;