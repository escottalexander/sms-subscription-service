import db from "../lib/services/mongodb.js";

const collection = db.collection("state");
const stateModel = {
  createSetting: ({ key, value }) => {
    return collection.insertOne({ key, value });
  },
  getSetting: async (key) => {
    return (await collection.find({ key }).project({ value: 1 }).toArray())[0]
      .value;
  },
  updateSetting: (key, value) => {
    collection.updateOne({ key }, { $set: { value } });
  },
  getCampaignCodes: async () => {
    return (
      await collection
        .find({ key: "campaignCodes" })
        .project({ value: 1 })
        .toArray()
    )[0].value;
  },
  addCampaignCode: async (code) => {
    return collection.updateOne(
      { key: "campaignCodes" },
      { $addToSet: { value: code } }
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
