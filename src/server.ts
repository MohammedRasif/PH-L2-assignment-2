import express, { type Application, type Request, type Response } from 'express';

import{Pool} from 'pg'

const pool = new Pool({
    connectionString:"postgresql://neondb_owner:npg_8W6crHpNIVoC@ep-still-lab-ap97xwix-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
})

const initDB = async () => {
  try{
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        age INT ,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
      console.log("Database created successfully")
  }
  catch(error){
    console.log("Database error", error)
  }
};
initDB();

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