import express from "express";
import Twilio from "twilio";
const { MessagingResponse } = Twilio.twiml;
import bodyParser from "body-parser";
import logic from "./src/logic.js";
import logger from "./src/services/logger.js";
import reportingModel from "./model/reporting.js";

const app = express();
const port = process.env.PORT || 3000;

// Set up body-parser middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.post("/webhook", async (req, res) => {
  logger.info("Request received on /webhook: " + JSON.stringify(req.body));
  const response = await logic.decipherMessage(req.body);
  const twimlRes = new MessagingResponse();
  twimlRes.message(response);
  res.type("text/xml").send(twimlRes.toString());
  try {
    reportingModel.incrementCount({ fieldName: 'responseCount' });
  } catch (err) {
    logger.error("Failed to increment response count", err.message);
  }
});

app.get("/status", async (req, res) => {
  res.sendStatus(200);
});

// Start the server
app.listen(port, () => console.log(`Server started on port ${port}`));
