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
var sinon = __importStar(require("sinon"));
var chai = __importStar(require("chai"));
var expect = chai.expect;
var dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + "/example.env" });
var support_number_numan_readable = process.env.support_number_numan_readable;
var messageHandler_js_1 = __importDefault(require("../src/server/messageHandler.js"));
var entities_js_1 = require("../src/model/entities.js");
var phoneNumbers_js_1 = require("../src/model/phoneNumbers.js");
var messenger_js_1 = __importDefault(require("../src/services/messenger.js"));
var reporting_js_1 = require("../src/model/reporting.js");
var entity = {
    entityId: "00001",
    accountPhoneNumber: "+17777777777",
    defaultMessage: "This is the default message",
    name: "Test Entity",
    contactName: "Test Contact",
    contactNumber: "+18888888888",
    campaignCodes: ["LOC1", "LOC2"],
};
describe("decipherMessage", function () {
    var getCampaignCodesStub;
    var findByPhoneNumberStub;
    var createStub;
    var removeStub;
    var sendStub;
    var getDefaultMessageStub;
    var incrementSendCountStub;
    var incrementCountStub;
    var messageHandler;
    var getRequestContext = function (req, fromPhoneNumberEntry) {
        return {
            message: req.Body,
            entity: entity,
            fromPhone: req.From,
            fromPhoneNumberEntry: fromPhoneNumberEntry
        };
    };
    beforeEach(function () {
        var storage = { collection: sinon.stub() };
        messageHandler = new messageHandler_js_1.default(storage);
        getCampaignCodesStub = sinon.stub(entities_js_1.EntityModel.prototype, "getCampaignCodes");
        findByPhoneNumberStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "findByPhoneNumber");
        createStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "createOrUpdate");
        sendStub = sinon.stub(messenger_js_1.default, "send");
        getDefaultMessageStub = sinon.stub(entities_js_1.EntityModel.prototype, "getDefaultMessage");
        removeStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "remove");
        incrementSendCountStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "incrementSendCount");
        incrementCountStub = sinon.stub(reporting_js_1.ReportingModel.prototype, "incrementCount");
    });
    afterEach(function () {
        sinon.restore();
    });
    describe("when a message is received from an admin phone number", function () {
        beforeEach(function () {
            getCampaignCodesStub.resolves(["LOC1", "LOC2"]);
            findByPhoneNumberStub.resolves({
                phoneNumber: "+1234567890",
                isAdmin: true,
                isActive: true,
            });
        });
        it("should call handleDeliveryMessage when message is a campaign code", function () { return __awaiter(void 0, void 0, void 0, function () {
            var findAllStub, req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        findAllStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "findAllByCode");
                        findAllStub.resolves([
                            {
                                phoneNumber: "+1234567890",
                                campaignCode: "LOC1",
                                isAdmin: false,
                            },
                            {
                                phoneNumber: "+2234567890",
                                campaignCode: "LOC1",
                                isAdmin: false,
                            },
                            {
                                phoneNumber: "+3234567890",
                                campaignCode: "LOC1",
                                isAdmin: false,
                            },
                        ]);
                        req = {
                            Body: "SEND LOC1",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(findAllStub.calledOnceWithExactly({ entityId: "00001", campaignCode: "LOC1" }));
                        expect(sendStub.callCount).to.equal(3);
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call addAdmin when message is ADD ADMIN", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "ADD ADMIN 9999999999",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(createStub.calledOnceWithExactly({
                            phoneNumber: "+9999999999",
                            isAdmin: true,
                            isActive: true,
                        }));
                        expect(response).to.equal("Added '9999999999' as an admin.");
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call addCode when message is ADD CODE", function () { return __awaiter(void 0, void 0, void 0, function () {
            var addCodeStub, req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addCodeStub = sinon.stub(entities_js_1.EntityModel.prototype, "addCampaignCode");
                        req = {
                            Body: "ADD CODE TEST",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(addCodeStub.calledOnceWithExactly("00001", "TEST"));
                        expect(response).to.equal("Successfully added code 'TEST'");
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call removeAdmin when message is REMOVE ADMIN", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "REMOVE ADMIN 9999999999",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(createStub.calledOnceWithExactly({
                            phoneNumber: "+9999999999",
                            isAdmin: false,
                        }));
                        expect(response).to.equal("Removed '9999999999' as an admin.");
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call removeCode when message is REMOVE CODE", function () { return __awaiter(void 0, void 0, void 0, function () {
            var removeCodeStub, phoneNumberStub, req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        removeCodeStub = sinon.stub(entities_js_1.EntityModel.prototype, "removeCampaignCode");
                        phoneNumberStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "updateCampaignCode");
                        req = {
                            Body: "REMOVE CODE TEST",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(removeCodeStub.calledOnceWithExactly("00001", "TEST"));
                        expect(phoneNumberStub.calledOnceWithExactly("00001", "TEST", null));
                        expect(response).to.equal("Successfully removed code 'TEST'");
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call changeCampaignCode when message is CHANGE CODE", function () { return __awaiter(void 0, void 0, void 0, function () {
            var stateStub, phoneNumberStub, req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stateStub = sinon.stub(entities_js_1.EntityModel.prototype, "updateCampaignCode");
                        phoneNumberStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "updateCampaignCode");
                        req = {
                            Body: "CHANGE CODE TEST1 TEST2",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(stateStub.calledOnceWithExactly("00001", "TEST1", "TEST2"));
                        expect(phoneNumberStub.calledOnceWithExactly("00001", "TEST1", "TEST2"));
                        expect(response).to.equal("Successfully changed code 'TEST1' to 'TEST2'");
                        return [2 /*return*/];
                }
            });
        }); });
        it("should return RUNNING when message is STATUS", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "STATUS",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(response).to.equal("RUNNING");
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call shutDownProcess when message is SHUTDOWN", function (done) {
            var shutDownStub = sinon.stub(messageHandler, "shutDownProcess");
            var req = {
                Body: "SHUTDOWN", From: "+1234567890", To: "+17777777777"
            };
            var reqCtx = getRequestContext(req, {
                phoneNumber: "+1234567890",
                isAdmin: true,
                isActive: true,
            });
            messageHandler
                .decipherMessage(reqCtx, req)
                .then(function () {
                setTimeout(function () {
                    expect(shutDownStub.callCount).to.equal(1);
                    done();
                }, 1100);
            });
        });
        it("should call sendCustomMessage when message is a CUSTOM $CODE", function () { return __awaiter(void 0, void 0, void 0, function () {
            var findAllStub, req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        findAllStub = sinon.stub(phoneNumbers_js_1.PhoneNumberModel.prototype, "findAllByCode");
                        findAllStub.resolves([
                            {
                                phoneNumber: "+1234567890",
                                campaignCode: "LOC1",
                                isAdmin: true,
                            },
                            {
                                phoneNumber: "+2234567890",
                                campaignCode: "LOC1",
                                isAdmin: false,
                            },
                            {
                                phoneNumber: "+3234567890",
                                campaignCode: "LOC1",
                                isAdmin: false,
                            },
                        ]);
                        req = {
                            Body: "CUSTOM LOC1 Hello world!",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(findAllStub.calledOnceWithExactly({ entityId: "00001", campaignCode: "LOC1" }));
                        expect(sendStub.callCount).to.equal(3);
                        expect(sendStub.calledWith("+1234567890", "Hello world!"));
                        expect(sendStub.calledWith("+2234567890", "Hello world!"));
                        expect(sendStub.calledWith("+3234567890", "Hello world!"));
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call EntityModel.setDefaultMessage when message is SET MESSAGE and setting exists", function () { return __awaiter(void 0, void 0, void 0, function () {
            var setMessageStub, req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setMessageStub = sinon.stub(entities_js_1.EntityModel.prototype, "setDefaultMessage");
                        req = {
                            Body: "SET MESSAGE Hello world!",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(response).to.equal("Default message has been set");
                        expect(setMessageStub.calledOnceWithExactly("00001", "Hello world!"));
                        return [2 /*return*/];
                }
            });
        }); });
        it("should call EntityModel.getDefaultMessage when message is GET MESSAGE", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        getDefaultMessageStub.resolves("This is the default message");
                        req = {
                            Body: "GET MESSAGE",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        response = _a.sent();
                        expect(response).to.equal("This is the default message");
                        expect(getDefaultMessageStub.calledOnceWithExactly("00001"));
                        return [2 /*return*/];
                }
            });
        }); });
        it("should send message back to admin when message is not recognized", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "NOTVALIDINSTRUCTION",
                            From: "+1234567890",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+1234567890",
                            isAdmin: true,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(sendStub.calledOnceWithExactly("+1234567890", "I don't recognize that instruction... is there a typo?"));
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("when a message is received from a non-admin phone number that is not subscribed", function () {
        beforeEach(function () {
            getCampaignCodesStub.resolves(["LOC1", "LOC2"]);
            findByPhoneNumberStub.resolves();
        });
        it("should add phone number to database and send confirmation when sent valid campaign code", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "LOC1",
                            From: "+15555555555",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req);
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(createStub.calledOnceWithExactly({
                            phoneNumber: "+15555555555",
                            campaignCode: "LOC1",
                        }));
                        expect(sendStub.calledOnceWithExactly("+15555555555", "You have been signed up to receive notifications. If at any point you want to stop receiving messages, text STOP"));
                        return [2 /*return*/];
                }
            });
        }); });
        it("should send unrecognized code message when message is not valid", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "INVALID",
                            From: "+15555555555",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req);
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(createStub.callCount).to.equal(0);
                        expect(sendStub.calledOnceWithExactly("We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a message to ".concat(support_number_numan_readable, " explaining the problem.")));
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("when a message is received from a non-admin phone number that is already subscribed", function () {
        beforeEach(function () {
            getCampaignCodesStub.resolves(["LOC1", "LOC2"]);
            findByPhoneNumberStub.resolves({
                phoneNumber: "+14444444444",
                campaignCode: "LOC2",
            });
        });
        it("should overwrite current assigned campaignCode when signed up for different code", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "LOC1",
                            From: "+14444444444",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+14444444444",
                            isAdmin: false,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(createStub.callCount).to.equal(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("should remove phone number from database and send confirmation when message is STOP", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "STOP",
                            From: "+14444444444",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+14444444444",
                            isAdmin: false,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(removeStub.calledOnceWithExactly({
                            phoneNumber: "+14444444444",
                        }));
                        expect(sendStub.calledOnceWithExactly("+14444444444", "Unsubscribe successful. You will no longer receive notifications."));
                        return [2 /*return*/];
                }
            });
        }); });
        it("should send unrecognized code message when message is not valid", function () { return __awaiter(void 0, void 0, void 0, function () {
            var req, reqCtx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = {
                            Body: "INVALID",
                            From: "+14444444444",
                            To: "+17777777777",
                        };
                        reqCtx = getRequestContext(req, {
                            phoneNumber: "+14444444444",
                            isAdmin: false,
                            isActive: true,
                        });
                        return [4 /*yield*/, messageHandler.decipherMessage(reqCtx, req)];
                    case 1:
                        _a.sent();
                        expect(createStub.callCount).to.equal(0);
                        expect(sendStub.calledOnceWithExactly("We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a message to ".concat(support_number_numan_readable, " explaining the problem.")));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=messageHandler.unit.js.map