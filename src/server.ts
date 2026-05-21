import express, { type Application, type Request, type Response } from 'express';

import{Pool} from 'pg'
import { initDB } from './db/index';
import config from './config/index';

initDB();

const app: Application = express()
const port = config.port;

app.get('/', (req: Request, res: Response) => {
//   res.send('Hello World!')
    res.status(200).json({
        "message" : "Express Server",
        "author" : "Next Level"
    })
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})