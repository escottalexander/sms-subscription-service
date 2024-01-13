"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyReport = exports.ReportingModel = void 0;
var DailyReport = /** @class */ (function () {
    function DailyReport() {
    }
    return DailyReport;
}());
exports.DailyReport = DailyReport;
var ReportingModel = /** @class */ (function () {
    function ReportingModel(storage) {
        this.collection = storage.collection("reporting-daily");
    }
    ReportingModel.prototype.createOrUpdate = function (params) {
        if (!params.entityId) {
            throw new Error("Must provide entityId");
        }
        if (!params.date) {
            params.date = new Date();
        }
        var date = normalizeDate(params.date);
        var entityId = params.entityId, $inc = params.$inc;
        var exclude = ["entityId", "phoneNumber", "$inc", "date"];
        var updateObj = {};
        var $set = {};
        for (var key in params) {
            if (exclude.includes(key)) {
                continue;
            }
            $set[key] = params[key];
        }
        if ($inc) {
            updateObj.$inc = $inc;
        }
        if (Object.keys($set).length) {
            updateObj.$set = $set;
        }
        return this.collection.updateOne({ entityId: entityId, date: date }, updateObj, { upsert: true });
    };
    ReportingModel.prototype.incrementCount = function (_a) {
        var _b;
        var entityId = _a.entityId, campaignCode = _a.campaignCode, fieldName = _a.fieldName;
        var updateParams = { entityId: entityId, $inc: (_b = {}, _b["".concat(fieldName)] = 1, _b) };
        if (campaignCode) {
            updateParams.$inc["campaignCodes.".concat(campaignCode, ".").concat(fieldName)] = 1;
        }
        return this.createOrUpdate(updateParams);
    };
    ReportingModel.prototype.remove = function (_a) {
        var entityId = _a.entityId, date = _a.date;
        return this.collection.deleteOne({ entityId: entityId, date: normalizeDate(date) });
    };
    ReportingModel.prototype.findByDateRange = function (_a) {
        var entityId = _a.entityId, startDate = _a.startDate, endDate = _a.endDate;
        var UTCStartDate = normalizeDate(startDate);
        var UTCEndDate = normalizeDate(endDate);
        return this.collection
            .find({
            entityId: entityId,
            date: { $gte: UTCStartDate, $lte: UTCEndDate },
        })
            .toArray();
    };
    ReportingModel.prototype.aggregateByDateRange = function (_a) {
        var entityId = _a.entityId, startDate = _a.startDate, endDate = _a.endDate;
        var UTCStartDate = normalizeDate(startDate);
        var UTCEndDate = normalizeDate(endDate);
        var $match = {
            date: { $gte: UTCStartDate, $lte: UTCEndDate },
        };
        if (entityId) {
            $match.entityId = entityId;
        }
        return this.collection.aggregate([
            {
                $match: $match,
            },
            {
                $group: {
                    _id: null,
                    totalSentCount: { $sum: '$sentCount' },
                    totalFailedCount: { $sum: '$failedCount' },
                    totalStartSubscriptionCount: { $sum: '$startSubscriptionCount' },
                    totalChangeSubscriptionCount: { $sum: '$changeSubscriptionCount' },
                    totalEndSubscriptionCount: { $sum: '$endSubscriptionCount' },
                    totalResponseCount: { $sum: '$responseCount' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalSentCount: 1,
                    totalFailedCount: 1,
                    totalStartSubscriptionCount: 1,
                    totalChangeSubscriptionCount: 1,
                    totalEndSubscriptionCount: 1,
                    totalResponseCount: 1,
                },
            },
        ]);
    };
    return ReportingModel;
}());
exports.ReportingModel = ReportingModel;
function normalizeDate(inputDate) {
    var normalizedDate = new Date(inputDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    return normalizedDate;
}
//# sourceMappingURL=reporting.js.map