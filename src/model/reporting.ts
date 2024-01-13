import { Collection, Db, Document } from "mongodb";

class DailyReport implements Document {
  date: Date;
  campaignCodes: {
    [code: string]: {
      sentCount: number;
      failedCount: number;
      startSubscriptionCount: number;
      changeSubscriptionCount: number;
      endSubscriptionCount: number;
    };
  };
  sentCount: number;
  failedCount: number;
  startSubscriptionCount: number;
  changeSubscriptionCount: number;
  endSubscriptionCount: number;
  responseCount: number;
}

class ReportingModel {
  collection: Collection<DailyReport>;
  constructor(storage: Db) {
    this.collection = storage.collection("reporting-daily");
  }

  createOrUpdate(params: { [x: string]: any; entityId: string; date?: Date; $inc?: any; }) {
    if (!params.entityId) {
      throw new Error("Must provide entityId");
    }
    if (!params.date) {
      params.date = new Date();
    }

    const date = normalizeDate(params.date);
    const { entityId, $inc } = params;
    const exclude = ["entityId", "phoneNumber", "$inc", "date"];
    const updateObj: { $set?: any, $inc?: any } = {};
    const $set = {};
    for (const key in params) {
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

    return this.collection.updateOne(
      { entityId, date },
      updateObj,
      { upsert: true }
    );
  }

  incrementCount({ entityId, campaignCode, fieldName }: { entityId: string, campaignCode?: string, fieldName?: string }) {
    const updateParams = { entityId, $inc: { [`${fieldName}`]: 1 } };
    if (campaignCode) {
      updateParams.$inc[`campaignCodes.${campaignCode}.${fieldName}`] = 1;
    }
    return this.createOrUpdate(updateParams);
  }

  remove({ entityId, date }: { entityId: string, date: Date }) {
    return this.collection.deleteOne(
      { entityId, date: normalizeDate(date) }
    );
  }

  findByDateRange({ entityId, startDate, endDate }: { entityId: string, startDate: Date, endDate: Date }) {
    const UTCStartDate = normalizeDate(startDate);
    const UTCEndDate = normalizeDate(endDate);
    return this.collection
      .find({
        entityId,
        date: { $gte: UTCStartDate, $lte: UTCEndDate },
      })
      .toArray();
  }

  aggregateByDateRange({ entityId, startDate, endDate }: { entityId: string, startDate: Date, endDate: Date }) {
    const UTCStartDate = normalizeDate(startDate);
    const UTCEndDate = normalizeDate(endDate);
    const $match = {
      date: { $gte: UTCStartDate, $lte: UTCEndDate },
    } as { date: { $gte: Date; $lte: Date; }; entityId?: string; };
    if (entityId) {
      $match.entityId = entityId;
    }
    return this.collection.aggregate([
      {
        $match,
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
  }
}

function normalizeDate(inputDate: string | number | Date) {
  const normalizedDate = new Date(inputDate);
  normalizedDate.setUTCHours(0, 0, 0, 0);
  return normalizedDate;
}

export { ReportingModel, DailyReport };


