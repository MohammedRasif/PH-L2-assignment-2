import express, { type Application, type Request, type Response } from 'express';

const app: Application = express()

app.get('/', (req: Request, res: Response) => {
//   res.send('Hello World!')
    res.status(200).json({
        "message" : "Express Server",
        "author" : "Next Level"
    })
})

export default app