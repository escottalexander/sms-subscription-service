import express, { Express} from "express";
import * as bodyParser from "body-parser";
import connect from "../services/mongodb.js";
import MessageHandler from "./messageHandler.js";
import logger from "../services/logger.js";

class Server {
  app: Express;
  port: number;
  messageHandler: MessageHandler;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.init();
  }

  async init() {
    try {
      const storage = await connect();
      this.messageHandler = new MessageHandler(storage);
      this.startServer();
    } catch (err: any) {
      logger.error(JSON.stringify(err.message));
    }
  }

  async startServer() {
    // Set up body-parser middleware to parse incoming request bodies
     this.app.use(bodyParser.json());
     this.app.use(express.urlencoded({ extended: true }));

     this.app.post("/webhook", async (req, res) => {
      try {
        await this.messageHandler.handle(req, res);
      } catch (err: any) {
        logger.error(JSON.stringify(err.message));
        res.sendStatus(500);
      }
    });

     this.app.get("/status", async (req, res) => {
      res.sendStatus(200);
    });

    // Start the server
     this.app.listen(this.port, () => console.log(`Server started on port ${this.port}`));
  }

}

export default Server;