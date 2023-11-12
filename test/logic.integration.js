import sinon from "sinon";
import chai from "chai";
const expect = chai.expect;

import db from "../lib/services/mongodb.js";
import logic from "../lib/logic.js";
import stateModel from "../model/state.js";
import phoneNumberModel from "../model/phoneNumbers.js";
import messenger from "../lib/services/messenger.js";
import responses from "../responses.js";

const admin = { phoneNumber: "+12345678910", isAdmin: true, isActive: true };
const normalUser = {
  phoneNumber: "+15555555555",
  isAdmin: true,
  isActive: true,
};

async function init() {
  // Drop all records in db
  db.collection("phone-numbers").drop();
  db.collection("reporting-daily").drop();
  db.collection("state").drop();

  // Create an admin to test with
  await phoneNumberModel.createOrUpdate(admin);

  // Stub out shutdown function so it doesn't stop the tests XD
  sinon.stub(logic,"shutDownProcess").returns(true);
}

let sendStub;
describe("Core Logic", () => {
  before(init);
  beforeEach(() => {
    sendStub = sinon.stub(messenger, "send").returns(true);
  });
  afterEach(() => {
    sendStub.restore();
  });

  it("should set a message when called by an admin with SET MESSAGE", async () => {
    const message = {
      Body: "SET MESSAGE Hello world!",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    const setting = await stateModel.getSetting("deliveryMessage");
    expect(setting).to.equal("Hello world!");
    expect(response).to.equal(responses.SET_MESSAGE);
  });

  it("should add a code when it receives ADD CODE from admin", async () => {
    const message = { Body: "add code test", From: admin.phoneNumber };
    const response = await logic.decipherMessage(message);

    const codes = await stateModel.getCampaignCodes();
    expect(codes.includes("TEST"));
    expect(response).to.equal(responses.ADD_CODE.replace("%CODE%", "TEST"));
  });

  it("should add multiple codes when it receives different codes with ADD CODE from admin", async () => {
    const message1 = { Body: "add code test1", From: admin.phoneNumber };
    const response1 = await logic.decipherMessage(message1);

    const message2 = { Body: "add code test2", From: admin.phoneNumber };
    const response2 = await logic.decipherMessage(message2);

    const codes = await stateModel.getCampaignCodes();
    expect(codes.includes("TEST1"));
    expect(codes.includes("TEST2"));
    expect(response1).to.equal(responses.ADD_CODE.replace("%CODE%", "TEST1"));
    expect(response2).to.equal(responses.ADD_CODE.replace("%CODE%", "TEST2"));
  });

  it("should add a subscriber when non-admin sends a code", async () => {
    const message = { Body: "test", From: normalUser.phoneNumber };
    const response = await logic.decipherMessage(message);

    const user = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(response).to.equal(responses.VALID_CAMPAIGN_CODE);
  });

  it("should add a subscriber when non-admin sends a code with extra whitespace", async () => {
    const message = { Body: "test  ", From: normalUser.phoneNumber };
    const response = await logic.decipherMessage(message);

    const user = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(response).to.equal(responses.VALID_CAMPAIGN_CODE);
  });

  it("should send a message to subscriber when SEND CODE is sent by admin", async () => {
    const message = { Body: "send test", From: admin.phoneNumber };
    const response = await logic.decipherMessage(message);

    expect(response).to.equal(
      responses.SEND_CODE.replace("%CODE%", "TEST").replace("%COUNT%", 1)
    );
    expect(
      sendStub.calledWithExactly(
        normalUser.phoneNumber,
        responses.DEFAULT_MESSAGE
      )
    );
  });

  it("should send a message to subscriber when CUSTOM CODE is sent by admin", async () => {
    const message = {
      Body: "custom test Hello world!",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    expect(response).to.equal(responses.CUSTOM_MESSAGE.replace("%COUNT%", 1));
    expect(sendStub.calledWithExactly(normalUser.phoneNumber, "Hello world!"));
    expect(!sendStub.calledWithExactly(admin.phoneNumber, "Hello world!"));
  });

  it("should send a message to all when CUSTOM ALL is sent by admin", async () => {
    const message = {
      Body: "custom all Hello world!",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    expect(response).to.equal(responses.CUSTOM_MESSAGE.replace("%COUNT%", 2));
    expect(sendStub.calledWithExactly(normalUser.phoneNumber, "Hello world!"));
    expect(sendStub.calledWithExactly(admin.phoneNumber, "Hello world!"));
  });

  it("should add an admin as a subscriber when they send a code", async () => {
    const message = { Body: "test", From: admin.phoneNumber };
    const response = await logic.decipherMessage(message);

    const adminUser = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: admin.phoneNumber,
    });
    expect(adminUser).to.exist;
    expect(adminUser.campaignCode).to.equal("TEST");
    expect(response).to.equal(responses.VALID_CAMPAIGN_CODE);
  });

  it("should change a code when it receives CHANGE CODE from admin", async () => {
    const message = {
      Body: "change code test changedtest",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    // Make sure it updated code
    const codes = await stateModel.getCampaignCodes();
    expect(!codes.includes("TEST"));
    expect(codes.includes("CHANGEDTEST"));
    expect(response).to.equal(
      responses.CHANGE_CODE.replace("%CODE1%", "TEST").replace(
        "%CODE2%",
        "CHANGEDTEST"
      )
    );

    // Make sure it updated user with that code
    const user = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(user.campaignCode).to.equal("CHANGEDTEST");
  });

  it("should remove a code when it receives REMOVE CODE from admin", async () => {
    const message = {
      Body: "remove code changedtest",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    // Make sure it removed code
    const codes = await stateModel.getCampaignCodes();
    expect(!codes.includes("CHANGEDTEST"));
    expect(response).to.equal(
      responses.REMOVE_CODE.replace("%CODE%", "CHANGEDTEST")
    );

    // Make sure it updated user with that code
    const user = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(user.campaignCode).to.equal(null);
  });

  it("should add an admin when it receives ADD ADMIN", async () => {
    const message = {
      Body: "add admin (100) 003-1337",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    const newAdmin = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: "+11000031337",
    });
    expect(newAdmin).to.exist;
    expect(response).to.equal(
      responses.ADD_ADMIN.replace("%PHONE%", "(100)003-1337")
    );
  });

  it("should send error when ADD ADMIN can't parse phone", async () => {
    const message = {
      Body: "add admin (1X0) 0X3-1337",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    const newAdmin = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: "+11000013117",
    });
    expect(newAdmin).to.not.exist;
    expect(response).to.equal(
      responses.FAILED_PARSE_PHONE.replace("%PHONE%", "(1X0)0X3-1337")
    );
  });

  it("should remove an admin when it receives REMOVE ADMIN", async () => {
    const message = {
      Body: "remove admin (100)003-1337",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    const notAdmin = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: "+11000031337",
    });
    expect(notAdmin).to.exist;
    expect(notAdmin.isAdmin).to.be.false;
    expect(response).to.equal(
      responses.REMOVE_ADMIN.replace("%PHONE%", "(100)003-1337")
    );
  });

  it("should send error when REMOVE ADMIN can't parse phone", async () => {
    const message = {
      Body: "remove admin (1X0)0X3-1337",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    expect(response).to.equal(
      responses.FAILED_PARSE_PHONE.replace("%PHONE%", "(1X0)0X3-1337")
    );
  });

  it("should return RUNNING when STATUS is called", async () => {
    const message = { Body: "STATUS", From: admin.phoneNumber };
    const response = await logic.decipherMessage(message);

    expect(response).to.equal(responses.STATUS);
  });

  it("should return message when SHUTDOWN is called", async () => {
    const message = { Body: "SHUTDOWN", From: admin.phoneNumber };
    const response = await logic.decipherMessage(message);

    expect(response).to.equal(responses.SHUTDOWN);
  });

  it("should set admin user to inactive when they send STOP", async () => {
    const message = { Body: "STOP", From: admin.phoneNumber };
    const response = await logic.decipherMessage(message);

    const adminUser = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: admin.phoneNumber,
    });
    expect(adminUser).to.exist;
    expect(adminUser.isAdmin).to.be.true;
    expect(adminUser.isActive).to.be.false;
    expect(response).to.equal(undefined);
  });

  it("should set admin user to active when they send START", async () => {
    const message = { Body: "START", From: admin.phoneNumber };
    const response = await logic.decipherMessage(message);

    const adminUser = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: admin.phoneNumber,
    });
    expect(adminUser).to.exist;
    expect(adminUser.isAdmin).to.be.true;
    expect(adminUser.isActive).to.be.true;
    expect(response).to.equal(undefined);
  });

  it("should set normal user to inactive when they send STOP", async () => {
    const message = { Body: "STOP", From: normalUser.phoneNumber };
    const response = await logic.decipherMessage(message);

    const normal = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: normalUser.phoneNumber,
    });
    expect(normal).to.exist;
    expect(normal.isActive).to.be.false;
    expect(response).to.equal(undefined);
  });

  it("should set normal user to active when they send START", async () => {
    const message = { Body: "START", From: normalUser.phoneNumber };
    const response = await logic.decipherMessage(message);

    const normal = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: normalUser.phoneNumber,
    });
    expect(normal).to.exist;
    expect(normal.isActive).to.be.true;
    expect(response).to.equal(undefined);
  });

  it("should not send a message to inactive subscriber when SEND CODE is sent by admin", async () => {
    const subscribe = { Body: "test1", From: normalUser.phoneNumber };
    await logic.decipherMessage(subscribe);
    const stop = { Body: "stop", From: normalUser.phoneNumber };
    await logic.decipherMessage(stop);

    const adminMessage = { Body: "send test1", From: admin.phoneNumber };
    const adminResponse = await logic.decipherMessage(adminMessage);

    expect(adminResponse).to.equal(
      responses.SEND_CODE.replace("%CODE%", "TEST1").replace("%COUNT%", 0)
    );
    expect(sendStub.callCount).to.equal(0);

    const start = { Body: "start", From: normalUser.phoneNumber };
    await logic.decipherMessage(start);
  });

  it("should send error it throws unexpectedly", async () => {
    sinon.stub(logic, "addCampaignCode").throws({message:"Something went very wrong!"});
    const message = {
      Body: "add code anything",
      From: admin.phoneNumber,
    };
    const response = await logic.decipherMessage(message);

    expect(response).to.equal(responses.ERROR);
  });

  describe("admin sending unknown or incomplete commands", function() {
    const badCommands = [
      "sup doge",
      "NOTACODE",
      "add",
      "send",
      "add admin",
      "remove admin",
      "add code",
      "remove code",
      "change code alice",
      "set message",
      "custom",
      "custom test",
    ];
    badCommands.forEach(function (command) {
      it(`should return unknown message for '${command}' command`, async () => {
        const message = { Body: command, From: admin.phoneNumber };
        const response = await logic.decipherMessage(message);
        expect(response).to.equal(responses.UNKNOWN);
      });
    });
  });

  describe("non-admin calling admin functions", function() {
    const validAdminCommands = [
      "send test1",
      "add admin (555)555-5555",
      "remove admin (234)567-8910",
      "add code bacon",
      "remove code test2",
      "change code test1 love",
      "set message Hello world!",
      "custom all Hello world!",
      "status",
      "shutdown",
    ];
    validAdminCommands.forEach(function (command) {
      it(`should return unknown message for '${command}' command`, async () => {
          const message = { Body: command, From: normalUser.phoneNumber };
          const response = await logic.decipherMessage(message);
          expect(response).to.equal(responses.UNKNOWN);        
      });
    });
  });
});
