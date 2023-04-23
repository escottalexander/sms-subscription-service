# sms-subscription-service
This service uses Twilio to enable you to parse messages from subscribers and categorize them into buckets by the code they entered. Admins can then send a message directed towards users based on which code they entered.

With this service you can:
- Add an admin that can send messages, add campaign codes, migrate users to a new campaign code
- Serve up an endpoint that you can point Twilio to as a webhook to receive messages
- Enable users to start receiving messages for a campaign, and later, stop receiving them by sending STOP 

Here is a list of valid commands for normal users:
- `%CODE%` - Send in any valid campaign code to sign up for messages related to that campaign.
- `STOP` - Remove themselves from the subscribed campaign.

For admin users these are the commands you can use:
- `%CODE%` - To send a predefined message to all subscribers with that campaign code.
- `ADD ADMIN %PHONE NUMBER%` - To add an admin.
- `REMOVE ADMIN %PHONE NUMBER%` - To remove an admin.
- `ADD CODE %CODE%` - To add a campaign code to the list of valid codes.
- `CHANGE CODE %CODE%` - To change a campaign code and all subscribers to a new or existing code. Effectively removes the old code.
- `REMOVE CODE %CODE%` - To remove a campaign code and unsubscribe all subscribers with that code. Consider using CHANGE CODE as it migrates users without them having to sign up for a new code.
- `CUSTOM %CODE OR ALL% %MESSAGE%` - To send a custom message to either a specific campaign or use ALL to send to entire list.
- `STATUS` - To check the status of the process. Should return RUNNING if all is well.
- `SHUTDOWN` - To shut down the process. 
- `SUBSCRIBE %CODE OR STOP%` - An admin can prepend 'SUBSCRIBE' to a normal user command to subscribe or unsubscribe their own account
- `SET MESSAGE %MESSAGE%` - Set the default message that is sent to subscribers 
