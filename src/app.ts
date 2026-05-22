import express, { type Application, type Request, type Response } from 'express';
import { contributorRoute } from './modules/contributor/contributor.route';
import { authRoute } from './modules/auth/auth.route';

const app: Application = express()

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Next Level",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/users", contributorRoute);

export default app