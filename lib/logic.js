import stateModel from "../model/state.js";
import phoneNumberModel from "../model/phoneNumbers.js";
import messenger from "./services/messenger.js";
import config from "../config.js";
import logger from "./services/logger.js";
import parsePhoneNumberFromString from "libphonenumber-js";

const logic = {
  decipherMessage: async (reqBody) => {
    const campaignCodes = await stateModel.getCampaignCodes();
    let { Body: message, From: phone } = reqBody;
    message = message.toUpperCase();
    const phoneNumber = await phoneNumberModel.findByPhoneNumber({
      phoneNumber: phone,
    });

    if (phoneNumber && phoneNumber.isAdmin) {
      if (campaignCodes.includes(message)) {
        // Valid campaign code from admin, send out messages
        await logic.handleDeliveryMessage(message);
      } else if (message.split(" ").length > 1) {
        const strCmd = message.split(" ");
        if (strCmd[0] === "ADD") {
          // Add admin
          if (strCmd[1] === "ADMIN") {
            // send the rest of strCmd to addAdmin
            const newAdmin = strCmd.join("").replace("ADDADMIN", "");
            await logic.addAdmin(phone, newAdmin);
          } else if (strCmd[1] === "CODE") {
            // add campaign code
            await logic.addCampaignCode(phone, strCmd[2]);
          }
        } else if (strCmd[0] === "REMOVE") {
          // remove admin
          if (strCmd[1] === "ADMIN") {
            // send the rest of strCmd to removeAdmin
            const admin = strCmd.join("").replace("REMOVEADMIN", "");
            await logic.removeAdmin(phone, admin);
          } else if (strCmd[1] === "CODE") {
            // remove campaign code
            await logic.removeCampaignCode(phone, strCmd[2]);
          }
        } else if (strCmd[0] === "CHANGE" && strCmd[1] === "CODE") {
          // change code and all subscribers
          await logic.changeCampaignCode(phone, strCmd[2], strCmd[3]);
        } else if (strCmd[0] === "CUSTOM") {
          // send custom message - sending original body to preserve original case.
          await logic.sendCustomMessage(strCmd[1], reqBody.Body);
        }
      } else if (message === "STATUS") {
        // Status check
        messenger.send(phone, "RUNNING");
      } else if (message === "SHUTDOWN") {
        // Shut down process
        await logic.shutDownProcess();
      } else {
        // We don't recognize that code
        messenger.send(
          phone,
          "I don't recognize that instruction... is there a typo?"
        );
      }
    } else if (campaignCodes.includes(message)) {
      // Check if the phone number is already in the database
      if (phoneNumber) {
        if (phoneNumber.campaignCode === message) {
          // Phone number is already signed up for this location code
          messenger.send(
            phone,
            "You are already signed up to receive messages for this location. If you would like to stop receiving messages, send STOP."
          );
        } else {
          // Phone number is signed up for a different location code
          messenger.send(
            phone,
            `You are currently signed up for ${phoneNumber.campaignCode}. Text STOP first then you can send ${message} to sign up for delivery messages.`
          );
        }
      } else {
        // Phone number is not in the database
        await phoneNumberModel.createOrUpdate({
          phoneNumber: phone,
          campaignCode: message,
        });
        messenger.send(
          phone,
          `You have been signed up to receive notifications. If at any point you want to stop receiving messages, text STOP`
        );
      }
    } else if (message === "STOP") {
      if (phoneNumber) {
        await phoneNumberModel.remove({ phoneNumber: phone });
        messenger.send(
          phone,
          "Unsubscribe successful. You will no longer receive notifications."
        );
      } else {
        messenger.send(phone, "You are not signed up currently.");
      }
    } else {
      messenger.send(
        phone,
        `We don't recognize that code. If you believe it to be correct please send a message to ${config.supportNumberHumanReadable} explaining the problem.`
      );
    }
  },
  handleDeliveryMessage: async (campaignCode) => {
    const subscribers = await phoneNumberModel.findAllByCode({ campaignCode });
    let message = await stateModel.getSetting("deliveryMessage");
    if (!message) {
      message =
        "Your milk has been delivered. Pick up at your earliest convenience during location hours.";
    }
    for (let sub of subscribers) {
      messenger.send(sub.phoneNumber, message);
    }
  },
  sendCustomMessage: async (campaignCode, unparsedMessage) => {
    const subscribers = await phoneNumberModel.findAllByCode({ campaignCode });
    // Remove first two commands from message
    const message = unparsedMessage.split(" ").splice(2).join(" ");
    for (let sub of subscribers) {
      messenger.send(sub.phoneNumber, message);
    }
  },
  addAdmin: async (fromPhone, newAdmin) => {
    let phone;
    try {
      phone = parsePhoneNumberFromString(newAdmin, "US").number;
      if (!phone) {
        throw new Error("Failed to parse phone number.");
      }
    } catch (e) {
      logger.error(
        `Could not parse '${newAdmin}' as a phone number: ${JSON.stringify(e)}`
      );
      messenger.send(
        fromPhone,
        `Failed to parse '${newAdmin}' as a phone number.`
      );
      return;
    }
    await phoneNumberModel.createOrUpdate({
      phoneNumber: phone,
      isAdmin: true,
    });
    messenger.send(fromPhone, `Added '${newAdmin}' as an admin.`);
  },
  addCampaignCode: async (fromPhone, code) => {
    await stateModel.addCampaignCode(code);
    messenger.send(fromPhone, `Successfully added code ${code}`);
  },
  removeAdmin: async (fromPhone, admin) => {
    let phone;
    try {
      phone = parsePhoneNumberFromString(admin, "US").number;
      if (!phone) {
        throw new Error("Failed to parse phone number.");
      }
    } catch (e) {
      logger.error(
        `Could not parse '${admin}' as a phone number: ${JSON.stringify(e)}`
      );
      messenger.send(
        fromPhone,
        `Failed to parse '${admin}' as a phone number.`
      );
    }
    await phoneNumberModel.createOrUpdate({
      phoneNumber: phone,
      isAdmin: false,
    });
    messenger.send(fromPhone, `Removed '${admin}' as an admin.`);
  },
  removeCampaignCode: async (fromPhone, code) => {
    await stateModel.removeCampaignCode(code);
    // Update all subscribers with old code to no code
    await phoneNumberModel.updateCampaignCode(code, null);
    messenger.send(fromPhone, `Successfully removed code ${code}`);
  },
  changeCampaignCode: async (fromPhone, oldCode, newCode) => {
    // Update code
    await stateModel.updateCampaignCode(oldCode, newCode);
    // Update all subscribers with old code
    await phoneNumberModel.updateCampaignCode(oldCode, newCode);
    messenger.send(
      fromPhone,
      `Successfully changed code ${oldCode} to ${newCode}`
    );
  },
  shutDownProcess: async () => {
    process.exit();
  },
};

export default logic;
