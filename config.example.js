const config = {
  supportNumber: "",
  supportNumberHumanReadable: "",
  twilio: {
    accountSid: "",
    authToken: "",
    accountPhoneNumber: "",
  },
  mongo: {
    uri: "mongodb://localhost:27017/",
    databaseName: "sms-subscription-service",
  },
};

export default config;
