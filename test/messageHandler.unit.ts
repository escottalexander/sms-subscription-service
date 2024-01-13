import * as sinon from "sinon";
import * as chai from "chai";
const expect = chai.expect;
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/example.env" });
const { support_number_numan_readable } = process.env;

import MessageHandler from "../src/server/messageHandler.js";
import { Entity, EntityModel } from "../src/model/entities.js";
import { PhoneNumberModel, PhoneNumber } from "../src/model/phoneNumbers.js";
import messenger from "../src/services/messenger.js";
import { Db, WithId } from "mongodb";
import { ReportingModel } from "../src/model/reporting.js";

const entity = {
  entityId: "00001",
    accountPhoneNumber: "+17777777777",
    defaultMessage: "This is the default message",
    name: "Test Entity",
    contactName: "Test Contact",
    contactNumber: "+18888888888",
    campaignCodes: ["LOC1", "LOC2"],
} as unknown as WithId<Entity>;

describe("decipherMessage", () => {
  let getCampaignCodesStub: sinon.SinonStub;
  let findByPhoneNumberStub: sinon.SinonStub;
  let createStub: sinon.SinonStub;
  let removeStub: sinon.SinonStub;
  let sendStub: sinon.SinonStub;
  let getDefaultMessageStub: sinon.SinonStub;
  let incrementSendCountStub: sinon.SinonStub;
  let incrementCountStub: sinon.SinonStub;
 
  let messageHandler: MessageHandler;

  const getRequestContext = (req: any, fromPhoneNumberEntry?: any) => {
    return {
      message: req.Body,
      entity,
      fromPhone: req.From,
      fromPhoneNumberEntry
    } as { message: string; entity: WithId<Entity>; fromPhone?: string; fromPhoneNumberEntry?: WithId<PhoneNumber>; }

  };

  beforeEach(() => {
    const storage = { collection: sinon.stub()}
    messageHandler = new MessageHandler(storage as unknown as Db);
    getCampaignCodesStub = sinon.stub(EntityModel.prototype, "getCampaignCodes");
    findByPhoneNumberStub = sinon.stub(PhoneNumberModel.prototype, "findByPhoneNumber");
    createStub = sinon.stub(PhoneNumberModel.prototype, "createOrUpdate");
    sendStub = sinon.stub(messenger, "send");
    getDefaultMessageStub = sinon.stub(EntityModel.prototype, "getDefaultMessage");
    removeStub = sinon.stub(PhoneNumberModel.prototype, "remove");
    incrementSendCountStub = sinon.stub(PhoneNumberModel.prototype, "incrementSendCount");
    incrementCountStub = sinon.stub(ReportingModel.prototype, "incrementCount");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("when a message is received from an admin phone number", () => {
    beforeEach(() => {
      getCampaignCodesStub.resolves(["LOC1", "LOC2"]);
      findByPhoneNumberStub.resolves({
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
    });

    it("should call handleDeliveryMessage when message is a campaign code", async () => {
      const findAllStub = sinon.stub(PhoneNumberModel.prototype, "findAllByCode");
      findAllStub.resolves([
        {
          phoneNumber: "+1234567890",
          campaignCode: "LOC1",
          isAdmin: false,
        },
        {
          phoneNumber: "+2234567890",
          campaignCode: "LOC1",
          isAdmin: false,
        },
        {
          phoneNumber: "+3234567890",
          campaignCode: "LOC1",
          isAdmin: false,
        },
      ] as WithId<PhoneNumber>[]);
      const req = {
        Body: "SEND LOC1",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
      await messageHandler.decipherMessage(reqCtx, req);

      expect(findAllStub.calledOnceWithExactly({entityId: "00001", campaignCode: "LOC1"}));
      expect(sendStub.callCount).to.equal(3);
    });

    it("should call addAdmin when message is ADD ADMIN", async () => {
      const req = {
        Body: "ADD ADMIN 9999999999",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(
        createStub.calledOnceWithExactly({
          phoneNumber: "+9999999999",
          isAdmin: true,
          isActive: true,
        })
      );
      expect(response).to.equal("Added '9999999999' as an admin.");
    });

    it("should call addCode when message is ADD CODE", async () => {
      const addCodeStub = sinon.stub(EntityModel.prototype, "addCampaignCode");
      const req = {
        Body: "ADD CODE TEST",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(addCodeStub.calledOnceWithExactly("00001", "TEST"));
      expect(response).to.equal("Successfully added code 'TEST'");
    });

    it("should call removeAdmin when message is REMOVE ADMIN", async () => {
      const req = {
        Body: "REMOVE ADMIN 9999999999",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(
        createStub.calledOnceWithExactly({
          phoneNumber: "+9999999999",
          isAdmin: false,
        })
      );
      expect(response).to.equal("Removed '9999999999' as an admin.");
    });

    it("should call removeCode when message is REMOVE CODE", async () => {
      const removeCodeStub = sinon.stub(EntityModel.prototype, "removeCampaignCode");
      const phoneNumberStub = sinon.stub(
        PhoneNumberModel.prototype,
        "updateCampaignCode"
      );

      const req = {
        Body: "REMOVE CODE TEST",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });

      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(removeCodeStub.calledOnceWithExactly("00001", "TEST"));
      expect(phoneNumberStub.calledOnceWithExactly("00001", "TEST", null));
      expect(response).to.equal("Successfully removed code 'TEST'");
    });

    it("should call changeCampaignCode when message is CHANGE CODE", async () => {
      const stateStub = sinon.stub(EntityModel.prototype, "updateCampaignCode");
      const phoneNumberStub = sinon.stub(
        PhoneNumberModel.prototype,
        "updateCampaignCode"
      );
      const req = {
        Body: "CHANGE CODE TEST1 TEST2",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });

      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(stateStub.calledOnceWithExactly("00001", "TEST1", "TEST2"));
      expect(phoneNumberStub.calledOnceWithExactly("00001", "TEST1", "TEST2"));
      expect(response).to.equal("Successfully changed code 'TEST1' to 'TEST2'");
    });

    it("should return RUNNING when message is STATUS", async () => {
      const req = {
        Body: "STATUS",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(response).to.equal("RUNNING");
    });

    it("should call shutDownProcess when message is SHUTDOWN", (done) => {
      const shutDownStub = sinon.stub(messageHandler, "shutDownProcess");
      const req = {
        Body: "SHUTDOWN", From: "+1234567890", To: "+17777777777"
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
      messageHandler
        .decipherMessage(reqCtx, req)
        .then(() => {
          setTimeout(() => {
            expect(shutDownStub.callCount).to.equal(1);
            done();
          }, 1100);
        });
    });

    it("should call sendCustomMessage when message is a CUSTOM $CODE", async () => {
      const findAllStub = sinon.stub(PhoneNumberModel.prototype, "findAllByCode");
      findAllStub.resolves([
        {
          phoneNumber: "+1234567890",
          campaignCode: "LOC1",
          isAdmin: true,
        },
        {
          phoneNumber: "+2234567890",
          campaignCode: "LOC1",
          isAdmin: false,
        },
        {
          phoneNumber: "+3234567890",
          campaignCode: "LOC1",
          isAdmin: false,
        },
      ] as WithId<PhoneNumber>[]);
      const req = {
        Body: "CUSTOM LOC1 Hello world!",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });
      await messageHandler.decipherMessage(reqCtx, req);

      expect(findAllStub.calledOnceWithExactly({entityId: "00001", campaignCode: "LOC1"}));
      expect(sendStub.callCount).to.equal(3);
      expect(sendStub.calledWith("+1234567890", "Hello world!"));
      expect(sendStub.calledWith("+2234567890", "Hello world!"));
      expect(sendStub.calledWith("+3234567890", "Hello world!"));
    });

    it("should call EntityModel.setDefaultMessage when message is SET MESSAGE and setting exists", async () => {
      const setMessageStub = sinon.stub(EntityModel.prototype, "setDefaultMessage");

      const req = {
        Body: "SET MESSAGE Hello world!",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });

      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(response).to.equal("Default message has been set");
      expect(
        setMessageStub.calledOnceWithExactly("00001", "Hello world!")
      );
    });

    it("should call EntityModel.getDefaultMessage when message is GET MESSAGE", async () => {
      getDefaultMessageStub.resolves("This is the default message");
      const req = {
        Body: "GET MESSAGE",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });

      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(response).to.equal("This is the default message");
      expect(
        getDefaultMessageStub.calledOnceWithExactly("00001")
      );
    });

    it("should call EntityModel.getLastCode when message is GET LAST CODE", async () => {
      const getLastCodeStub = sinon.stub(EntityModel.prototype, "getLastCode");
      getLastCodeStub.resolves("CODE");
      const req = {
        Body: "GET LAST CODE",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });

      const response = await messageHandler.decipherMessage(reqCtx, req);

      expect(response).to.equal("CODE");
      expect(
        getLastCodeStub.calledOnceWithExactly("00001")
      );
    });

    it("should send message back to admin when message is not recognized", async () => {

      const req = {
        Body: "NOTVALIDINSTRUCTION",
        From: "+1234567890",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+1234567890",
        isAdmin: true,
        isActive: true,
      });

      await messageHandler.decipherMessage(reqCtx, req);

      expect(
        sendStub.calledOnceWithExactly(
          "+1234567890",
          "I don't recognize that instruction... is there a typo?"
        )
      );
    });
  });

  describe("when a message is received from a non-admin phone number that is not subscribed", () => {
    beforeEach(() => {
      getCampaignCodesStub.resolves(["LOC1", "LOC2"]);
      findByPhoneNumberStub.resolves();
    });

    it("should add phone number to database and send confirmation when sent valid campaign code", async () => {
      const req = {
        Body: "LOC1",
        From: "+15555555555",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req);

      await messageHandler.decipherMessage(reqCtx, req);

      expect(
        createStub.calledOnceWithExactly({
          phoneNumber: "+15555555555",
          campaignCode: "LOC1",
        })
      );
      expect(
        sendStub.calledOnceWithExactly(
          "+15555555555",
          "You have been signed up to receive notifications. If at any point you want to stop receiving messages, text STOP"
        )
      );
    });

    it("should send unrecognized code message when message is not valid", async () => {
      const req = {
        Body: "INVALID",
        From: "+15555555555",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req);

      await messageHandler.decipherMessage(reqCtx, req);

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          `We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a message to ${support_number_numan_readable} explaining the problem.`
        )
      );
    });
  });

  describe("when a message is received from a non-admin phone number that is already subscribed", () => {
    beforeEach(() => {
      getCampaignCodesStub.resolves(["LOC1", "LOC2"]);
      findByPhoneNumberStub.resolves({
        phoneNumber: "+14444444444",
        campaignCode: "LOC2",
      });
    });

    it("should overwrite current assigned campaignCode when signed up for different code", async () => {

      const req = {
        Body: "LOC1",
        From: "+14444444444",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+14444444444",
        isAdmin: false,
        isActive: true,
      });

      await messageHandler.decipherMessage(reqCtx, req);

      expect(createStub.callCount).to.equal(1);
    });

    it("should remove phone number from database and send confirmation when message is STOP", async () => {
      const req = {
        Body: "STOP",
        From: "+14444444444",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+14444444444",
        isAdmin: false,
        isActive: true,
      });

      await messageHandler.decipherMessage(reqCtx, req);

      expect(
        removeStub.calledOnceWithExactly({
          phoneNumber: "+14444444444",
        })
      );
      expect(
        sendStub.calledOnceWithExactly(
          "+14444444444",
          "Unsubscribe successful. You will no longer receive notifications."
        )
      );
    });

    it("should send unrecognized code message when message is not valid", async () => {
      const req = {
        Body: "INVALID",
        From: "+14444444444",
        To: "+17777777777",
      };
      const reqCtx = getRequestContext(req, {
        phoneNumber: "+14444444444",
        isAdmin: false,
        isActive: true,
      });

      await messageHandler.decipherMessage(reqCtx, req);

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          `We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a message to ${support_number_numan_readable} explaining the problem.`
        )
      );
    });
  });
});
