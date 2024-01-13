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
var mongodb_js_1 = __importDefault(require("../src/services/mongodb.js"));
var messageHandler_js_1 = __importDefault(require("../src/server/messageHandler.js"));
var messenger_js_1 = __importDefault(require("../src/services/messenger.js"));
var responses_js_1 = __importDefault(require("../src/server/responses.js"));
var mock_req_res_1 = require("mock-req-res");
var lib_1 = require("twilio/lib");
var MessagingResponse = lib_1.twiml.MessagingResponse;
var admin = { phoneNumber: "+12345678910", entityId: "00001", isAdmin: true, isActive: true };
var normalUser = {
    phoneNumber: "+15555555555",
    entityId: "00001",
    isAdmin: true,
    isActive: true,
};
var entity;
var entityId;
var messageHandler;
var buildRequest = function (params) { return (0, mock_req_res_1.mockRequest)({ body: params }); };
var buildResponse = function () { return (0, mock_req_res_1.mockResponse)({ type: function () { return { send: sinon.stub() }; } }); };
var twimlResponse = function (message) {
    var twimlRes = new MessagingResponse();
    twimlRes.message(message);
    return twimlRes.toString();
};
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var db, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, mongodb_js_1.default)()];
                case 1:
                    db = _a.sent();
                    messageHandler = new messageHandler_js_1.default(db);
                    return [4 /*yield*/, db.collection("phone-numbers").drop()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, db.collection("reporting-daily").drop()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db.collection("state").drop()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, db.collection("entities").drop()];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    console.log("No collections to drop, continuing...");
                    return [3 /*break*/, 7];
                case 7: 
                // Create an entity to test with
                return [4 /*yield*/, messageHandler.models.entity.createOrUpdate({
                        entityId: "00001",
                        accountPhoneNumber: "+17777777777",
                        defaultMessage: "This is the default message",
                        name: "Test Entity",
                        contactName: "Test Contact",
                        contactNumber: "+18888888888",
                    })];
                case 8:
                    // Create an entity to test with
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.findByPhoneNumber("+17777777777")];
                case 9:
                    entity = _a.sent();
                    entityId = entity === null || entity === void 0 ? void 0 : entity.entityId;
                    // Create an admin to test with
                    return [4 /*yield*/, messageHandler.models.phoneNumber.createOrUpdate(admin)];
                case 10:
                    // Create an admin to test with
                    _a.sent();
                    // Stub out shutdown function so it doesn't stop the tests XD
                    sinon.stub(messageHandler, "shutDownProcess").resolves();
                    return [2 /*return*/];
            }
        });
    });
}
var sendStub;
describe("Core Logic", function () {
    before(init);
    beforeEach(function () {
        // Stub out text sending functions
        sendStub = sinon.stub(messenger_js_1.default, "send").resolves(true);
    });
    afterEach(function () {
        sendStub.restore();
    });
    it("should set a message when called by an admin with SET MESSAGE", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, setting;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "SET MESSAGE Hello world!",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getDefaultMessage(entityId)];
                case 2:
                    setting = _a.sent();
                    expect(setting).to.equal("Hello world!");
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.SET_MESSAGE)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should get an entity's default message when called by an admin with GET MESSAGE", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, defaultMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "GET MESSAGE",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getDefaultMessage(entityId)];
                case 2:
                    defaultMessage = _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(defaultMessage)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should add a code when it receives ADD CODE from admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, codes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "add code test",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getCampaignCodes(entityId)];
                case 2:
                    codes = _a.sent();
                    expect(codes.includes("TEST"));
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.ADD_CODE.replace("%CODE%", "TEST"))));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should add multiple codes when it receives different codes with ADD CODE from admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message1, response1, message2, response2, codes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message1 = {
                        Body: "add code test1",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response1 = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message1), response1)];
                case 1:
                    _a.sent();
                    message2 = {
                        Body: "add code test2",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response2 = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message2), response2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getCampaignCodes(entityId)];
                case 3:
                    codes = _a.sent();
                    expect(codes.includes("TEST1"));
                    expect(codes.includes("TEST2"));
                    expect(response1.send.calledOnceWith(twimlResponse(responses_js_1.default.ADD_CODE.replace("%CODE%", "TEST1"))));
                    expect(response2.send.calledOnceWith(twimlResponse(responses_js_1.default.ADD_CODE.replace("%CODE%", "TEST2"))));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should add a subscriber when non-admin sends a code", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "test",
                        From: normalUser.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: normalUser.phoneNumber,
                        })];
                case 2:
                    user = _a.sent();
                    expect(user).to.exist;
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.VALID_CAMPAIGN_CODE)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should add a subscriber when non-admin sends a code with extra whitespace", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "test  ",
                        From: normalUser.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: normalUser.phoneNumber,
                        })];
                case 2:
                    user = _a.sent();
                    expect(user).to.exist;
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.VALID_CAMPAIGN_CODE)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should send a message to subscriber when SEND CODE is sent by admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "send test",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.SEND_CODE.replace("%CODE%", "TEST").replace("%COUNT%", "1"))));
                    expect(sendStub.calledWithExactly(normalUser.phoneNumber, responses_js_1.default.DEFAULT_MESSAGE));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should send a message to subscriber when CUSTOM CODE is sent by admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "custom test Hello world!",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.CUSTOM_MESSAGE.replace("%COUNT%", "1"))));
                    expect(sendStub.calledWithExactly(normalUser.phoneNumber, "Hello world!"));
                    expect(!sendStub.calledWithExactly(admin.phoneNumber, "Hello world!"));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should send a message to all when CUSTOM ALL is sent by admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "custom all Hello world!",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.CUSTOM_MESSAGE.replace("%COUNT%", "2"))));
                    expect(sendStub.calledWithExactly(normalUser.phoneNumber, "Hello world!"));
                    expect(sendStub.calledWithExactly(admin.phoneNumber, "Hello world!"));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should set an entity's last code when an admin sends a campaign", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, lastCode, message2, response2, lastCode2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "SEND TEST1",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getLastCode(entityId)];
                case 2:
                    lastCode = _a.sent();
                    expect(lastCode).to.equal("TEST1");
                    message2 = {
                        Body: "SEND TEST2",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response2 = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message2), response2)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getLastCode(entityId)];
                case 4:
                    lastCode2 = _a.sent();
                    expect(lastCode2).to.equal("TEST2");
                    return [2 /*return*/];
            }
        });
    }); });
    it("should get an entity's last code when called by an admin with GET LAST CODE", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, lastCode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "GET LAST CODE",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getLastCode(entityId)];
                case 2:
                    lastCode = _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(lastCode)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should add an admin as a subscriber when they send a code", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, adminUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "test",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: admin.phoneNumber,
                        })];
                case 2:
                    adminUser = _a.sent();
                    expect(adminUser).to.exist;
                    expect(adminUser === null || adminUser === void 0 ? void 0 : adminUser.campaignCode).to.equal("TEST");
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.VALID_CAMPAIGN_CODE)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should change a code when it receives CHANGE CODE from admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, codes, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "change code test changedtest",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getCampaignCodes(entityId)];
                case 2:
                    codes = _a.sent();
                    expect(!codes.includes("TEST"));
                    expect(codes.includes("CHANGEDTEST"));
                    expect(response.send.calledOnceWith(responses_js_1.default.CHANGE_CODE.replace("%CODE1%", "TEST").replace("%CODE2%", "CHANGEDTEST")));
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: normalUser.phoneNumber,
                        })];
                case 3:
                    user = _a.sent();
                    expect(user).to.exist;
                    expect(user === null || user === void 0 ? void 0 : user.campaignCode).to.equal("CHANGEDTEST");
                    return [2 /*return*/];
            }
        });
    }); });
    it("should remove a code when it receives REMOVE CODE from admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, codes, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "remove code changedtest",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.getCampaignCodes(entityId)];
                case 2:
                    codes = _a.sent();
                    expect(!codes.includes("CHANGEDTEST"));
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.REMOVE_CODE.replace("%CODE%", "CHANGEDTEST"))));
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: normalUser.phoneNumber,
                        })];
                case 3:
                    user = _a.sent();
                    expect(user).to.exist;
                    expect(user === null || user === void 0 ? void 0 : user.campaignCode).to.equal(null);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should add an admin when it receives ADD ADMIN", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, newAdmin;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "add admin (100) 003-1337",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: "+11000031337",
                        })];
                case 2:
                    newAdmin = _a.sent();
                    expect(newAdmin).to.exist;
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.ADD_ADMIN.replace("%PHONE%", "(100)003-1337"))));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should send error when ADD ADMIN can't parse phone", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, newAdmin;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "add admin (1X0) 0X3-1337",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: "+11000013117",
                        })];
                case 2:
                    newAdmin = _a.sent();
                    expect(newAdmin).to.not.exist;
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.FAILED_PARSE_PHONE.replace("%PHONE%", "(1X0)0X3-1337"))));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should remove an admin when it receives REMOVE ADMIN", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, notAdmin;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "remove admin (100)003-1337",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: "+11000031337",
                        })];
                case 2:
                    notAdmin = _a.sent();
                    expect(notAdmin).to.exist;
                    expect(notAdmin === null || notAdmin === void 0 ? void 0 : notAdmin.isAdmin).to.be.false;
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.REMOVE_ADMIN.replace("%PHONE%", "(100)003-1337"))));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should send error when REMOVE ADMIN can't parse phone", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "remove admin (1X0)0X3-1337",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.FAILED_PARSE_PHONE.replace("%PHONE%", "(1X0)0X3-1337"))));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should return RUNNING when STATUS is called", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "STATUS",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.STATUS)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should return message when SHUTDOWN is called", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "SHUTDOWN",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.SHUTDOWN)));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should set admin user to inactive when they send STOP", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, adminUser, re;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "STOP",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: admin.phoneNumber,
                        })];
                case 2:
                    adminUser = _a.sent();
                    expect(adminUser).to.exist;
                    expect(adminUser === null || adminUser === void 0 ? void 0 : adminUser.isAdmin).to.be.true;
                    expect(adminUser === null || adminUser === void 0 ? void 0 : adminUser.isActive).to.be.false;
                    re = response.send.getCalls();
                    expect(response.send.notCalled).to.be.true;
                    return [2 /*return*/];
            }
        });
    }); });
    it("should set admin user to active when they send START", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, adminUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "START",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: admin.phoneNumber,
                        })];
                case 2:
                    adminUser = _a.sent();
                    expect(adminUser).to.exist;
                    expect(adminUser === null || adminUser === void 0 ? void 0 : adminUser.isAdmin).to.be.true;
                    expect(adminUser === null || adminUser === void 0 ? void 0 : adminUser.isActive).to.be.true;
                    expect(response.send.notCalled).to.be.true;
                    return [2 /*return*/];
            }
        });
    }); });
    it("should set normal user to inactive when they send STOP", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, normal;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "STOP",
                        From: normalUser.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: normalUser.phoneNumber,
                        })];
                case 2:
                    normal = _a.sent();
                    expect(normal).to.exist;
                    expect(normal === null || normal === void 0 ? void 0 : normal.isActive).to.be.false;
                    expect(response.send.notCalled).to.be.true;
                    return [2 /*return*/];
            }
        });
    }); });
    it("should set normal user to active when they send START", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response, normal;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = {
                        Body: "START",
                        From: normalUser.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.phoneNumber.findByPhoneNumber({
                            entityId: entityId, phoneNumber: normalUser.phoneNumber,
                        })];
                case 2:
                    normal = _a.sent();
                    expect(normal).to.exist;
                    expect(normal === null || normal === void 0 ? void 0 : normal.isActive).to.be.true;
                    expect(response.send.notCalled).to.be.true;
                    return [2 /*return*/];
            }
        });
    }); });
    it("should not send a message to inactive subscriber when SEND CODE is sent by admin", function () { return __awaiter(void 0, void 0, void 0, function () {
        var subscribe, stop, adminMessage, adminResponse, start;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    subscribe = {
                        Body: "test1",
                        From: normalUser.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    return [4 /*yield*/, messageHandler.handle(buildRequest(subscribe), buildResponse())];
                case 1:
                    _a.sent();
                    stop = {
                        Body: "stop",
                        From: normalUser.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    return [4 /*yield*/, messageHandler.handle(buildRequest(stop), buildResponse())];
                case 2:
                    _a.sent();
                    adminMessage = {
                        Body: "send test1",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    adminResponse = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(adminMessage), adminResponse)];
                case 3:
                    _a.sent();
                    expect(adminResponse.send.calledOnceWith(responses_js_1.default.SEND_CODE.replace("%CODE%", "TEST1").replace("%COUNT%", "0")));
                    expect(sendStub.callCount).to.equal(0);
                    start = {
                        Body: "start",
                        From: normalUser.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    return [4 /*yield*/, messageHandler.handle(buildRequest(start), buildResponse())];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("should send error it throws unexpectedly", function () { return __awaiter(void 0, void 0, void 0, function () {
        var message, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sinon
                        .stub(messageHandler, "addCampaignCode")
                        .throws({ message: "Something went very wrong!" });
                    message = {
                        Body: "add code anything",
                        From: admin.phoneNumber,
                        To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                    };
                    response = buildResponse();
                    return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                case 1:
                    _a.sent();
                    expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.ERROR)));
                    return [2 /*return*/];
            }
        });
    }); });
    describe("admin sending unknown or incomplete commands", function () {
        var badCommands = [
            "sup doge",
            "NOTACODE",
            "add",
            "send",
            "add admin",
            "remove admin",
            "add code",
            "remove code",
            "change code alice",
            "set message",
            "custom",
            "custom test",
        ];
        badCommands.forEach(function (command) {
            var _this = this;
            it("should return unknown message for '".concat(command, "' command"), function () { return __awaiter(_this, void 0, void 0, function () {
                var message, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            message = {
                                Body: command,
                                From: admin.phoneNumber,
                                To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                            };
                            response = buildResponse();
                            return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                        case 1:
                            _a.sent();
                            expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.UNKNOWN)));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe("non-admin calling admin functions", function () {
        var validAdminCommands = [
            "send test1",
            "add admin (555)555-5555",
            "remove admin (234)567-8910",
            "add code bacon",
            "remove code test2",
            "change code test1 love",
            "set message Hello world!",
            "custom all Hello world!",
            "status",
            "shutdown",
        ];
        validAdminCommands.forEach(function (command) {
            var _this = this;
            it("should return unknown message for '".concat(command, "' command"), function () { return __awaiter(_this, void 0, void 0, function () {
                var message, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            message = {
                                Body: command,
                                From: normalUser.phoneNumber,
                                To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber,
                            };
                            response = buildResponse();
                            return [4 /*yield*/, messageHandler.handle(buildRequest(message), response)];
                        case 1:
                            _a.sent();
                            expect(response.send.calledOnceWith(twimlResponse(responses_js_1.default.UNKNOWN)));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=messageHandler.integration.js.map