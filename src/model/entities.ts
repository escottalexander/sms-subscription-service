import { Collection, Db, Document } from "mongodb";

class Entity implements Document {
  entityId: string;
  accountPhoneNumber: string;
  campaignCodes: string[];
  defaultMessage: string;
  lastUpdated: Date;
  name: string;
  contactName: string;
  contactNumber: string;
  lastSentCampaigns: { [key: string]: Date };
  messages: { [key: string]: string };
}

class EntityModel {
  collection: Collection<Entity>;
  constructor(storage: Db) {
    this.collection = storage.collection("entities");
  }

  createOrUpdate(params: Partial<Entity>) {
    // Add last modified date to record
    const now = new Date();
    params.lastUpdated = now;
    const updateObj = { $set: params };

    // Actually use upserts to make sure we don't have duplicates
    return this.collection.updateOne(
      { entityId: params.entityId },
      updateObj,
      { upsert: true }
    );
  };

  findByEntityId({ entityId }: { entityId: string | null }) {
    return this.collection.findOne({ entityId });
  };

  getAll() {
    return this.collection.find().toArray();
  };

  findByPhoneNumber(phoneNumber: string) {
    return this.collection.findOne({ accountPhoneNumber: phoneNumber });
  };

  async getCampaignCodes(entityId: string) {
    const entity = await this.collection
      .findOne({ entityId });
    return entity.campaignCodes;
  };

  async addCampaignCode(entityId: string, code: string) {
    return this.collection.updateOne(
      { entityId },
      { $addToSet: { campaignCodes: code } },
      { upsert: true }
    );
  };

  removeCampaignCode(entityId: string, code: string) {
    return this.collection.updateOne(
      { entityId },
      { $pull: { campaignCodes: code } },
    );
  };

  async updateCampaignCode(entityId: string, oldCode: string, newCode: string) {
    const existing = await this.collection
      .find({ entityId, campaignCodes: newCode })
      .toArray();
    if (existing && existing.length > 0) {
      // remove old code and don't add new one
      return this.removeCampaignCode(entityId, oldCode);
    } else {
      // replace old one with new one
      return this.collection.updateOne(
        { entityId, campaignCodes: oldCode },
        { $set: { "campaignCodes.$": newCode } }
      );
    }
  };

  async getDefaultMessage(entityId: string) {
    const entity = await this.collection
      .findOne({ entityId });
    return entity.defaultMessage;
  };

  async setDefaultMessage(entityId: string, message: string) {
    return this.collection.updateOne(
      { entityId },
      { $set: { defaultMessage: message } },
      { upsert: true }
    );
  };

  async getMessage(entityId: string, name: string) {
    const entity = await this.collection
      .findOne({ entityId });
    return entity.messages?.[name];
  };

  async setMessage(entityId: string, name: string, message: string) {
    return this.collection.updateOne(
      { entityId },
      { $set: { [`messages.${name}`]: message } },
      { upsert: true }
    );
  };

  async getMessageNames(entityId: string) {
    const entity = await this.collection
      .findOne({ entityId });
      const messages = entity.messages || {};
      const names =  Object.keys(messages);
    return names;
  };

  async setLastSentCampaign(entityId: string, code: string) {
    return this.collection.updateOne(
      { entityId },
      { $set: { [`lastSentCampaigns.${code}`]: new Date() } },
      { upsert: true }
    );
  };

  async getLastSentCampaigns(entityId: string) {
    const entity = await this.collection
      .findOne({ entityId });
    return entity.lastSentCampaigns;
  };
};

export { EntityModel, Entity };
