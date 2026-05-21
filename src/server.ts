import express, { type Application, type Request, type Response } from 'express';

const app: Application = express()
const port: number = 5000

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