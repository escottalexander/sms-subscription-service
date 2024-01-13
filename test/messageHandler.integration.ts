import * as sinon from "sinon";
import * as chai from "chai";
const expect = chai.expect;

import connect from "../src/services/mongodb.js";
import MessageHandler from "../src/server/messageHandler.js";
import messenger from "../src/services/messenger.js";
import responses from "../src/server/responses.js";
import { WithId } from "mongodb";
import { Entity } from "../src/model/entities.js";
import { mockRequest, mockResponse } from 'mock-req-res';
import { twiml } from "twilio/lib";
const { MessagingResponse } = twiml;

const admin = { phoneNumber: "+12345678910", entityId: "00001", isAdmin: true, isActive: true };
const normalUser = {
  phoneNumber: "+15555555555",
  entityId: "00001",
  isAdmin: true,
  isActive: true,
};
let entity: WithId<Entity> | null;
let entityId: string | undefined;
let messageHandler: MessageHandler;

const buildRequest = (params: {}) => { return mockRequest({ body: params }); };
const buildResponse = () => { return mockResponse({type: ()=>{ return { send: sinon.stub() } } }); };
const twimlResponse = (message: string) => { 
  const twimlRes = new MessagingResponse();
  twimlRes.message(message);
  return twimlRes.toString();
};
async function init() {
  // Drop all records in db
  try {
    const db = await connect();
    messageHandler = new MessageHandler(db);
    await db.collection("phone-numbers").drop();
    await db.collection("reporting-daily").drop();
    await db.collection("state").drop();
    await db.collection("entities").drop();
  } catch (err) {
    console.log("No collections to drop, continuing...");
  }
  

  // Create an entity to test with
  await messageHandler.models.entity.createOrUpdate({
    entityId: "00001",
    accountPhoneNumber: "+17777777777",
    defaultMessage: "This is the default message",
    name: "Test Entity",
    contactName: "Test Contact",
    contactNumber: "+18888888888",
  });
  entity = await messageHandler.models.entity.findByPhoneNumber("+17777777777");
  entityId = entity?.entityId;
  // Create an admin to test with
  await messageHandler.models.phoneNumber.createOrUpdate(admin);

  // Stub out shutdown function so it doesn't stop the tests XD
  sinon.stub(messageHandler, "shutDownProcess").resolves();
}

let sendStub: sinon.SinonStub;
describe("Core Logic", () => {
  before(init);
  beforeEach(() => {
    // Stub out text sending functions
    sendStub = sinon.stub(messenger, "send").resolves(true);
  });
  afterEach(() => {
    sendStub.restore();
  });

  it("should set a message when called by an admin with SET MESSAGE", async () => {
    const message = {
      Body: "SET MESSAGE Hello world!",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const setting = await messageHandler.models.entity.getDefaultMessage(entityId as string);
    expect(setting).to.equal("Hello world!");
    expect(response.send.calledOnceWith(twimlResponse(responses.SET_MESSAGE)));
  });

  it("should get an entity's default message when called by an admin with GET MESSAGE", async () => {
    const message = {
      Body: "GET MESSAGE",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const defaultMessage = await messageHandler.models.entity.getDefaultMessage(entityId as string);
    expect(response.send.calledOnceWith(twimlResponse(defaultMessage)));
  });

  it("should add a code when it receives ADD CODE from admin", async () => {
    const message = {
      Body: "add code test",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const codes = await messageHandler.models.entity.getCampaignCodes(entityId as string);
    expect(codes.includes("TEST"));
    expect(response.send.calledOnceWith(twimlResponse(responses.ADD_CODE.replace("%CODE%", "TEST"))));
  });

  it("should add multiple codes when it receives different codes with ADD CODE from admin", async () => {
    const message1 = {
      Body: "add code test1",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response1 = buildResponse();
    await messageHandler.handle(buildRequest(message1), response1);

    const message2 = {
      Body: "add code test2",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response2 = buildResponse();
    await messageHandler.handle(buildRequest(message2), response2);

    const codes = await messageHandler.models.entity.getCampaignCodes(entityId as string);
    expect(codes.includes("TEST1"));
    expect(codes.includes("TEST2"));
    expect(response1.send.calledOnceWith(twimlResponse(responses.ADD_CODE.replace("%CODE%", "TEST1"))));
    expect(response2.send.calledOnceWith(twimlResponse(responses.ADD_CODE.replace("%CODE%", "TEST2"))));
  });

  it("should add a subscriber when non-admin sends a code", async () => {
    const message = {
      Body: "test",
      From: normalUser.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const user = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(response.send.calledOnceWith(twimlResponse(responses.VALID_CAMPAIGN_CODE)));
  });

  it("should add a subscriber when non-admin sends a code with extra whitespace", async () => {
    const message = {
      Body: "test  ",
      From: normalUser.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const user = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(response.send.calledOnceWith(twimlResponse(responses.VALID_CAMPAIGN_CODE)));
  });

  it("should send a message to subscriber when SEND CODE is sent by admin", async () => {
    const message = {
      Body: "send test",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    expect(response.send.calledOnceWith(twimlResponse(responses.SEND_CODE.replace("%CODE%", "TEST").replace("%COUNT%", "1"))));

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
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse(); 
    await messageHandler.handle(buildRequest(message), response);

    expect(response.send.calledOnceWith(twimlResponse(responses.CUSTOM_MESSAGE.replace("%COUNT%", "1"))));

    expect(sendStub.calledWithExactly(normalUser.phoneNumber, "Hello world!"));
    expect(!sendStub.calledWithExactly(admin.phoneNumber, "Hello world!"));
  });

  it("should send a message to all when CUSTOM ALL is sent by admin", async () => {
    const message = {
      Body: "custom all Hello world!",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    expect(response.send.calledOnceWith(twimlResponse(responses.CUSTOM_MESSAGE.replace("%COUNT%", "2"))));

    expect(sendStub.calledWithExactly(normalUser.phoneNumber, "Hello world!"));
    expect(sendStub.calledWithExactly(admin.phoneNumber, "Hello world!"));
  });

  it("should set an entity's last code when an admin sends a campaign", async () => {
    const message = {
      Body: "SEND TEST1",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const lastCode = await messageHandler.models.entity.getLastCode(entityId as string);
    expect(lastCode).to.equal("TEST1");

    const message2 = {
      Body: "SEND TEST2",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response2 = buildResponse();
    await messageHandler.handle(buildRequest(message2), response2);

    const lastCode2 = await messageHandler.models.entity.getLastCode(entityId as string);
    expect(lastCode2).to.equal("TEST2");
  });

  it("should get an entity's last code when called by an admin with GET LAST CODE", async () => {
    const message = {
      Body: "GET LAST CODE",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const lastCode = await messageHandler.models.entity.getLastCode(entityId as string);
    expect(response.send.calledOnceWith(twimlResponse(lastCode)));
  });

  it("should add an admin as a subscriber when they send a code", async () => {
    const message = {
      Body: "test",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const adminUser = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: admin.phoneNumber,
    });
    expect(adminUser).to.exist;
    expect(adminUser?.campaignCode).to.equal("TEST");
    expect(response.send.calledOnceWith(twimlResponse(responses.VALID_CAMPAIGN_CODE)));
  });

  it("should change a code when it receives CHANGE CODE from admin", async () => {
    const message = {
      Body: "change code test changedtest",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    // Make sure it updated code
    const codes = await messageHandler.models.entity.getCampaignCodes(entityId as string);
    expect(!codes.includes("TEST"));
    expect(codes.includes("CHANGEDTEST"));
    expect(response.send.calledOnceWith(responses.CHANGE_CODE.replace("%CODE1%", "TEST").replace(
      "%CODE2%",
      "CHANGEDTEST"
    )));

    // Make sure it updated user with that code
    const user = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(user?.campaignCode).to.equal("CHANGEDTEST");
  });

  it("should remove a code when it receives REMOVE CODE from admin", async () => {
    const message = {
      Body: "remove code changedtest",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    // Make sure it removed code
    const codes = await messageHandler.models.entity.getCampaignCodes(entityId as string);
    expect(!codes.includes("CHANGEDTEST"));
    expect(response.send.calledOnceWith(twimlResponse(responses.REMOVE_CODE.replace("%CODE%", "CHANGEDTEST"))));

    // Make sure it updated user with that code
    const user = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: normalUser.phoneNumber,
    });
    expect(user).to.exist;
    expect(user?.campaignCode).to.equal(null);
  });

  it("should add an admin when it receives ADD ADMIN", async () => {
    const message = {
      Body: "add admin (100) 003-1337",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const newAdmin = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: "+11000031337",
    });
    expect(newAdmin).to.exist;
    expect(response.send.calledOnceWith(twimlResponse(responses.ADD_ADMIN.replace("%PHONE%", "(100)003-1337"))));
  });

  it("should send error when ADD ADMIN can't parse phone", async () => {
    const message = {
      Body: "add admin (1X0) 0X3-1337",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const newAdmin = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: "+11000013117",
    });
    expect(newAdmin).to.not.exist;
    expect(response.send.calledOnceWith(twimlResponse(responses.FAILED_PARSE_PHONE.replace("%PHONE%", "(1X0)0X3-1337"))));

  });

  it("should remove an admin when it receives REMOVE ADMIN", async () => {
    const message = {
      Body: "remove admin (100)003-1337",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const notAdmin = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: "+11000031337",
    });
    expect(notAdmin).to.exist;
    expect(notAdmin?.isAdmin).to.be.false;
    expect(response.send.calledOnceWith(twimlResponse(responses.REMOVE_ADMIN.replace("%PHONE%", "(100)003-1337"))));

  });

  it("should send error when REMOVE ADMIN can't parse phone", async () => {
    const message = {
      Body: "remove admin (1X0)0X3-1337",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    expect(response.send.calledOnceWith(twimlResponse(responses.FAILED_PARSE_PHONE.replace("%PHONE%", "(1X0)0X3-1337"))));
  });

  it("should return RUNNING when STATUS is called", async () => {
    const message = {
      Body: "STATUS",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    expect(response.send.calledOnceWith(twimlResponse(responses.STATUS)));
  });

  it("should return message when SHUTDOWN is called", async () => {
    const message = {
      Body: "SHUTDOWN",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    expect(response.send.calledOnceWith(twimlResponse(responses.SHUTDOWN)));
  });

  it("should set admin user to inactive when they send STOP", async () => {
    const message = {
      Body: "STOP",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const adminUser = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: admin.phoneNumber,
    });
    expect(adminUser).to.exist;
    expect(adminUser?.isAdmin).to.be.true;
    expect(adminUser?.isActive).to.be.false;
    const re = response.send.getCalls();
    expect(response.send.notCalled).to.be.true;
  });

  it("should set admin user to active when they send START", async () => {
    const message = {
      Body: "START",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const adminUser = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: admin.phoneNumber,
    });
    expect(adminUser).to.exist;
    expect(adminUser?.isAdmin).to.be.true;
    expect(adminUser?.isActive).to.be.true;
    expect(response.send.notCalled).to.be.true;
  });

  it("should set normal user to inactive when they send STOP", async () => {
    const message = {
      Body: "STOP",
      From: normalUser.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const normal = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: normalUser.phoneNumber,
    });
    expect(normal).to.exist;
    expect(normal?.isActive).to.be.false;
    expect(response.send.notCalled).to.be.true;
  });

  it("should set normal user to active when they send START", async () => {
    const message = {
      Body: "START",
      From: normalUser.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    const normal = await messageHandler.models.phoneNumber.findByPhoneNumber({
      entityId: entityId as string, phoneNumber: normalUser.phoneNumber,
    });
    expect(normal).to.exist;
    expect(normal?.isActive).to.be.true;
    expect(response.send.notCalled).to.be.true;
  });

  it("should not send a message to inactive subscriber when SEND CODE is sent by admin", async () => {
    const subscribe = {
      Body: "test1",
      From: normalUser.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    await messageHandler.handle(buildRequest(subscribe), buildResponse());
    const stop = {
      Body: "stop",
      From: normalUser.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    await messageHandler.handle(buildRequest(stop), buildResponse());

    const adminMessage = {
      Body: "send test1",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const adminResponse = buildResponse();
    await messageHandler.handle(buildRequest(adminMessage), adminResponse);

    expect(adminResponse.send.calledOnceWith(responses.SEND_CODE.replace("%CODE%", "TEST1").replace("%COUNT%", "0")));
    expect(sendStub.callCount).to.equal(0);

    const start = {
      Body: "start",
      From: normalUser.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    await messageHandler.handle(buildRequest(start), buildResponse());
  });

  it("should send error it throws unexpectedly", async () => {
    sinon
      .stub(messageHandler, "addCampaignCode")
      .throws({ message: "Something went very wrong!" });
    const message = {
      Body: "add code anything",
      From: admin.phoneNumber,
      To: entity?.accountPhoneNumber,
    };
    const response = buildResponse();
    await messageHandler.handle(buildRequest(message), response);

    expect(response.send.calledOnceWith(twimlResponse(responses.ERROR)));
  });

  describe("admin sending unknown or incomplete commands", function () {
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
        const message = {
          Body: command,
          From: admin.phoneNumber,
          To: entity?.accountPhoneNumber,
        };
        const response = buildResponse();
        await messageHandler.handle(buildRequest(message), response);
        expect(response.send.calledOnceWith(twimlResponse(responses.UNKNOWN)));
      });
    });
  });

  describe("non-admin calling admin functions", function () {
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
        const message = {
          Body: command,
          From: normalUser.phoneNumber,
          To: entity?.accountPhoneNumber,
        };
        const response = buildResponse();
        await messageHandler.handle(buildRequest(message), response);
        expect(response.send.calledOnceWith(twimlResponse(responses.UNKNOWN)));
      });
    });
  });
});
