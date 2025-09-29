import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { apiRouter } from "./routes";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api", apiRouter);

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  console.log(`  =================================
  ======= ENV: ${NODE_ENV} ========
  🚀 App listening on the port ${PORT}
  =================================`);
});
