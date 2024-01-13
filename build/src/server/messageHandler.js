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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var messenger_js_1 = __importDefault(require("../services/messenger.js"));
var logger_js_1 = __importDefault(require("../services/logger.js"));
var libphonenumber_js_1 = __importDefault(require("libphonenumber-js"));
var responses_js_1 = __importDefault(require("./responses.js"));
var entities_js_1 = require("../model/entities.js");
var state_js_1 = require("../model/state.js");
var phoneNumbers_js_1 = require("../model/phoneNumbers.js");
var reporting_js_1 = require("../model/reporting.js");
var lib_1 = require("twilio/lib");
var MessagingResponse = lib_1.twiml.MessagingResponse;
var MessageHandler = /** @class */ (function () {
    function MessageHandler(storage) {
        this.models = {
            entity: new entities_js_1.EntityModel(storage),
            phoneNumber: new phoneNumbers_js_1.PhoneNumberModel(storage),
            reporting: new reporting_js_1.ReportingModel(storage),
            state: new state_js_1.StateModel(storage),
        };
    }
    MessageHandler.prototype.handle = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var requestContext, response, twimlRes, entityId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_js_1.default.info("Request received on /webhook: " + JSON.stringify(req.body));
                        return [4 /*yield*/, this.getRequestContext(req.body)];
                    case 1:
                        requestContext = _a.sent();
                        return [4 /*yield*/, this.decipherMessage(requestContext, req.body)];
                    case 2:
                        response = _a.sent();
                        if (response) {
                            twimlRes = new MessagingResponse();
                            twimlRes.message(response);
                            res.type("text/xml");
                            res.send(twimlRes.toString());
                            try {
                                entityId = requestContext.entity.entityId;
                                this.models.reporting.incrementCount({ entityId: entityId, fieldName: 'responseCount' });
                            }
                            catch (err) {
                                logger_js_1.default.error("Failed to increment response count", err.message);
                            }
                        }
                        else {
                            res.sendStatus(200);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.getRequestContext = function (reqBody) {
        return __awaiter(this, void 0, void 0, function () {
            var message, fromPhone, entityPhone, entity, entityId, fromPhoneNumberEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = reqBody.Body, fromPhone = reqBody.From, entityPhone = reqBody.To;
                        return [4 /*yield*/, this.models.entity.findByPhoneNumber(entityPhone)];
                    case 1:
                        entity = _a.sent();
                        entityId = entity.entityId;
                        return [4 /*yield*/, this.models.phoneNumber.findByPhoneNumber({
                                entityId: entityId,
                                phoneNumber: fromPhone,
                            })];
                    case 2:
                        fromPhoneNumberEntry = _a.sent();
                        return [2 /*return*/, {
                                message: message,
                                entity: entity,
                                fromPhone: fromPhone,
                                fromPhoneNumberEntry: fromPhoneNumberEntry,
                            }];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.decipherMessage = function (requestContext, reqBody) {
        return __awaiter(this, void 0, void 0, function () {
            var message, fromPhone, fromPhoneNumberEntry, entity, entityId, entityPhone, _a, campaignCodes, _b, subExists, fieldName, strCmd, count, messageName, newAdmin, response, admin, response, count, name, message_1, message_2, message_3, name, message_4, lastCode, e_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 43, , 44]);
                        message = requestContext.message, fromPhone = requestContext.fromPhone, fromPhoneNumberEntry = requestContext.fromPhoneNumberEntry, entity = requestContext.entity;
                        entityId = entity.entityId, entityPhone = entity.accountPhoneNumber, _a = entity.campaignCodes, campaignCodes = _a === void 0 ? [] : _a;
                        message = message.toUpperCase().trim();
                        _b = message;
                        switch (_b) {
                            case "STOP": return [3 /*break*/, 1];
                            case "UNSTOP": return [3 /*break*/, 3];
                            case "START": return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.endSubscription(entityId, fromPhone)];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                    case 3: return [4 /*yield*/, this.startSubscription(entityId, fromPhone)];
                    case 4:
                        _c.sent();
                        return [2 /*return*/];
                    case 5:
                        if (!campaignCodes.includes(message)) return [3 /*break*/, 8];
                        subExists = fromPhoneNumberEntry;
                        // If they are already signed up for this code just send a confirmed message
                        if (subExists && subExists.campaignCode == message) {
                            return [2 /*return*/, responses_js_1.default.VALID_CAMPAIGN_CODE];
                        }
                        return [4 /*yield*/, this.models.phoneNumber.createOrUpdate({
                                entityId: entityId,
                                phoneNumber: fromPhone,
                                campaignCode: message,
                                isActive: true,
                            })];
                    case 6:
                        _c.sent();
                        fieldName = subExists ? "changeSubscriptionCount" : "startSubscriptionCount";
                        return [4 /*yield*/, this.models.reporting.incrementCount({ entityId: entityId, campaignCode: message, fieldName: fieldName })];
                    case 7:
                        _c.sent();
                        return [2 /*return*/, responses_js_1.default.VALID_CAMPAIGN_CODE];
                    case 8:
                        if (!(fromPhoneNumberEntry && fromPhoneNumberEntry.isAdmin && fromPhoneNumberEntry.isActive)) return [3 /*break*/, 42];
                        if (!(message.split(" ").length > 1)) return [3 /*break*/, 41];
                        strCmd = message.split(" ");
                        if (!(strCmd[0] === "SEND" && campaignCodes.includes(strCmd[1]))) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.handleDeliveryMessage(entityPhone, entityId, strCmd[1])];
                    case 9:
                        count = _c.sent();
                        return [2 /*return*/, responses_js_1.default.SEND_CODE.replace("%CODE%", strCmd[1]).replace("%COUNT%", count.toString())];
                    case 10:
                        if (!(strCmd[0] === "SEND" && strCmd[1].includes("MESSAGE:") && campaignCodes.includes(strCmd[2]))) return [3 /*break*/, 12];
                        messageName = strCmd[1].replace("MESSAGE:", "");
                        return [4 /*yield*/, this.sendNamedMessage(entityPhone, entityId, messageName, strCmd[2])];
                    case 11: return [2 /*return*/, _c.sent()];
                    case 12:
                        if (!(strCmd[0] === "ADD")) return [3 /*break*/, 17];
                        if (!(strCmd[1] === "ADMIN" && strCmd[2])) return [3 /*break*/, 14];
                        newAdmin = strCmd.join("").replace("ADDADMIN", "");
                        return [4 /*yield*/, this.addAdmin(entityId, newAdmin)];
                    case 13:
                        response = _c.sent();
                        return [2 /*return*/, response];
                    case 14:
                        if (!(strCmd[1] === "CODE" &&
                            strCmd[2] &&
                            strCmd[2] !== "STOP")) return [3 /*break*/, 16];
                        // Disallow STOP as a campaignCode
                        // add campaign code
                        return [4 /*yield*/, this.addCampaignCode(entityId, strCmd[2])];
                    case 15:
                        // Disallow STOP as a campaignCode
                        // add campaign code
                        _c.sent();
                        return [2 /*return*/, responses_js_1.default.ADD_CODE.replace("%CODE%", strCmd[2])];
                    case 16: return [3 /*break*/, 40];
                    case 17:
                        if (!(strCmd[0] === "REMOVE")) return [3 /*break*/, 22];
                        if (!(strCmd[1] === "ADMIN" && strCmd[2])) return [3 /*break*/, 19];
                        admin = strCmd.join("").replace("REMOVEADMIN", "");
                        return [4 /*yield*/, this.removeAdmin(entityId, admin)];
                    case 18:
                        response = _c.sent();
                        return [2 /*return*/, response];
                    case 19:
                        if (!(strCmd[1] === "CODE" && strCmd[2])) return [3 /*break*/, 21];
                        // remove campaign code
                        return [4 /*yield*/, this.removeCampaignCode(entityId, strCmd[2])];
                    case 20:
                        // remove campaign code
                        _c.sent();
                        return [2 /*return*/, responses_js_1.default.REMOVE_CODE.replace("%CODE%", strCmd[2])];
                    case 21: return [3 /*break*/, 40];
                    case 22:
                        if (!(strCmd[0] === "CHANGE" &&
                            strCmd[1] === "CODE" &&
                            strCmd[2] &&
                            strCmd[3] &&
                            strCmd[3] !== "STOP")) return [3 /*break*/, 24];
                        // Disallow STOP as a campaignCode
                        // change code and all subscribers
                        return [4 /*yield*/, this.changeCampaignCode(entityId, strCmd[2], strCmd[3])];
                    case 23:
                        // Disallow STOP as a campaignCode
                        // change code and all subscribers
                        _c.sent();
                        return [2 /*return*/, responses_js_1.default.CHANGE_CODE.replace("%CODE1%", strCmd[2]).replace("%CODE2%", strCmd[3])];
                    case 24:
                        if (!(strCmd[0] === "CUSTOM" &&
                            (campaignCodes.includes(strCmd[1]) || strCmd[1] === "ALL") &&
                            strCmd[2])) return [3 /*break*/, 26];
                        return [4 /*yield*/, this.sendCustomMessage(entityPhone, entityId, strCmd[1], reqBody.Body)];
                    case 25:
                        count = _c.sent();
                        return [2 /*return*/, responses_js_1.default.CUSTOM_MESSAGE.replace("%COUNT%", count.toString())];
                    case 26:
                        if (!(strCmd[0] === "SET" &&
                            strCmd[1] === "MESSAGE" &&
                            strCmd[2])) return [3 /*break*/, 28];
                        return [4 /*yield*/, this.setDefaultMessage(entityId, reqBody.Body)];
                    case 27:
                        _c.sent();
                        return [2 /*return*/, responses_js_1.default.SET_MESSAGE];
                    case 28:
                        if (!(strCmd[0] === "SET" &&
                            strCmd[1].includes("MESSAGE:") &&
                            strCmd[2])) return [3 /*break*/, 30];
                        name = strCmd[1].replace("MESSAGE:", "");
                        return [4 /*yield*/, this.setMessage(entityId, name, reqBody.Body)];
                    case 29:
                        _c.sent();
                        return [2 /*return*/, responses_js_1.default.SET_NAMED_MESSAGE.replace("%NAME%", name)];
                    case 30:
                        if (!(strCmd[0] === "SET" &&
                            strCmd[1] === "DEFAULT" &&
                            strCmd[2])) return [3 /*break*/, 32];
                        return [4 /*yield*/, this.setDefaultMessageByName(entityId, strCmd[2])];
                    case 31:
                        message_1 = _c.sent();
                        return [2 /*return*/, message_1];
                    case 32:
                        if (!(strCmd[0] === "GET" &&
                            strCmd[1] === "MESSAGE" &&
                            strCmd[2] === "NAMES")) return [3 /*break*/, 34];
                        return [4 /*yield*/, this.getMessageNames(entityId)];
                    case 33:
                        message_2 = _c.sent();
                        return [2 /*return*/, message_2];
                    case 34:
                        if (!(strCmd[0] === "GET" &&
                            strCmd[1] === "MESSAGE")) return [3 /*break*/, 36];
                        return [4 /*yield*/, this.getDefaultMessage(entityId)];
                    case 35:
                        message_3 = _c.sent();
                        return [2 /*return*/, message_3];
                    case 36:
                        if (!(strCmd[0] === "GET" &&
                            strCmd[1].includes("MESSAGE:"))) return [3 /*break*/, 38];
                        name = strCmd[1].replace("MESSAGE:", "");
                        return [4 /*yield*/, this.getMessage(entityId, name)];
                    case 37:
                        message_4 = _c.sent();
                        return [2 /*return*/, message_4];
                    case 38:
                        if (!(strCmd[0] === "GET" &&
                            strCmd[1] === "LAST" &&
                            strCmd[2] === "CODE")) return [3 /*break*/, 40];
                        return [4 /*yield*/, this.getLastCode(entityId)];
                    case 39:
                        lastCode = _c.sent();
                        return [2 /*return*/, lastCode];
                    case 40: return [3 /*break*/, 42];
                    case 41:
                        if (message === "STATUS") {
                            // Status check
                            return [2 /*return*/, responses_js_1.default.STATUS];
                        }
                        else if (message === "SHUTDOWN") {
                            // Shut down process
                            setTimeout(this.shutDownProcess, 1000);
                            return [2 /*return*/, responses_js_1.default.SHUTDOWN];
                        }
                        _c.label = 42;
                    case 42: 
                    // Default to this if nothing else was hit
                    return [2 /*return*/, responses_js_1.default.UNKNOWN];
                    case 43:
                        e_1 = _c.sent();
                        logger_js_1.default.error(e_1.message);
                        return [2 /*return*/, responses_js_1.default.ERROR];
                    case 44: return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.startSubscription = function (entityId, phoneNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var sub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.phoneNumber.createOrUpdate({
                            entityId: entityId,
                            phoneNumber: phoneNumber,
                            isActive: true,
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.models.phoneNumber.findByPhoneNumber({ entityId: entityId, phoneNumber: phoneNumber })];
                    case 2:
                        sub = _a.sent();
                        return [4 /*yield*/, this.models.reporting.incrementCount({ entityId: entityId, campaignCode: sub.campaignCode, fieldName: "startSubscriptionCount" })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.endSubscription = function (entityId, phoneNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var sub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.phoneNumber.findByPhoneNumber({ entityId: entityId, phoneNumber: phoneNumber })];
                    case 1:
                        sub = _a.sent();
                        return [4 /*yield*/, this.models.phoneNumber.createOrUpdate({
                                entityId: entityId,
                                phoneNumber: phoneNumber,
                                isActive: false,
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.models.reporting.incrementCount({ entityId: entityId, campaignCode: sub.campaignCode, fieldName: "endSubscriptionCount" })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.handleDeliveryMessage = function (entityPhone, entityId, campaignCode) {
        return __awaiter(this, void 0, void 0, function () {
            var subscribers, message, subscribers_1, subscribers_1_1, sub, success, e_2_1;
            var e_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.models.phoneNumber.findAllByCode({ entityId: entityId, campaignCode: campaignCode })];
                    case 1:
                        subscribers = _b.sent();
                        return [4 /*yield*/, this.models.entity.getDefaultMessage(entityId)];
                    case 2:
                        message = _b.sent();
                        if (!message) {
                            message = responses_js_1.default.DEFAULT_MESSAGE;
                        }
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 10, 11, 12]);
                        subscribers_1 = __values(subscribers), subscribers_1_1 = subscribers_1.next();
                        _b.label = 4;
                    case 4:
                        if (!!subscribers_1_1.done) return [3 /*break*/, 9];
                        sub = subscribers_1_1.value;
                        return [4 /*yield*/, messenger_js_1.default.send(entityPhone, sub.phoneNumber, message)];
                    case 5:
                        success = _b.sent();
                        return [4 /*yield*/, this.models.phoneNumber.incrementSendCount({ entityId: entityId, phoneNumber: sub.phoneNumber, success: success })];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, this.models.reporting.incrementCount({ entityId: entityId, campaignCode: campaignCode, fieldName: success ? "sentCount" : "failedCount" })];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8:
                        subscribers_1_1 = subscribers_1.next();
                        return [3 /*break*/, 4];
                    case 9: return [3 /*break*/, 12];
                    case 10:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 12];
                    case 11:
                        try {
                            if (subscribers_1_1 && !subscribers_1_1.done && (_a = subscribers_1.return)) _a.call(subscribers_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 12: 
                    // Update lastCode
                    return [4 /*yield*/, this.models.entity.setLastCode(entityId, campaignCode)];
                    case 13:
                        // Update lastCode
                        _b.sent();
                        return [2 /*return*/, subscribers.length];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.sendCustomMessage = function (entityPhone, entityId, campaignCode, unparsedMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var subscribers, message, subscribers_2, subscribers_2_1, sub, success, e_3_1;
            var e_3, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.models.phoneNumber.findAllByCode({ entityId: entityId, campaignCode: campaignCode })];
                    case 1:
                        subscribers = _b.sent();
                        message = unparsedMessage.split(" ").splice(2).join(" ");
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 9, 10, 11]);
                        subscribers_2 = __values(subscribers), subscribers_2_1 = subscribers_2.next();
                        _b.label = 3;
                    case 3:
                        if (!!subscribers_2_1.done) return [3 /*break*/, 8];
                        sub = subscribers_2_1.value;
                        return [4 /*yield*/, messenger_js_1.default.send(entityPhone, sub.phoneNumber, message)];
                    case 4:
                        success = _b.sent();
                        return [4 /*yield*/, this.models.phoneNumber.incrementSendCount({ entityId: entityId, phoneNumber: sub.phoneNumber, success: success })];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, this.models.reporting.incrementCount({ entityId: entityId, campaignCode: campaignCode, fieldName: success ? "sentCount" : "failedCount" })];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        subscribers_2_1 = subscribers_2.next();
                        return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_3_1 = _b.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (subscribers_2_1 && !subscribers_2_1.done && (_a = subscribers_2.return)) _a.call(subscribers_2);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 11: return [4 /*yield*/, this.models.entity.setLastCode(entityId, campaignCode)];
                    case 12:
                        _b.sent();
                        return [2 /*return*/, subscribers.length];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.sendNamedMessage = function (entityPhone, entityId, messageName, campaignCode) {
        return __awaiter(this, void 0, void 0, function () {
            var message, subscribers, subscribers_3, subscribers_3_1, sub, success, e_4_1, count;
            var e_4, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.models.entity.getMessage(entityId, messageName)];
                    case 1:
                        message = _b.sent();
                        if (!message) {
                            return [2 /*return*/, responses_js_1.default.UNKNOWN_MSG_NAME];
                        }
                        return [4 /*yield*/, this.models.phoneNumber.findAllByCode({ entityId: entityId, campaignCode: campaignCode })];
                    case 2:
                        subscribers = _b.sent();
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 10, 11, 12]);
                        subscribers_3 = __values(subscribers), subscribers_3_1 = subscribers_3.next();
                        _b.label = 4;
                    case 4:
                        if (!!subscribers_3_1.done) return [3 /*break*/, 9];
                        sub = subscribers_3_1.value;
                        return [4 /*yield*/, messenger_js_1.default.send(entityPhone, sub.phoneNumber, message)];
                    case 5:
                        success = _b.sent();
                        return [4 /*yield*/, this.models.phoneNumber.incrementSendCount({ entityId: entityId, phoneNumber: sub.phoneNumber, success: success })];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, this.models.reporting.incrementCount({ entityId: entityId, campaignCode: campaignCode, fieldName: success ? "sentCount" : "failedCount" })];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8:
                        subscribers_3_1 = subscribers_3.next();
                        return [3 /*break*/, 4];
                    case 9: return [3 /*break*/, 12];
                    case 10:
                        e_4_1 = _b.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 12];
                    case 11:
                        try {
                            if (subscribers_3_1 && !subscribers_3_1.done && (_a = subscribers_3.return)) _a.call(subscribers_3);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7 /*endfinally*/];
                    case 12: return [4 /*yield*/, this.models.entity.setLastCode(entityId, campaignCode)];
                    case 13:
                        _b.sent();
                        count = subscribers.length;
                        return [2 /*return*/, responses_js_1.default.NAMED_MESSAGE.replace("%COUNT%", count.toString()).replace("%NAME%", messageName)];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.setDefaultMessage = function (entityId, unparsedMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = unparsedMessage.split(" ").splice(2).join(" ");
                        return [4 /*yield*/, this.models.entity.setDefaultMessage(entityId, message)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.getDefaultMessage = function (entityId) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.entity.getDefaultMessage(entityId)];
                    case 1:
                        message = _a.sent();
                        return [2 /*return*/, message];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.setMessage = function (entityId, name, unparsedMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = unparsedMessage.split(" ").splice(2).join(" ");
                        return [4 /*yield*/, this.models.entity.setMessage(entityId, name, message)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.getMessage = function (entityId, name) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.entity.getMessage(entityId, name)];
                    case 1:
                        message = _a.sent();
                        return [2 /*return*/, message];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.setDefaultMessageByName = function (entityId, name) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.entity.getMessage(entityId, name)];
                    case 1:
                        message = _a.sent();
                        if (!message) {
                            return [2 /*return*/, responses_js_1.default.UNKNOWN_MSG_NAME];
                        }
                        return [4 /*yield*/, this.models.entity.setDefaultMessage(entityId, message)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, responses_js_1.default.SET_MESSAGE];
                }
            });
        });
    };
    MessageHandler.prototype.getMessageNames = function (entityId) {
        return __awaiter(this, void 0, void 0, function () {
            var names, readableNames;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.entity.getMessageNames(entityId)];
                    case 1:
                        names = _a.sent();
                        if (!names || !names.length) {
                            return [2 /*return*/, responses_js_1.default.NO_NAMED_MESSAGES];
                        }
                        readableNames = names === null || names === void 0 ? void 0 : names.join(",\n");
                        return [2 /*return*/, readableNames];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.getLastCode = function (entityId) {
        return __awaiter(this, void 0, void 0, function () {
            var lastCode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.entity.getLastCode(entityId)];
                    case 1:
                        lastCode = _a.sent();
                        return [2 /*return*/, lastCode];
                }
            });
        });
    };
    MessageHandler.prototype.addAdmin = function (entityId, newAdmin) {
        return __awaiter(this, void 0, void 0, function () {
            var phone;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            phone = (0, libphonenumber_js_1.default)(newAdmin, "US").number;
                            if (!phone) {
                                throw new Error("Failed to parse phone number.");
                            }
                        }
                        catch (e) {
                            logger_js_1.default.error("Could not parse '".concat(newAdmin, "' as a phone number: ").concat(JSON.stringify(e.message)));
                            return [2 /*return*/, responses_js_1.default.FAILED_PARSE_PHONE.replace("%PHONE%", newAdmin)];
                        }
                        return [4 /*yield*/, this.models.phoneNumber.createOrUpdate({
                                entityId: entityId,
                                phoneNumber: phone,
                                isAdmin: true,
                                isActive: true,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, responses_js_1.default.ADD_ADMIN.replace("%PHONE%", newAdmin)];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.addCampaignCode = function (entityId, code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.entity.addCampaignCode(entityId, code)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.removeAdmin = function (entityId, admin) {
        return __awaiter(this, void 0, void 0, function () {
            var phone;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            phone = (0, libphonenumber_js_1.default)(admin, "US").number;
                            if (!phone) {
                                throw new Error("Failed to parse phone number.");
                            }
                        }
                        catch (e) {
                            logger_js_1.default.error("Could not parse '".concat(admin, "' as a phone number: ").concat(JSON.stringify(e.message)));
                            return [2 /*return*/, responses_js_1.default.FAILED_PARSE_PHONE.replace("%PHONE%", admin)];
                        }
                        return [4 /*yield*/, this.models.phoneNumber.createOrUpdate({
                                entityId: entityId,
                                phoneNumber: phone,
                                isAdmin: false,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, responses_js_1.default.REMOVE_ADMIN.replace("%PHONE%", admin)];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.removeCampaignCode = function (entityId, code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.models.entity.removeCampaignCode(entityId, code)];
                    case 1:
                        _a.sent();
                        // Update all subscribers with old code to no code
                        return [4 /*yield*/, this.models.phoneNumber.updateCampaignCode(entityId, code, null)];
                    case 2:
                        // Update all subscribers with old code to no code
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.changeCampaignCode = function (entityId, oldCode, newCode) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Update code
                    return [4 /*yield*/, this.models.entity.updateCampaignCode(entityId, oldCode, newCode)];
                    case 1:
                        // Update code
                        _a.sent();
                        // Update all subscribers with old code
                        return [4 /*yield*/, this.models.phoneNumber.updateCampaignCode(entityId, oldCode, newCode)];
                    case 2:
                        // Update all subscribers with old code
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    MessageHandler.prototype.shutDownProcess = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                process.exit();
                return [2 /*return*/];
            });
        });
    };
    ;
    return MessageHandler;
}());
;
exports.default = MessageHandler;
//# sourceMappingURL=messageHandler.js.map