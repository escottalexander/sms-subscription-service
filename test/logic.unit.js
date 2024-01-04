import sinon from "sinon";
import chai from "chai";
const expect = chai.expect;

import logic from "../src/logic.js";
import entityModel from "../src/model/entities.js";
import stateModel from "../src/model/state.js";
import phoneNumberModel from "../src/model/phoneNumbers.js";
import messenger from "../src/services/messenger.js";
import config from "../config.js";

describe("decipherMessage", () => {
  let getCampaignCodesStub;
  let findByPhoneNumberStub;
  let createStub;
  let removeStub;
  let sendStub;

  beforeEach(() => {
    getCampaignCodesStub = sinon.stub(entityModel, "getCampaignCodes");
    findByPhoneNumberStub = sinon.stub(phoneNumberModel, "findByPhoneNumber");
    createStub = sinon.stub(phoneNumberModel, "createOrUpdate");
    sendStub = sinon.stub(messenger, "send");

    removeStub = sinon.stub(phoneNumberModel, "remove");
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
      const findAllStub = sinon.stub(phoneNumberModel, "findAllByCode");
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
      ]);
      await logic.decipherMessage({
        Body: "SEND LOC1",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(findAllStub.calledOnceWithExactly("LOC1"));
      expect(sendStub.callCount).to.equal(3);
    });

    it("should call addAdmin when message is ADD ADMIN", async () => {
      const response = await logic.decipherMessage({
        Body: "ADD ADMIN 9999999999",
        From: "+1234567890",
        To: "+17777777777",
      });

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
      const addCodeStub = sinon.stub(entityModel, "addCampaignCode");
      const response = await logic.decipherMessage({
        Body: "ADD CODE TEST",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(addCodeStub.calledOnceWithExactly("TEST"));
      expect(response).to.equal("Successfully added code 'TEST'");
    });

    it("should call removeAdmin when message is REMOVE ADMIN", async () => {
      const response = await logic.decipherMessage({
        Body: "REMOVE ADMIN 9999999999",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(
        createStub.calledOnceWithExactly({
          phoneNumber: "+9999999999",
          isAdmin: false,
        })
      );
      expect(response).to.equal("Removed '9999999999' as an admin.");
    });

    it("should call removeCode when message is REMOVE CODE", async () => {
      const removeCodeStub = sinon.stub(entityModel, "removeCampaignCode");
      const phoneNumberStub = sinon.stub(
        phoneNumberModel,
        "updateCampaignCode"
      );

      const response = await logic.decipherMessage({
        Body: "REMOVE CODE TEST",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(removeCodeStub.calledOnceWithExactly("TEST"));
      expect(phoneNumberStub.calledOnceWithExactly("TEST", null));
      expect(response).to.equal("Successfully removed code 'TEST'");
    });

    it("should call changeCampaignCode when message is CHANGE CODE", async () => {
      const stateStub = sinon.stub(entityModel, "updateCampaignCode");
      const phoneNumberStub = sinon.stub(
        phoneNumberModel,
        "updateCampaignCode"
      );
      const response = await logic.decipherMessage({
        Body: "CHANGE CODE TEST1 TEST2",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(stateStub.calledOnceWithExactly("TEST1", "TEST2"));
      expect(phoneNumberStub.calledOnceWithExactly("TEST1", "TEST2"));
      expect(response).to.equal("Successfully changed code 'TEST1' to 'TEST2'");
    });

    it("should return RUNNING when message is STATUS", async () => {
      const response = await logic.decipherMessage({
        Body: "STATUS",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(response).to.equal("RUNNING");
    });

    it("should call shutDownProcess when message is SHUTDOWN", (done) => {
      const shutDownStub = sinon.stub(logic, "shutDownProcess");
      logic
        .decipherMessage({ Body: "SHUTDOWN", From: "+1234567890", To: "+17777777777", })
        .then(() => {
          setTimeout(() => {
            expect(shutDownStub.callCount).to.equal(1);
            done();
          }, 1100);
        });
    });

    it("should call sendCustomMessage when message is a CUSTOM $CODE", async () => {
      const findAllStub = sinon.stub(phoneNumberModel, "findAllByCode");
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
      ]);
      await logic.decipherMessage({
        Body: "CUSTOM LOC1 Hello world!",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(findAllStub.calledOnceWithExactly("LOC1"));
      expect(sendStub.callCount).to.equal(3);
      expect(sendStub.calledWith("+1234567890", "Hello world!"));
    });

    it("should call stateModel.createSetting when message is SET MESSAGE and setting doesn't exist", async () => {
      const getSettingStub = sinon.stub(stateModel, "getSetting");
      getSettingStub.resolves(null);
      const updateSettingStub = sinon.stub(stateModel, "updateSetting");
      const createSettingStub = sinon.stub(stateModel, "createSetting");

      const response = await logic.decipherMessage({
        Body: "SET MESSAGE Hello world!",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(response).to.equal("Default message has been set");
      expect(
        createSettingStub.calledOnceWithExactly(
          "deliveryMessage",
          "Hello world!"
        )
      );
      expect(updateSettingStub.notCalled);
    });

    it("should call stateModel.updateSetting when message is SET MESSAGE and setting exists", async () => {
      const setMessageStub = sinon.stub(entityModel, "setDefaultMessage");

      const response = await logic.decipherMessage({
        Body: "SET MESSAGE Hello world!",
        From: "+1234567890",
        To: "+17777777777",
      });

      expect(response).to.equal("Default message has been set");
      expect(
        setMessageStub.calledOnceWithExactly(
          "Hello world!"
        )
      );
    });

    it("should send message back to admin when message is not recognized", async () => {
      await logic.decipherMessage({
        Body: "NOTVALIDINSTRUCTION",
        From: "+1234567890",
        To: "+17777777777",
      });

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
      await logic.decipherMessage({
        Body: "LOC1",
        From: "+15555555555",
        To: "+17777777777",
      });

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
      await logic.decipherMessage({
        Body: "INVALID",
        From: "+15555555555",
        To: "+17777777777",
      });

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          `We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a message to ${config.supportNumberHumanReadable} explaining the problem.`
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
      await logic.decipherMessage({
        Body: "LOC1",
        From: "+14444444444",
        To: "+17777777777",
      });

      expect(createStub.callCount).to.equal(1);
    });

    it("should remove phone number from database and send confirmation when message is STOP", async () => {
      await logic.decipherMessage({
        Body: "STOP",
        From: "+14444444444",
        To: "+17777777777",
      });

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
      await logic.decipherMessage({
        Body: "INVALID",
        From: "+14444444444",
        To: "+17777777777",
      });

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          `We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a message to ${config.supportNumberHumanReadable} explaining the problem.`
        )
      );
    });
  });
});
