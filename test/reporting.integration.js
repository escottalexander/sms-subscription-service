import sinon from "sinon";
import chai from "chai";
const expect = chai.expect;

import db from "../lib/services/mongodb.js";
import logic from "../lib/logic.js";
import phoneNumberModel from "../model/phoneNumbers.js";
import entityModel from "../model/entities.js";
import messenger from "../lib/services/messenger.js";
import reportingModel from "../model/reporting.js";

let entity;
let entityId;

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
  sendStub = sinon.stub(messenger, "send").returns(true);
  // Drop all records in db
  try {
    await db.collection("phone-numbers").drop();
    await db.collection("reporting-daily").drop();
    await db.collection("state").drop();
    await db.collection("entities").drop();
  } catch (err) {
    console.log("No collections were dropped because they don't exist");
  }
  

  // Create an admin to test with
  await phoneNumberModel.createOrUpdate(admin);

  await entityModel.createOrUpdate({
    entityId: "00001",
    accountPhoneNumber: "+17777777777",
    defaultMessage: "This is the default message",
    name: "Test Entity",
    contactName: "Test Contact",
    contactNumber: "+18888888888",
  });
  entity = await entityModel.findByPhoneNumber("+17777777777");
  entityId = entity.entityId;
}

let sendStub;
describe("Reporting Tests", function() {
  beforeEach(init);
  afterEach(async function() {
    sendStub.restore();
  });

  it("should show each action in reports", async () => {
    const getMessage = (code) => {
      return { Body: code, From: normalUser.phoneNumber, To: entity.accountPhoneNumber };
    };
    const getAdminMessage = (code) => {
      return { Body: code, From: admin.phoneNumber, To: entity.accountPhoneNumber };
    };
    // Setup
    await logic.decipherMessage(getAdminMessage("add code report"));
    await logic.decipherMessage(getAdminMessage("add code report2"));
    // Start Subscribe
    await logic.decipherMessage(getMessage("report"));
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);
    // Change Subscribe
    await logic.decipherMessage(getMessage("report2"));
    // End Subscribe
    await logic.decipherMessage(getMessage("stop"));

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 24);

    const reportArr = await reportingModel.findByDateRange({
      entityId,
      startDate,
      endDate,
    });
    const report = reportArr[0];
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
    const expected = {
      startSubscriptionCount: 1,
      sentCount: 1,
      failedCount: 1,
      changeSubscriptionCount: 1,
      endSubscriptionCount: 1,
    };
    for (let prop of Object.keys(expected)) {
      expect(report[prop]).to.equal(expected[prop]);
    }
  });

  it("should increment when they occur multiple times", async () => {
    
    const getMessage = (code, user) => {
      return { Body: code, From: user.phoneNumber, To: entity.accountPhoneNumber };
    };
    const getAdminMessage = (code) => {
      return { Body: code, From: admin.phoneNumber, To: entity.accountPhoneNumber };
    };
    // Setup
    await logic.decipherMessage(getAdminMessage("add code report"));
    await logic.decipherMessage(getAdminMessage("add code report2"));
    // Start Subscribe
    await logic.decipherMessage(getMessage("report", normalUser));
    await logic.decipherMessage(getMessage("report", normalUser2));
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);
    // Change Subscribe
    await logic.decipherMessage(getMessage("report2", normalUser));
    await logic.decipherMessage(getMessage("report2", normalUser2));
    // End Subscribe
    await logic.decipherMessage(getMessage("stop", normalUser));
    await logic.decipherMessage(getMessage("stop", normalUser2));

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 24);

    const reportArr = await reportingModel.findByDateRange({
      entityId,
      startDate,
      endDate,
    });
    const report = reportArr[0];
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
    const expected = {
      startSubscriptionCount: 2,
      sentCount: 2,
      failedCount: 2,
      changeSubscriptionCount: 2,
      endSubscriptionCount: 2,
    };
    for (let prop of Object.keys(expected)) {
      expect(report[prop]).to.equal(expected[prop]);
    }
  });

  it("should build a report for each date an action occurred on", async () => {
    const now = new Date();
    let clock = sinon.useFakeTimers(now.getTime());

    const aDay = 24 * 60 * 60 * 1000;
    const getMessage = (code) => {
      return { Body: code, From: normalUser.phoneNumber, To: entity.accountPhoneNumber };
    };
    const getAdminMessage = (code) => {
      return { Body: code, From: admin.phoneNumber, To: entity.accountPhoneNumber };
    };
    // Setup
    await logic.decipherMessage(getAdminMessage("add code report"));
    await logic.decipherMessage(getAdminMessage("add code report2"));

    // Day 1
    // Start Subscribe
    await logic.decipherMessage(getMessage("report"));
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);

    // Day 2
    clock.tick(aDay);
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);

    // Day 3
    clock.tick(aDay);
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);

    clock.restore();

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 48);

    const reportArr = await reportingModel.findByDateRange({
      entityId,
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
    const getMessage = (code) => {
      return { Body: code, From: normalUser.phoneNumber, To: entity.accountPhoneNumber };
    };
    const getAdminMessage = (code) => {
      return { Body: code, From: admin.phoneNumber, To: entity.accountPhoneNumber };
    };
    // Setup
    await logic.decipherMessage(getAdminMessage("add code report"));
    await logic.decipherMessage(getAdminMessage("add code report2"));

    // Day 1
    // Start Subscribe
    await logic.decipherMessage(getMessage("report"));
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);

    // Day 2
    clock.tick(aDay);
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);

    // Day 3
    clock.tick(aDay);
    // Sent message
    await logic.decipherMessage(getAdminMessage("send report"));
    // Failed message
    sendStub.returns(false);
    await logic.decipherMessage(getAdminMessage("send report"));
    sendStub.returns(true);

    clock.restore();

    const startDate = new Date();
    startDate.setHours(startDate.getHours());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 48);

    const reportArr = await reportingModel.aggregateByDateRange({
      entityId,
      startDate,
      endDate,
    });
    expect(reportArr).to.exist;
    expect(reportArr.length).to.equal(1);
    const report = reportArr[0];
    expect(report).to.exist;
    expect(report.totalFailedCount).to.equal(3);
    expect(report.totalSentCount).to.equal(3);
    expect(report.totalStartSubscriptionCount).to.equal(1);
    expect(report.totalEndSubscriptionCount).to.equal(0);
    expect(report.totalChangeSubscriptionCount).to.equal(0);
    expect(report.totalResponseCount).to.equal(0);
  });
});
