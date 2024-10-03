import { expect } from "chai";
import sinon from "sinon";
import { Request } from "express";
import StatusCallbackHandler from "../src/server/statusCallbackHandler.js";
import { PhoneNumberModel } from "../src/model/phoneNumbers.js";
import connect from "../src/services/mongodb.js";

describe("StatusCallbackHandler", () => {
  let statusCallbackHandler: StatusCallbackHandler;
  let req: Partial<Request>;
  let phoneNumberModelStub: sinon.SinonStubbedInstance<PhoneNumberModel>;

  beforeEach(async () => {
    const db = await connect();
    phoneNumberModelStub = sinon.createStubInstance(PhoneNumberModel);
    statusCallbackHandler = new StatusCallbackHandler(db);
    statusCallbackHandler.models.phoneNumber = phoneNumberModelStub;

    req = {
      params: { entityId: "testEntityId" },
      body: {
        MessageStatus: "delivered",
        MessageSid: "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        MessagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        AccountSid: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        From: "+16232320112",
        ApiVersion: "2010-04-01",
        To: "+15622089096",
        SmsStatus: "delivered",
        SmsSid: "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    };
  });

  it("should update phoneNumber entry with success true when status is delivered", async () => {
    await statusCallbackHandler.handle(req as any);

    expect(phoneNumberModelStub.incrementSendCount.calledOnce).to.be.true;
    expect(phoneNumberModelStub.incrementSendCount.calledWith({
      entityId: "testEntityId",
      phoneNumber: "+15622089096",
      success: true
    })).to.be.true;
  });

  it("should update phoneNumber entry with success false when status is failed", async () => {
    req.body.MessageStatus = "failed";

    await statusCallbackHandler.handle(req as any);

    expect(phoneNumberModelStub.incrementSendCount.calledOnce).to.be.true;
    expect(phoneNumberModelStub.incrementSendCount.calledWith({
      entityId: "testEntityId",
      phoneNumber: "+15622089096",
      success: false
    })).to.be.true;
  });

  it("should update phoneNumber entry with success false when status is undelivered", async () => {
    req.body.MessageStatus = "undelivered";

    await statusCallbackHandler.handle(req as any);

    expect(phoneNumberModelStub.incrementSendCount.calledOnce).to.be.true;
    expect(phoneNumberModelStub.incrementSendCount.calledWith({
      entityId: "testEntityId",
      phoneNumber: "+15622089096",
      success: false
    })).to.be.true;
  });
});