"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var server_js_1 = __importDefault(require("./server/server.js"));
var port = process.env.PORT || 3000;
// Start the server
new server_js_1.default(Number(port));
//# sourceMappingURL=index.js.map