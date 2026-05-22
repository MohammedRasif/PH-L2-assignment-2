import dotenv from "dotenv"
import path from "path"

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
    connection_string: process.env.CONNECTIONSTRING as string,
    port: process.env.PORT as string,
    jwt_secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
}

export default config
