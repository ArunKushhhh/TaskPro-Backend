import dotenv from "dotenv";
import { app } from "./app.js";
import {connectDB} from "./db/db.js"

dotenv.config();

const port = process.env.PORT || 5173;

connectDB()
  .then(
    app.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    })
  )
  .catch((error) => {
    console.error("Error connecting to MongoDB: ", error);
    process.exit(1);
  });
