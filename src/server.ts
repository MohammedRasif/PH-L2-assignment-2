import app from "./app";
import { initDB } from "./db/index"
import config from "./config";

const main = () => {
 initDB();
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`)
})
}

main()