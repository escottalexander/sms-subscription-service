import db from "../lib/services/mongodb.js";

const collection = db.collection("phone-numbers");
const phoneNumberModel = {
  createOrUpdate: (params) => {
    // Add last modified date to record
    const now = new Date();
    params.lastModified = now;
    const updateObj = { $set: params };
    // Actually use upserts to make sure we don't have duplicates
    return collection.updateOne(
      { phoneNumber: params.phoneNumber },
      updateObj,
      { upsert: true }
    );
  },
  updateCampaignCode: (oldCode, newCode) => {
    const now = new Date();
    return collection.updateMany(
      { campaignCode: oldCode },
      { $set: { campaignCode: newCode, lastModified: now } }
    );
  },
  remove: ({ phoneNumber }) => {
    return collection.deleteOne({ phoneNumber });
  },
  findByPhoneNumber: ({ phoneNumber }) => {
    return collection.findOne({ phoneNumber });
  },
  findAllByCode: ({ campaignCode }) => {
    if (campaignCode === "ALL") {
      return collection.find({ isActive: true }).toArray();
    }
    return collection.find({ campaignCode, isActive: true }).toArray();
  },
};

export default phoneNumberModel;
