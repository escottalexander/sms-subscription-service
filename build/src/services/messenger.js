"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var twilio_js_1 = __importDefault(require("./twilio.js"));
var logger_js_1 = __importDefault(require("./logger.js"));
var isTest = process.env.NODE_ENV === "test";
var messenger = {
    send: function (fromNumber, toNumber, message) { return __awaiter(void 0, void 0, void 0, function () {
        var response, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isTest) {
                        return [2 /*return*/, true];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (twilio_js_1.default === null || twilio_js_1.default === void 0 ? void 0 : twilio_js_1.default.messages.create({
                            body: message,
                            from: fromNumber,
                            to: toNumber,
                        }))];
                case 2:
                    response = _a.sent();
                    if (response && response.errorCode) {
                        logger_js_1.default.error("Received error from Twilio: " + response.errorMessage);
                        return [2 /*return*/, false];
                    }
                    logger_js_1.default.info("Sent message to ".concat(toNumber, ": \"").concat(message, "\" \n Received status '").concat(response === null || response === void 0 ? void 0 : response.status, "'"));
                    return [2 /*return*/, true];
                case 3:
                    e_1 = _a.sent();
                    logger_js_1.default.error("Failed to send message: " + JSON.stringify(e_1.message));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); },
};
exports.default = messenger;
// Example response
// {
//   "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   "api_version": "2010-04-01",
//   "body": "This is the ship that made the Kessel Run in fourteen parsecs?",
//   "date_created": "Thu, 30 Jul 2015 20:12:31 +0000",
//   "date_sent": "Thu, 30 Jul 2015 20:12:33 +0000",
//   "date_updated": "Thu, 30 Jul 2015 20:12:33 +0000",
//   "direction": "outbound-api",
//   "error_code": null,
//   "error_message": null,
//   "from": "+15017122661",
//   "messaging_service_sid": null,
//   "num_media": "0",
//   "num_segments": "1",
//   "price": null,
//   "price_unit": null,
//   "sid": "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   "status": "sent",
//   "subresource_uris": {
//     "media": "/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Messages/SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Media.json"
//   },
//   "to": "+15558675310",
//   "uri": "/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Messages/SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json"
// }
//# sourceMappingURL=messenger.js.map