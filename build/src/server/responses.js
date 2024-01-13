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
var dotenv = __importStar(require("dotenv"));
var path = process.env.NODE_ENV === "test" ? "example.env" : ".env";
dotenv.config({ path: __dirname + path });
var support_number_human_readable = process.env.support_number_human_readable;
var responses = {
    SET_MESSAGE: "Default message has been set",
    VALID_CAMPAIGN_CODE: "You have been signed up to receive notifications. If at any point you want to stop receiving messages, text STOP",
    SEND_CODE: "Messages for '%CODE%' are now sending to %COUNT% subscribers",
    ADD_CODE: "Successfully added code '%CODE%'",
    REMOVE_CODE: "Successfully removed code '%CODE%'",
    CHANGE_CODE: "Successfully changed code '%CODE1%' to '%CODE2%'",
    CUSTOM_MESSAGE: "Your custom message is sending to %COUNT% subscribers",
    ADD_ADMIN: "Added '%PHONE%' as an admin.",
    FAILED_PARSE_PHONE: "Failed to parse '%PHONE%' as a phone number.",
    REMOVE_ADMIN: "Removed '%PHONE%' as an admin.",
    STATUS: "RUNNING",
    SHUTDOWN: "Shutting down...",
    DEFAULT_MESSAGE: "Your milk has been delivered. Pick up at your earliest convenience during location hours.",
    UNKNOWN: "We don't recognize that code",
    ERROR: "Something went wrong with that request. Contact ".concat(support_number_human_readable, " for assistance"),
};
exports.default = responses;
//# sourceMappingURL=responses.js.map