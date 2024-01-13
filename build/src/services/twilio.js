"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lib_1 = require("twilio/lib");
var dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + "/.env" });
var _a = process.env, twilio_account_sid = _a.twilio_account_sid, twilio_auth_token = _a.twilio_auth_token;
var isTest = process.env.NODE_ENV === "test";
var accountSid = isTest ? "" : twilio_account_sid;
var authToken = isTest ? "" : twilio_auth_token;
var client = isTest ? null : new lib_1.Twilio(accountSid, authToken);
exports.default = client;
//# sourceMappingURL=twilio.js.map