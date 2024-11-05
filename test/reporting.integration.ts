import * as sinon from "sinon";
import * as chai from "chai";
const expect = chai.expect;

import connect from "../src/services/mongodb.js";
import MessageHandler from "../src/server/messageHandler.js";
import messenger from "../src/services/messenger.js";
import { Entity } from "../src/model/entities.js";
import { Request } from "express";
import { Document } from "mongodb";
import { mockRequest, mockResponse } from "mock-req-res";

const buildRequest = (params: {}) => { return mockRequest({ body: params }); };
const buildResponse = () => { return mockResponse({type: ()=>{ return { send: sinon.stub() } } }); };

let entity: Entity | null;
let entityId: string | undefined;
let messageHandler: MessageHandler;
let getMessage: (code: string, user?: {
  phoneNumber: string;
  entityId: string;
  isAdmin: boolean;
  isActive: boolean;
}) => Request;
let getAdminMessage: (code: string) => Request;

const admin = { phoneNumber: "+12345678910", entityId: "00001", isAdmin: true, isActive: true };
const normalUser = {
  phoneNumber: "+15555555555",
  entityId: "00001",
  isAdmin: false,
  isActive: true,
};
const normalUser2 = {
  phoneNumber: "+16555555556",
  entityId: "00001",
  isAdmin: false,
  isActive: true,
};

async function init() {
  sendStub = sinon.stub(messenger, "send").resolves({ success: true, error: null });
  // Drop all records in db
  try {
    const db = await connect();
    messageHandler = new MessageHandler(db);
    await db.collection("phone-numbers").drop();
    await db.collection("reporting-daily").drop();
    await db.collection("entities").drop();
  } catch (err) {
    console.log("No collections were dropped because they don't exist");
  }


  // Create an admin to test with
  await messageHandler.models.phoneNumber.createOrUpdate(admin);

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

  getMessage = (code: string, user?: {
    phoneNumber: string;
    entityId: string;
    isAdmin: boolean;
    isActive: boolean;
  }) => {
    return buildRequest({ Body: code, From: user ? user.phoneNumber : normalUser.phoneNumber, To: entity?.accountPhoneNumber });
  };
  getAdminMessage = (code: string) => {
    return buildRequest({ Body: code, From: admin.phoneNumber, To: entity?.accountPhoneNumber });
  };
}

let sendStub: sinon.SinonStub;
describe("Reporting Tests", function () {
  beforeEach(init);
  afterEach(async function () {
    sendStub.restore();
  });

  it("should show each action in reports", async () => {
    // Setup
    await messageHandler.handle(getAdminMessage("add code report"), buildResponse());
    await messageHandler.handle(getAdminMessage("add code report2"), buildResponse());
    // Start Subscribe
    await messageHandler.handle(getMessage("report"), buildResponse());
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });
    // Change Subscribe
    await messageHandler.handle(getMessage("report2"), buildResponse());
    // End Subscribe
    await messageHandler.handle(getMessage("stop"), buildResponse());

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 24);

    const reportArr = await messageHandler.models.reporting.findByDateRange({
      entityId: entityId as string,
      startDate,
      endDate,
    });
    const report: any = reportArr[0];
    expect(report).to.exist;
    expect(report.campaignCodes).to.exist;
    expect(Object.keys(report.campaignCodes).length).to.equal(2);
    expect(JSON.stringify(report.campaignCodes["REPORT"])).to.equal(
      JSON.stringify({
        startSubscriptionCount: 1,
        sentCount: 1,
        failedCount: 1,
      })
    );
    expect(JSON.stringify(report.campaignCodes["REPORT2"])).to.equal(
      JSON.stringify({
        changeSubscriptionCount: 1,
        endSubscriptionCount: 1,
      })
    );
    const expected: any = {
      startSubscriptionCount: 1,
      sentCount: 1,
      failedCount: 1,
      changeSubscriptionCount: 1,
      endSubscriptionCount: 1,
      responseCount: 6,
      segments: 11,
    };
    for (let prop of Object.keys(expected)) {
      expect(report[prop]).to.equal(expected[prop]);
    }
  });

  it("should increment when they occur multiple times", async () => {
    // Setup
    await messageHandler.handle(getAdminMessage("add code report"), buildResponse());
    await messageHandler.handle(getAdminMessage("add code report2"), buildResponse());
    // Start Subscribe
    await messageHandler.handle(getMessage("report", normalUser), buildResponse());
    await messageHandler.handle(getMessage("report", normalUser2), buildResponse());
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });
    // Change Subscribe
    await messageHandler.handle(getMessage("report2", normalUser), buildResponse());
    await messageHandler.handle(getMessage("report2", normalUser2), buildResponse());
    // End Subscribe
    await messageHandler.handle(getMessage("stop", normalUser), buildResponse());
    await messageHandler.handle(getMessage("stop", normalUser2), buildResponse());

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 24);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const reportArr = await messageHandler.models.reporting.findByDateRange({
      entityId: entityId as string,
      startDate,
      endDate,
    });
    const report: any = reportArr[0];
    expect(report).to.exist;
    expect(report.campaignCodes).to.exist;
    expect(Object.keys(report.campaignCodes).length).to.equal(2);
    expect(JSON.stringify(report.campaignCodes["REPORT"])).to.equal(
      JSON.stringify({
        startSubscriptionCount: 2,
        sentCount: 2,
        failedCount: 2,
      })
    );
    expect(JSON.stringify(report.campaignCodes["REPORT2"])).to.equal(
      JSON.stringify({
        changeSubscriptionCount: 2,
        endSubscriptionCount: 2,
      })
    );
    const expected: any = {
      startSubscriptionCount: 2,
      sentCount: 2,
      failedCount: 2,
      changeSubscriptionCount: 2,
      endSubscriptionCount: 2,
      responseCount: 8,
      segments: 18,
    };
    for (let prop of Object.keys(expected)) {
      expect(report[prop]).to.equal(expected[prop]);
    }
  });

  it("should build a report for each date an action occurred on", async () => {
    const now = new Date();
    let clock = sinon.useFakeTimers(now.getTime());

    const aDay = 24 * 60 * 60 * 1000;
    // Setup
    await messageHandler.handle(getAdminMessage("add code report"), buildResponse());
    await messageHandler.handle(getAdminMessage("add code report2"), buildResponse());

    // Day 1
    // Start Subscribe
    await messageHandler.handle(getMessage("report"), buildResponse());
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });

    // Day 2
    clock.tick(aDay);
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });

    // Day 3
    clock.tick(aDay);
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });

    clock.restore();

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 48);

    await new Promise((resolve) => setImmediate(resolve));
    const reportArr = await messageHandler.models.reporting.findByDateRange({
      entityId: entityId as string,
      startDate,
      endDate,
    });
    expect(reportArr).to.exist;
    expect(reportArr.length).to.equal(3);
    const report = reportArr[0];
    expect(report).to.exist;
    expect(report.campaignCodes).to.exist;
    expect(JSON.stringify(reportArr[2].campaignCodes["REPORT"])).to.equal(JSON.stringify(reportArr[1].campaignCodes["REPORT"]));
  });

  it("should build a aggregated report for each date an action occurred on", async () => {
    const now = new Date();
    let clock = sinon.useFakeTimers(now.getTime());

    const aDay = 24 * 60 * 60 * 1000;
    // Setup
    await messageHandler.handle(getAdminMessage("add code report"), buildResponse());
    await messageHandler.handle(getAdminMessage("add code report2"), buildResponse());

    // Day 1
    // Start Subscribe
    await messageHandler.handle(getMessage("report"), buildResponse());
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });

    // Day 2
    clock.tick(aDay);
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });

    // Day 3
    clock.tick(aDay);
    // Sent message
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    // Failed message
    sendStub.returns({ success: false });
    await messageHandler.handle(getAdminMessage("send report"), buildResponse());
    sendStub.returns({ success: true });
    // Change Subscribe
    await messageHandler.handle(getMessage("report2"), buildResponse());
    // End Subscribe
    await messageHandler.handle(getMessage("stop"), buildResponse());

    clock.restore();

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 48);

    await new Promise((resolve) => setTimeout(resolve, 100));
    const reportArr: Document[] = await messageHandler.models.reporting.aggregateByDateRange({
      entityId: entityId as string,
      startDate,
      endDate,
    }).toArray();
    expect(reportArr).to.exist;
    expect(reportArr.length).to.equal(1);
    const report = reportArr[0];
    expect(report).to.exist;
    expect(report.totalFailedCount).to.equal(3);
    expect(report.totalSentCount).to.equal(3);
    expect(report.totalStartSubscriptionCount).to.equal(1);
    expect(report.totalEndSubscriptionCount).to.equal(1);
    expect(report.totalChangeSubscriptionCount).to.equal(1);
    expect(report.totalResponseCount).to.equal(10);
  });
});
