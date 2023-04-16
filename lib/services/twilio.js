import config from '../../config.js';
import Twilio from 'twilio';
const accountSid = config.twilio.accountSid;
const authToken = config.twilio.authToken;
const client = Twilio(accountSid, authToken);
export default client;