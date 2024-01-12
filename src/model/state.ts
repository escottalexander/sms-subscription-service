import { Collection, Db, OptionalId, Document } from "mongodb";

class StateSetting implements Document {
  key: string;
  value: any;
}

class StateModel {
  collection: Collection<StateSetting>;
  constructor(storage: Db) {
    this.collection = storage.collection("state");
  }

  createSetting(key: string, value: any) {
    return this.collection.insertOne({ key, value } as OptionalId<StateSetting>);
  }

  async getSetting(key: string) {
    const setting = await this.collection.find({ key }).toArray();
    if (setting && setting.length > 0) {
      return setting[0].value;
    }
    return null;
  }

  updateSetting(key: string, value: any) {
    return this.collection.updateOne({ key }, { $set: { value } });
  }

  async getCampaignCodes() {
    const codes = await this.collection
      .find({ key: "campaignCodes" })
      .project({ value: 1 })
      .toArray();
    if (codes && codes.length > 0) {
      return codes[0].value;
    }
    return [];
  }
}

export { StateModel, StateSetting };
