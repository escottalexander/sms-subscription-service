import * as dotenv from "dotenv";
const path = process.env.NODE_ENV === "test" ? "example.env" : ".env" ;
dotenv.config({ path: __dirname + path });
const { support_number_human_readable } = process.env;

const responses = {
  SET_MESSAGE: "Default message has been set",
  SET_NAMED_MESSAGE: "Set new message with name: %NAME%",
  VALID_CAMPAIGN_CODE:
    "You have been signed up to receive notifications. If at any point you want to stop receiving messages, text STOP",
  SEND_CODE: "Messages for '%CODE%' are now sending to %COUNT% subscribers",
  ADD_CODE: "Successfully added code '%CODE%'",
  REMOVE_CODE: "Successfully removed code '%CODE%'",
  CHANGE_CODE: "Successfully changed code '%CODE1%' to '%CODE2%'",
  CUSTOM_MESSAGE: "Your custom message is sending to %COUNT% subscribers",
  NAMED_MESSAGE: "Your message named %NAME% is sending to %COUNT% subscribers",
  ADD_ADMIN: "Added '%PHONE%' as an admin.",
  FAILED_PARSE_PHONE: "Failed to parse '%PHONE%' as a phone number.",
  REMOVE_ADMIN: "Removed '%PHONE%' as an admin.",
  STATUS: "RUNNING",
  SHUTDOWN: "Shutting down...",
  DEFAULT_MESSAGE:
    "Your milk has been delivered. Pick up at your earliest convenience during location hours.",
  NO_NAMED_MESSAGES: "No saved messages found",
  UNKNOWN_MSG_NAME: "We don't recognize that message name",
  UNKNOWN: "We don't recognize that code",
  ERROR: `Something went wrong with that request. Contact ${support_number_human_readable} for assistance`,
  NO_CAMPAIGNS_SENT: "No campaigns have been sent yet.",
};

export default responses;
