import { Pool } from "pg";
import config from "../config/index";

export const pool = new Pool({
    connectionString:config.connection_string,
})

export const initDB = async () => {
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

