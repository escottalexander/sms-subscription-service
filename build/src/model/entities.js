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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = exports.EntityModel = void 0;
var Entity = /** @class */ (function () {
    function Entity() {
    }
    return Entity;
}());
exports.Entity = Entity;
var EntityModel = /** @class */ (function () {
    function EntityModel(storage) {
        this.collection = storage.collection("entities");
    }
    EntityModel.prototype.createOrUpdate = function (params) {
        // Add last modified date to record
        var now = new Date();
        params.lastUpdated = now;
        var updateObj = { $set: params };
        // Actually use upserts to make sure we don't have duplicates
        return this.collection.updateOne({ entityId: params.entityId }, updateObj, { upsert: true });
    };
    ;
    EntityModel.prototype.findByEntityId = function (_a) {
        var entityId = _a.entityId;
        return this.collection.findOne({ entityId: entityId });
    };
    ;
    EntityModel.prototype.getAll = function () {
        return this.collection.find().toArray();
    };
    ;
    EntityModel.prototype.findByPhoneNumber = function (phoneNumber) {
        return this.collection.findOne({ accountPhoneNumber: phoneNumber });
    };
    ;
    EntityModel.prototype.getCampaignCodes = function (entityId) {
        return __awaiter(this, void 0, void 0, function () {
            var entity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collection
                            .findOne({ entityId: entityId })];
                    case 1:
                        entity = _a.sent();
                        return [2 /*return*/, entity.campaignCodes];
                }
            });
        });
    };
    ;
    EntityModel.prototype.addCampaignCode = function (entityId, code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.collection.updateOne({ entityId: entityId }, { $addToSet: { campaignCodes: code } }, { upsert: true })];
            });
        });
    };
    ;
    EntityModel.prototype.removeCampaignCode = function (entityId, code) {
        return this.collection.updateOne({ entityId: entityId }, { $pull: { campaignCodes: code } });
    };
    ;
    EntityModel.prototype.updateCampaignCode = function (entityId, oldCode, newCode) {
        return __awaiter(this, void 0, void 0, function () {
            var existing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collection
                            .find({ entityId: entityId, campaignCodes: newCode })
                            .toArray()];
                    case 1:
                        existing = _a.sent();
                        if (existing && existing.length > 0) {
                            // remove old code and don't add new one
                            return [2 /*return*/, this.removeCampaignCode(entityId, oldCode)];
                        }
                        else {
                            // replace old one with new one
                            return [2 /*return*/, this.collection.updateOne({ entityId: entityId, campaignCodes: oldCode }, { $set: { "campaignCodes.$": newCode } })];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    EntityModel.prototype.getDefaultMessage = function (entityId) {
        return __awaiter(this, void 0, void 0, function () {
            var entity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collection
                            .findOne({ entityId: entityId })];
                    case 1:
                        entity = _a.sent();
                        return [2 /*return*/, entity.defaultMessage];
                }
            });
        });
    };
    ;
    EntityModel.prototype.setDefaultMessage = function (entityId, message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.collection.updateOne({ entityId: entityId }, { $set: { defaultMessage: message } }, { upsert: true })];
            });
        });
    };
    ;
    return EntityModel;
}());
exports.EntityModel = EntityModel;
;
//# sourceMappingURL=entities.js.map