import { Collection, Db, Document } from "mongodb";

class PhoneNumber implements Document {
  entityId: string;
  phoneNumber: string;
  campaignCode: string;
  isActive: boolean;
  isAdmin: boolean;
  failedCount?: number;
  sentCount?: number;
  lastUpdated: Date;
  lastSendAttempt?: Date;
}

class PhoneNumberModel {
  collection: Collection<PhoneNumber>;
  constructor(storage: Db) {
    this.collection = storage.collection("phone-numbers");
  }
  createOrUpdate(params: { [x: string]: any; entityId?: string; phoneNumber?: string; $inc?: {} }) {
    const { entityId, phoneNumber, $inc } = params;
    const exclude = ["entityId", "phoneNumber", "$inc"];
    const updateObj: { $set: any, $inc?: any } = { $set: {} };
    for (const key in params) {
      if (exclude.includes(key)) {
        continue;
      }
      updateObj.$set[key] = params[key];
    }
    if ($inc) {
      updateObj.$inc = $inc;
    }
    // Add last modified date to record
    const now = new Date();
    updateObj.$set.lastUpdated = now;
    // Actually use upserts to make sure we don't have duplicates
    return this.collection.updateOne(
      { entityId, phoneNumber },
      updateObj,
      { upsert: true }
    );
  }

  updateCampaignCode(entityId: string, oldCode: string, newCode: string | null) {
    const now = new Date();
    return this.collection.updateMany(
      { entityId, campaignCode: oldCode },
      { $set: { campaignCode: newCode, lastUpdated: now } }
    );
  }

  remove({ entityId, phoneNumber }: { entityId: string, phoneNumber: string }) {
    return this.collection.deleteOne({ entityId, phoneNumber });
  }

  findByPhoneNumber({ entityId, phoneNumber }: { entityId: string, phoneNumber: string }) {
    return this.collection.findOne({ entityId, phoneNumber });
  }

  findAllByCode({ entityId, campaignCode }: { entityId: string, campaignCode: string }) {
    if (campaignCode === "ALL") {
      return this.collection
        .find({
          isActive: true,
          $or: [
            { failedCount: { $lt: 3 } },
            { failedCount: { $exists: false } },
          ],
        })
        .toArray();
    }
    return this.collection
      .find({
        entityId,
        campaignCode,
        isActive: true,
        $or: [{ failedCount: { $lt: 3 } }, { failedCount: { $exists: false } }],
      })
      .toArray();
  }

  incrementSendCount({ entityId, phoneNumber, success }: { entityId: string, phoneNumber: string, success: boolean }) {
    const updateParams = { entityId, phoneNumber, lastSendAttempt: new Date() } as { entityId: string, phoneNumber: string, lastSendAttempt: Date, $inc?: any, failedCount?: number, sentCount?: number };
    if (success) {
      updateParams.$inc = { sentCount: 1 };
      // Reset failed count because we only care if a number always fails
      updateParams.failedCount = 0;
    } else {
      updateParams.$inc = { failedCount: 1 };
    }
    return this.createOrUpdate(updateParams);
  }
}

export { PhoneNumberModel, PhoneNumber };
