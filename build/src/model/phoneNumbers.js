"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumber = exports.PhoneNumberModel = void 0;
var PhoneNumber = /** @class */ (function () {
    function PhoneNumber() {
    }
    return PhoneNumber;
}());
exports.PhoneNumber = PhoneNumber;
var PhoneNumberModel = /** @class */ (function () {
    function PhoneNumberModel(storage) {
        this.collection = storage.collection("phone-numbers");
    }
    PhoneNumberModel.prototype.createOrUpdate = function (params) {
        var entityId = params.entityId, phoneNumber = params.phoneNumber, $inc = params.$inc;
        var exclude = ["entityId", "phoneNumber", "$inc"];
        var updateObj = { $set: {} };
        for (var key in params) {
            if (exclude.includes(key)) {
                continue;
            }
            updateObj.$set[key] = params[key];
        }
        if ($inc) {
            updateObj.$inc = $inc;
        }
        // Add last modified date to record
        var now = new Date();
        updateObj.$set.lastUpdated = now;
        // Actually use upserts to make sure we don't have duplicates
        return this.collection.updateOne({ entityId: entityId, phoneNumber: phoneNumber }, updateObj, { upsert: true });
    };
    PhoneNumberModel.prototype.updateCampaignCode = function (entityId, oldCode, newCode) {
        var now = new Date();
        return this.collection.updateMany({ entityId: entityId, campaignCode: oldCode }, { $set: { campaignCode: newCode, lastUpdated: now } });
    };
    PhoneNumberModel.prototype.remove = function (_a) {
        var entityId = _a.entityId, phoneNumber = _a.phoneNumber;
        return this.collection.deleteOne({ entityId: entityId, phoneNumber: phoneNumber });
    };
    PhoneNumberModel.prototype.findByPhoneNumber = function (_a) {
        var entityId = _a.entityId, phoneNumber = _a.phoneNumber;
        return this.collection.findOne({ entityId: entityId, phoneNumber: phoneNumber });
    };
    PhoneNumberModel.prototype.findAllByCode = function (_a) {
        var entityId = _a.entityId, campaignCode = _a.campaignCode;
        if (campaignCode === "ALL") {
            return this.collection
                .find({
                isActive: true,
                $or: [
                    { failedCount: { $lt: 3 } },
                    { failedCount: { $exists: false } },
                ],
            })
                .toArray();
        }
        return this.collection
            .find({
            entityId: entityId,
            campaignCode: campaignCode,
            isActive: true,
            $or: [{ failedCount: { $lt: 3 } }, { failedCount: { $exists: false } }],
        })
            .toArray();
    };
    PhoneNumberModel.prototype.incrementSendCount = function (_a) {
        var entityId = _a.entityId, phoneNumber = _a.phoneNumber, success = _a.success;
        var updateParams = { entityId: entityId, phoneNumber: phoneNumber, lastSendAttempt: new Date() };
        if (success) {
            updateParams.$inc = { sentCount: 1 };
            // Reset failed count because we only care if a number always fails
            updateParams.failedCount = 0;
        }
        else {
            updateParams.$inc = { failedCount: 1 };
        }
        return this.createOrUpdate(updateParams);
    };
    return PhoneNumberModel;
}());
exports.PhoneNumberModel = PhoneNumberModel;
//# sourceMappingURL=phoneNumbers.js.map