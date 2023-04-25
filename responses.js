import config from "./config.js";
const responses = {
  SET_MESSAGE: "Default message has been set",
  VALID_CAMPAIGN_CODE:
    "You have been signed up to receive notifications. If at any point you want to stop receiving messages, text STOP",
  SEND_CODE: "Messages are now sending for '%CODE%'",
  ADD_CODE: "Successfully added code '%CODE%'",
  REMOVE_CODE: "Successfully removed code '%CODE%'",
  CHANGE_CODE: "Successfully changed code '%CODE1%' to '%CODE2%'",
  CUSTOM_MESSAGE: "Custom message is now sending",
  ADD_ADMIN: "Added '%PHONE%' as an admin.",
  FAILED_PARSE_PHONE: "Failed to parse '%PHONE%' as a phone number.",
  REMOVE_ADMIN: "Removed '%PHONE%' as an admin.",
  STATUS: "RUNNING",
  SHUTDOWN: "Shutting down...",
  DEFAULT_MESSAGE:
    "Your milk has been delivered. Pick up at your earliest convenience during location hours.",
  UNKNOWN: "We don't recognize that code",
  ERROR: `Something went wrong with that request. Contact ${config.supportNumberHumanReadable} for assistance`,
};

export default responses;
