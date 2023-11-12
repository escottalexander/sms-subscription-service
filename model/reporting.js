import db from "../lib/services/mongodb.js";

const daily = db.collection("reporting-daily");

// const schema = {
//   date: Date,
//   campaignCodes: {
//     ["CODE"]: {
//         sentCount: Number,
//         failedCount: Number,
//         startSubscriptionCount: Number,
//         changeSubscriptionCount: Number,
//         endSubscriptionCount: Number,
//       },
//       ...
//   },
//   sentCount: Number,
//   failedCount: Number,
//   startSubscriptionCount: Number,
//   changeSubscriptionCount: Number,
//   endSubscriptionCount: Number,
//   responseCount: Number
// }

const reportingModel = {
  createOrUpdate: (params) => {
    // Accept a date in the params but if it's not there, override with new Date
    if (!params.date) {
      params.date = new Date();
    }

    // All dates will be set to UTC 0,0,0,0 for consistency
    const date = normalizeDate(params.date);
    delete params.date;

    const updateObj = { $set: params };

    if (params.$inc) {
      updateObj.$inc = params.$inc;
      delete updateObj.$set.$inc;
    }

    // Actually use upserts to make sure we don't have duplicates
    return daily.updateOne(
      { date },
      updateObj,
      { upsert: true }
    );
  },

  incrementCount: ({ campaignCode, fieldName }) => {
    const updateParams = { $inc: { [`${fieldName}`]: 1 } };
    if (campaignCode) {
      updateParams.$inc[`campaignCodes.${campaignCode}.${fieldName}`] = 1;
    }
    return reportingModel.createOrUpdate(updateParams);
  },

  remove: ({ date }) => {
    return daily.deleteOne(
      { date: normalizeDate(date) }
    );
  },

  findByDateRange: ({ startDate, endDate }) => {
    const UTCStartDate = normalizeDate(startDate);
    const UTCEndDate = normalizeDate(endDate);
    return daily
      .find({
        date: { $gte: UTCStartDate, $lte: UTCEndDate },
      })
      .toArray();
  },

  aggregateByDateRange: ({ startDate, endDate }) => {
    const UTCStartDate = normalizeDate(startDate);
    const UTCEndDate = normalizeDate(endDate);
    return daily.aggregate([
      {
        $match: {
          date: { $gte: UTCStartDate, $lte: UTCEndDate },
        },
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
    ]).toArray();
  },
};

function normalizeDate(inputDate) {
  const normalizedDate = new Date(inputDate);
  normalizedDate.setUTCHours(0, 0, 0, 0);
  return normalizedDate;
}

export default reportingModel;
