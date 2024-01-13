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
var sinon = __importStar(require("sinon"));
var chai = __importStar(require("chai"));
var expect = chai.expect;
var mongodb_js_1 = __importDefault(require("../src/services/mongodb.js"));
var messageHandler_js_1 = __importDefault(require("../src/server/messageHandler.js"));
var messenger_js_1 = __importDefault(require("../src/services/messenger.js"));
var mock_req_res_1 = require("mock-req-res");
var buildRequest = function (params) { return (0, mock_req_res_1.mockRequest)({ body: params }); };
var buildResponse = function () { return (0, mock_req_res_1.mockResponse)({ type: function () { return { send: sinon.stub() }; } }); };
var entity;
var entityId;
var messageHandler;
var getMessage;
var getAdminMessage;
var admin = { phoneNumber: "+12345678910", entityId: "00001", isAdmin: true, isActive: true };
var normalUser = {
    phoneNumber: "+15555555555",
    entityId: "00001",
    isAdmin: false,
    isActive: true,
};
var normalUser2 = {
    phoneNumber: "+16555555556",
    entityId: "00001",
    isAdmin: false,
    isActive: true,
};
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var db, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sendStub = sinon.stub(messenger_js_1.default, "send").resolves(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, (0, mongodb_js_1.default)()];
                case 2:
                    db = _a.sent();
                    messageHandler = new messageHandler_js_1.default(db);
                    return [4 /*yield*/, db.collection("phone-numbers").drop()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db.collection("reporting-daily").drop()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, db.collection("state").drop()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, db.collection("entities").drop()];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.log("No collections were dropped because they don't exist");
                    return [3 /*break*/, 8];
                case 8: 
                // Create an admin to test with
                return [4 /*yield*/, messageHandler.models.phoneNumber.createOrUpdate(admin)];
                case 9:
                    // Create an admin to test with
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.createOrUpdate({
                            entityId: "00001",
                            accountPhoneNumber: "+17777777777",
                            defaultMessage: "This is the default message",
                            name: "Test Entity",
                            contactName: "Test Contact",
                            contactNumber: "+18888888888",
                        })];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, messageHandler.models.entity.findByPhoneNumber("+17777777777")];
                case 11:
                    entity = _a.sent();
                    entityId = entity === null || entity === void 0 ? void 0 : entity.entityId;
                    getMessage = function (code, user) {
                        return buildRequest({ Body: code, From: user ? user.phoneNumber : normalUser.phoneNumber, To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber });
                    };
                    getAdminMessage = function (code) {
                        return buildRequest({ Body: code, From: admin.phoneNumber, To: entity === null || entity === void 0 ? void 0 : entity.accountPhoneNumber });
                    };
                    return [2 /*return*/];
            }
        });
    });
}
var sendStub;
describe("Reporting Tests", function () {
    var _this = this;
    beforeEach(init);
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                sendStub.restore();
                return [2 /*return*/];
            });
        });
    });
    it("should show each action in reports", function () { return __awaiter(_this, void 0, void 0, function () {
        var startDate, endDate, reportArr, report, expected, _a, _b, prop;
        var e_1, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: 
                // Setup
                return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report"), buildResponse())];
                case 1:
                    // Setup
                    _d.sent();
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report2"), buildResponse())];
                case 2:
                    _d.sent();
                    // Start Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("report"), buildResponse())];
                case 3:
                    // Start Subscribe
                    _d.sent();
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 4:
                    // Sent message
                    _d.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 5:
                    _d.sent();
                    sendStub.returns(true);
                    // Change Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("report2"), buildResponse())];
                case 6:
                    // Change Subscribe
                    _d.sent();
                    // End Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("stop"), buildResponse())];
                case 7:
                    // End Subscribe
                    _d.sent();
                    startDate = new Date();
                    startDate.setHours(startDate.getHours());
                    endDate = new Date();
                    endDate.setHours(endDate.getHours() + 24);
                    return [4 /*yield*/, messageHandler.models.reporting.findByDateRange({
                            entityId: entityId,
                            startDate: startDate,
                            endDate: endDate,
                        })];
                case 8:
                    reportArr = _d.sent();
                    report = reportArr[0];
                    expect(report).to.exist;
                    expect(report.campaignCodes).to.exist;
                    expect(Object.keys(report.campaignCodes).length).to.equal(2);
                    expect(JSON.stringify(report.campaignCodes["REPORT"])).to.equal(JSON.stringify({
                        startSubscriptionCount: 1,
                        sentCount: 1,
                        failedCount: 1,
                    }));
                    expect(JSON.stringify(report.campaignCodes["REPORT2"])).to.equal(JSON.stringify({
                        changeSubscriptionCount: 1,
                        endSubscriptionCount: 1,
                    }));
                    expected = {
                        startSubscriptionCount: 1,
                        sentCount: 1,
                        failedCount: 1,
                        changeSubscriptionCount: 1,
                        endSubscriptionCount: 1,
                    };
                    try {
                        for (_a = __values(Object.keys(expected)), _b = _a.next(); !_b.done; _b = _a.next()) {
                            prop = _b.value;
                            expect(report[prop]).to.equal(expected[prop]);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it("should increment when they occur multiple times", function () { return __awaiter(_this, void 0, void 0, function () {
        var startDate, endDate, reportArr, report, expected, _a, _b, prop;
        var e_2, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: 
                // Setup
                return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report"), buildResponse())];
                case 1:
                    // Setup
                    _d.sent();
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report2"), buildResponse())];
                case 2:
                    _d.sent();
                    // Start Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("report", normalUser), buildResponse())];
                case 3:
                    // Start Subscribe
                    _d.sent();
                    return [4 /*yield*/, messageHandler.handle(getMessage("report", normalUser2), buildResponse())];
                case 4:
                    _d.sent();
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 5:
                    // Sent message
                    _d.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 6:
                    _d.sent();
                    sendStub.returns(true);
                    // Change Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("report2", normalUser), buildResponse())];
                case 7:
                    // Change Subscribe
                    _d.sent();
                    return [4 /*yield*/, messageHandler.handle(getMessage("report2", normalUser2), buildResponse())];
                case 8:
                    _d.sent();
                    // End Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("stop", normalUser), buildResponse())];
                case 9:
                    // End Subscribe
                    _d.sent();
                    return [4 /*yield*/, messageHandler.handle(getMessage("stop", normalUser2), buildResponse())];
                case 10:
                    _d.sent();
                    startDate = new Date();
                    startDate.setHours(startDate.getHours());
                    endDate = new Date();
                    endDate.setHours(endDate.getHours() + 24);
                    return [4 /*yield*/, messageHandler.models.reporting.findByDateRange({
                            entityId: entityId,
                            startDate: startDate,
                            endDate: endDate,
                        })];
                case 11:
                    reportArr = _d.sent();
                    report = reportArr[0];
                    expect(report).to.exist;
                    expect(report.campaignCodes).to.exist;
                    expect(Object.keys(report.campaignCodes).length).to.equal(2);
                    expect(JSON.stringify(report.campaignCodes["REPORT"])).to.equal(JSON.stringify({
                        startSubscriptionCount: 2,
                        sentCount: 2,
                        failedCount: 2,
                    }));
                    expect(JSON.stringify(report.campaignCodes["REPORT2"])).to.equal(JSON.stringify({
                        changeSubscriptionCount: 2,
                        endSubscriptionCount: 2,
                    }));
                    expected = {
                        startSubscriptionCount: 2,
                        sentCount: 2,
                        failedCount: 2,
                        changeSubscriptionCount: 2,
                        endSubscriptionCount: 2,
                    };
                    try {
                        for (_a = __values(Object.keys(expected)), _b = _a.next(); !_b.done; _b = _a.next()) {
                            prop = _b.value;
                            expect(report[prop]).to.equal(expected[prop]);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it("should build a report for each date an action occurred on", function () { return __awaiter(_this, void 0, void 0, function () {
        var now, clock, aDay, startDate, endDate, reportArr, report;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    clock = sinon.useFakeTimers(now.getTime());
                    aDay = 24 * 60 * 60 * 1000;
                    // Setup
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report"), buildResponse())];
                case 1:
                    // Setup
                    _a.sent();
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report2"), buildResponse())];
                case 2:
                    _a.sent();
                    // Day 1
                    // Start Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("report"), buildResponse())];
                case 3:
                    // Day 1
                    // Start Subscribe
                    _a.sent();
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 4:
                    // Sent message
                    _a.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 5:
                    _a.sent();
                    sendStub.returns(true);
                    // Day 2
                    clock.tick(aDay);
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 6:
                    // Sent message
                    _a.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 7:
                    _a.sent();
                    sendStub.returns(true);
                    // Day 3
                    clock.tick(aDay);
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 8:
                    // Sent message
                    _a.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 9:
                    _a.sent();
                    sendStub.returns(true);
                    clock.restore();
                    startDate = new Date();
                    startDate.setHours(startDate.getHours());
                    endDate = new Date();
                    endDate.setHours(endDate.getHours() + 48);
                    return [4 /*yield*/, messageHandler.models.reporting.findByDateRange({
                            entityId: entityId,
                            startDate: startDate,
                            endDate: endDate,
                        })];
                case 10:
                    reportArr = _a.sent();
                    expect(reportArr).to.exist;
                    expect(reportArr.length).to.equal(3);
                    report = reportArr[0];
                    expect(report).to.exist;
                    expect(report.campaignCodes).to.exist;
                    expect(JSON.stringify(reportArr[2].campaignCodes["REPORT"])).to.equal(JSON.stringify(reportArr[1].campaignCodes["REPORT"]));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should build a aggregated report for each date an action occurred on", function () { return __awaiter(_this, void 0, void 0, function () {
        var now, clock, aDay, startDate, endDate, reportArr, report;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    clock = sinon.useFakeTimers(now.getTime());
                    aDay = 24 * 60 * 60 * 1000;
                    // Setup
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report"), buildResponse())];
                case 1:
                    // Setup
                    _a.sent();
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("add code report2"), buildResponse())];
                case 2:
                    _a.sent();
                    // Day 1
                    // Start Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("report"), buildResponse())];
                case 3:
                    // Day 1
                    // Start Subscribe
                    _a.sent();
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 4:
                    // Sent message
                    _a.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 5:
                    _a.sent();
                    sendStub.returns(true);
                    // Day 2
                    clock.tick(aDay);
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 6:
                    // Sent message
                    _a.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 7:
                    _a.sent();
                    sendStub.returns(true);
                    // Day 3
                    clock.tick(aDay);
                    // Sent message
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 8:
                    // Sent message
                    _a.sent();
                    // Failed message
                    sendStub.returns(false);
                    return [4 /*yield*/, messageHandler.handle(getAdminMessage("send report"), buildResponse())];
                case 9:
                    _a.sent();
                    sendStub.returns(true);
                    // Change Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("report2"), buildResponse())];
                case 10:
                    // Change Subscribe
                    _a.sent();
                    // End Subscribe
                    return [4 /*yield*/, messageHandler.handle(getMessage("stop"), buildResponse())];
                case 11:
                    // End Subscribe
                    _a.sent();
                    clock.restore();
                    startDate = new Date();
                    startDate.setHours(startDate.getHours());
                    endDate = new Date();
                    endDate.setHours(endDate.getHours() + 48);
                    return [4 /*yield*/, messageHandler.models.reporting.aggregateByDateRange({
                            entityId: entityId,
                            startDate: startDate,
                            endDate: endDate,
                        }).toArray()];
                case 12:
                    reportArr = _a.sent();
                    expect(reportArr).to.exist;
                    expect(reportArr.length).to.equal(1);
                    report = reportArr[0];
                    expect(report).to.exist;
                    expect(report.totalFailedCount).to.equal(3);
                    expect(report.totalSentCount).to.equal(3);
                    expect(report.totalStartSubscriptionCount).to.equal(1);
                    expect(report.totalEndSubscriptionCount).to.equal(1);
                    expect(report.totalChangeSubscriptionCount).to.equal(1);
                    expect(report.totalResponseCount).to.equal(10);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=reporting.integration.js.map