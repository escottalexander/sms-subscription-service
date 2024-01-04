import db from "../services/mongodb.js";

const collection = db.collection("phone-numbers");
const phoneNumberModel = {
  createOrUpdate: (params) => {
    const { entityId, phoneNumber, $inc } = params;
    // Add last modified date to record
    const now = new Date();
    params.lastModified = now;
    const updateObj = { $set: params };
    if ($inc) {
      updateObj.$inc = $inc;
      delete updateObj.$set.$inc;
    }
    // Actually use upserts to make sure we don't have duplicates
    return collection.updateOne(
      { entityId, phoneNumber },
      updateObj,
      { upsert: true }
    );
  },
  updateCampaignCode: (entityId, oldCode, newCode) => {
    const now = new Date();
    return collection.updateMany(
      { entityId, campaignCode: oldCode },
      { $set: { campaignCode: newCode, lastModified: now } }
    );
  },
  remove: ({ entityId, phoneNumber }) => {
    return collection.deleteOne({ entityId, phoneNumber });
  },
  findByPhoneNumber: ({ entityId, phoneNumber }) => {
    return collection.findOne({ entityId, phoneNumber });
  },
  findAllByCode: ({ entityId, campaignCode }) => {
    if (campaignCode === "ALL") {
      return collection
        .find({
          isActive: true,
          $or: [
            { failedCount: { $lt: 3 } },
            { failedCount: { $exists: false } },
          ],
        })
        .toArray();
    }
    return collection
      .find({
        entityId,
        campaignCode,
        isActive: true,
        $or: [{ failedCount: { $lt: 3 } }, { failedCount: { $exists: false } }],
      })
      .toArray();
  },
  incrementSendCount: ({ entityId, phoneNumber, success }) => {
    const updateParams = { entityId, phoneNumber, lastSendAttempt: new Date() };
    if (success) {
      updateParams.$inc = { sentCount: 1 };
      // Reset failed count because we only care if a number always fails
      updateParams.failedCount = 0;
    } else {
      updateParams.$inc = { failedCount: 1 };
    }
    return phoneNumberModel.createOrUpdate(updateParams);
  },
};

export default phoneNumberModel;
