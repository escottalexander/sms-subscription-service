import sinon from "sinon";
import chai from "chai";
const expect = chai.expect;

import logic from "../lib/logic.js";
import stateModel from "../model/state.js";
import phoneNumberModel from "../model/phoneNumbers.js";
import messenger from "../lib/services/messenger.js";
import config from "../config.js";

describe("decipherMessage", () => {
  let getCampaignCodesStub;
  let findByPhoneNumberStub;
  let createStub;
  let removeStub;
  let sendStub;

  beforeEach(() => {
    getCampaignCodesStub = sinon.stub(stateModel, "getCampaignCodes");
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
      await logic.decipherMessage({ Body: "LOC1", From: "+1234567890" });

      expect(findAllStub.calledOnceWithExactly("LOC1"));
      expect(sendStub.callCount).to.equal(3);
    });

    it("should call addAdmin when message is ADD ADMIN", async () => {
      await logic.decipherMessage({
        Body: "ADD ADMIN 9999999999",
        From: "+1234567890",
      });

      expect(
        createStub.calledOnceWithExactly({
          phoneNumber: "+9999999999",
          isAdmin: true,
        })
      );
      expect(sendStub.callCount).to.equal(1);
    });

    it("should call addCode when message is ADD CODE", async () => {
      const addCodeStub = sinon.stub(stateModel, "addCampaignCode");
      await logic.decipherMessage({
        Body: "ADD CODE TEST",
        From: "+1234567890",
      });

      expect(addCodeStub.calledOnceWithExactly("TEST"));
      expect(sendStub.callCount).to.equal(1);
    });

    it("should call removeAdmin when message is REMOVE ADMIN", async () => {
      await logic.decipherMessage({
        Body: "REMOVE ADMIN 9999999999",
        From: "+1234567890",
      });

      expect(
        createStub.calledOnceWithExactly({
          phoneNumber: "+9999999999",
          isAdmin: false,
        })
      );
      expect(sendStub.callCount).to.equal(1);
    });

    it("should call removeCode when message is REMOVE CODE", async () => {
      const removeCodeStub = sinon.stub(stateModel, "removeCampaignCode");
      const phoneNumberStub = sinon.stub(
        phoneNumberModel,
        "updateCampaignCode"
      );
      
      await logic.decipherMessage({
        Body: "REMOVE CODE TEST",
        From: "+1234567890",
      });

      expect(removeCodeStub.calledOnceWithExactly("TEST"));
      expect(phoneNumberStub.calledOnceWithExactly("TEST", null));
      expect(sendStub.callCount).to.equal(1);
    });

    it("should call changeCampaignCode when message is CHANGE CODE", async () => {
      const stateStub = sinon.stub(stateModel, "updateCampaignCode");
      const phoneNumberStub = sinon.stub(
        phoneNumberModel,
        "updateCampaignCode"
      );
      await logic.decipherMessage({
        Body: "CHANGE CODE TEST1 TEST2",
        From: "+1234567890",
      });

      expect(stateStub.calledOnceWithExactly("TEST1", "TEST2"));
      expect(phoneNumberStub.calledOnceWithExactly("TEST1", "TEST2"));
      expect(sendStub.callCount).to.equal(1);
    });

    it("should return RUNNING when message is STATUS", async () => {
      await logic.decipherMessage({ Body: "STATUS", From: "+1234567890" });

      expect(sendStub.calledOnceWithExactly("+1234567890", "RUNNING"));
    });

    it("should return RUNNING when message is STATUS", async () => {
      const shutDownStub = sinon.stub(logic, "shutDownProcess");
      await logic.decipherMessage({ Body: "SHUTDOWN", From: "+1234567890" });

      expect(shutDownStub.callCount).to.equal(1);
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
      });

      expect(findAllStub.calledOnceWithExactly("LOC1"));
      expect(sendStub.callCount).to.equal(3);
      expect(sendStub.calledWith("+1234567890", "Hello world!"));
    });

    it("should send message back to admin when message is not recognized", async () => {
      await logic.decipherMessage({
        Body: "NOTVALIDINSTRUCTION",
        From: "+1234567890",
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
      await logic.decipherMessage({ Body: "LOC1", From: "+15555555555" });

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
      await logic.decipherMessage({ Body: "INVALID", From: "+15555555555" });

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          `We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a massage to ${config.supportNumberHumanReadable} explaining the problem.`
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

    it("should send message when sent valid message with same campaign code", async () => {
      await logic.decipherMessage({ Body: "LOC2", From: "+14444444444" });

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          "+14444444444",
          "You are already signed up to receive messages for this location. If you would like to stop receiving messages, send STOP."
        )
      );
    });

    it("should send message to switch location code when already signed up for different location", async () => {
      await logic.decipherMessage({ Body: "LOC1", From: "+14444444444" });

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          "+14444444444",
          "You are currently signed up for LOC2. Text STOP if you would like to stop receiving messages for this delivery. Then you can send LOC1 to sign up for those delivery messages."
        )
      );
    });

    it("should remove phone number from database and send confirmation when message is STOP", async () => {
      await logic.decipherMessage({ Body: "STOP", From: "+14444444444" });

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
      await logic.decipherMessage({ Body: "INVALID", From: "+14444444444" });

      expect(createStub.callCount).to.equal(0);
      expect(
        sendStub.calledOnceWithExactly(
          `We can't recognize that code. Please correct if it contains a typo. If you believe it to be correct please send a massage to ${config.supportNumberHumanReadable} explaining the problem.`
        )
      );
    });
  });
});
