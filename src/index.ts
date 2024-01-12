import Server from "./server/server.js";
const port = process.env.PORT || 3000;
// Start the server
new Server(Number(port));