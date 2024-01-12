# SMS Campaign Subscription Service
This service uses Twilio to enable you to parse messages from subscribers and categorize them into buckets by the code they entered. Admins can then send a message directed towards users based on which code they entered.

With this service you can:
- Add an admin that can send messages, add campaign codes, migrate users to a new campaign code
- Serve up an endpoint that you can point Twilio to as a webhook to receive messages
- Enable users to start receiving messages for a campaign, and later, stop receiving them by sending STOP 

Here is a list of valid commands for normal users:
- `%CODE%` - Send in any valid campaign code to sign up for messages related to that campaign.
- `STOP` - Stop receiving messages.
- `START` - Start receiving messages after sending `STOP`.

For admin users, they can use these commands in addition:
- `SEND %CODE%` - To send a predefined message to all subscribers with that campaign code.
- `ADD ADMIN %PHONE NUMBER%` - To add an admin.
- `REMOVE ADMIN %PHONE NUMBER%` - To remove an admin.
- `ADD CODE %CODE%` - To add a campaign code to the list of valid codes.
- `CHANGE CODE %CODE%` - To change a campaign code and all subscribers to a new or existing code. Effectively removes the old code.
- `REMOVE CODE %CODE%` - To remove a campaign code and unsubscribe all subscribers with that code. Consider using `CHANGE CODE` as it migrates users without them having to sign up for a new code.
- `SET MESSAGE %MESSAGE%` - Set the default message that is sent to subscribers.
- `CUSTOM %CODE OR ALL% %MESSAGE%` - To send a custom message to either a specific campaign or use ALL to send to entire list.
- `STATUS` - To check the status of the process. Should return RUNNING if all is well.
- `SHUTDOWN` - To shut down the process. 

# Set up
You will need:
- MongoDB
- Twilio account
- Somewhere to host the project and expose the endpoints Twilio uses

Steps:
Copy the `exampe.env` file and rename to `.env`. Adjust the settings in that file to match your Twilio account information, your Mongo connection URI, and your database name. You will probably want to update the default messages set up in `src/server/responses.ts` to match your use case. Deploy the project to a server and run. Point Twilio to use your webhook endpoint when it recieves a SMS message to your Twilio phone number. That is all! Now you can manage the server and messaging through SMS using the commands above.
