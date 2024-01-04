import db from "../services/mongodb.js";

const collection = db.collection("state");
const stateModel = {
  createSetting: (key, value) => {
    return collection.insertOne({ key, value });
  },
  getSetting: async (key) => {
    const setting = await collection.find({ key }).toArray();
    if (setting && setting.length > 0) {
      return setting[0].value;
    }
    return null;
  },
  updateSetting: (key, value) => {
    return collection.updateOne({ key }, { $set: { value } });
  },
  getCampaignCodes: async () => {
    const codes = await collection
      .find({ key: "campaignCodes" })
      .project({ value: 1 })
      .toArray();
    if (codes && codes.length > 0) {
      return codes[0].value;
    }
    return [];
  },
  addCampaignCode: async (code) => {
    return collection.updateOne(
      { key: "campaignCodes" },
      { $addToSet: { value: code } },
      { upsert: true }
    );
  },
  removeCampaignCode: async (code) => {
    return collection.updateOne(
      { key: "campaignCodes" },
      { $pull: { value: code } }
    );
  },
  updateCampaignCode: async (oldCode, newCode) => {
    const existing = await collection
      .find({ key: "campaignCodes", value: newCode })
      .toArray();
    if (existing && existing.length > 0) {
      // remove old code and don't add new one
      return stateModel.removeCampaignCode(oldCode);
    } else {
      // replace old one with new one
      return collection.updateOne(
        { key: "campaignCodes", value: oldCode },
        { $set: { "value.$": newCode } }
      );
    }
  },
};

export default stateModel;
