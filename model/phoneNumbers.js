import db from "../lib/services/mongodb.js";

const collection = db.collection("phone-numbers");
const phoneNumberModel = {
  createOrUpdate: ({ phoneNumber, campaignCode, isAdmin = false }) => {
    let updateObj;
    // If campaign code is null then don't overwrite
    if (!campaignCode) {
      updateObj = { $set: { phoneNumber, isAdmin } };
    } else {
      updateObj = { $set: { phoneNumber, campaignCode, isAdmin } };
    }
    // Actually use upserts to make sure we don't have duplicates
    return collection.updateOne({ phoneNumber }, updateObj, { upsert: true });
  },
  updateCampaignCode: (oldCode, newCode) => {
    return collection.updateMany(
      { campaignCode: oldCode },
      { $set: { campaignCode: newCode } }
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
      return collection.find({}).toArray();
    }
    return collection.find({ campaignCode }).toArray();
  },
};

export default phoneNumberModel;
