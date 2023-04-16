import express from "express";
import bodyParser from "body-parser";
import logic from "./lib/logic.js";
import logger from "./lib/services/logger.js";

const app = express();
const port = process.env.PORT || 3000;

// Set up body-parser middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.post("/webhook", async (req, res) => {
  logger.info("Request received on /webhook: " + JSON.stringify(req.body));
  await logic.decipherMessage(req.body);
  res.sendStatus(200);
});

app.get("/status", async (req, res) => {
  res.sendStatus(200);
});

// Start the server
app.listen(port, () => console.log(`Server started on port ${port}`));
