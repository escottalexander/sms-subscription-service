import db from "../lib/services/mongodb.js";

const collection = db.collection("entities");
const entityModel = {
  createOrUpdate: (params) => {
    // Add last modified date to record
    const now = new Date();
    params.lastModified = now;
    const updateObj = { $set: params };
    // 
    // Actually use upserts to make sure we don't have duplicates
    return collection.updateOne(
      { entityId: params.entityId },
      updateObj,
      { upsert: true }
    );
  },
  findByEntityId: ({ entityId }) => {
    return collection.findOne({ entityId });
  },
  findByPhoneNumber: (phoneNumber) => {
    return collection.findOne({ accountPhoneNumber: phoneNumber });
  },
  getCampaignCodes: async (entityId) => {
    const entity = await collection
      .findOne({ entityId });
    return entity.campaignCodes;
  },
  addCampaignCode: async (entityId, code) => {
    return collection.updateOne(
      { entityId },
      { $addToSet: { campaignCodes: code } },
      { upsert: true }
    );
  },
  removeCampaignCode: async (entityId, code) => {
    return collection.updateOne(
      { entityId },
      { $pull: { campaignCodes: code } },
    );
  },
  updateCampaignCode: async (entityId, oldCode, newCode) => {
    const existing = await collection
      .find({ entityId, campaignCodes: newCode })
      .toArray();
    if (existing && existing.length > 0) {
      // remove old code and don't add new one
      return entityModel.removeCampaignCode(entityId, oldCode);
    } else {
      // replace old one with new one
      return collection.updateOne(
        { entityId, campaignCodes: oldCode },
        { $set: { "campaignCodes.$": newCode } }
      );
    }
  },
  getDefaultMessage: async (entityId) => {
    const entity = await collection
      .findOne({ entityId })
    return entity.defaultMessage;
  },
  setDefaultMessage: async (entityId, message) => {
    return collection.updateOne(
      { entityId },
      { $set: { defaultMessage: message } },
      { upsert: true }
    );
  },
};

export default entityModel;
