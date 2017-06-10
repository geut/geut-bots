const RtmClient = require('@slack/client').RtmClient;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

const Service = {};

module.exports = Service;

Service.attributes = {
    name: 'chassisSlackService',
    pkg: require('./package.json')
};

Service.connect = function connect(ctx, credentials) {

    const bot_token = credentials.SLACK_BOT_TOKEN || process.env.SLACK_BOT_TOKEN;
    return new Promise((resolve, reject) => {
        // we can use the toolbox as a generic high level object (useful for sharing bot state)
        ctx.toolbox.rtm = new RtmClient(bot_token);

        // The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload if you want to cache it
        ctx.toolbox.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
            // Idea: use something like ctx.log([tag], msg); // log provided by chassis
            ctx.toolbox.channels = {};
            for (const c of rtmStartData.channels) {
                if (c.is_member) {
                    ctx.toolbox.channels[c.name] = c.id ;
                }
            }
            console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
        });

        ctx.toolbox.rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {

            resolve(ctx.toolbox.rtm);
        });

        ctx.toolbox.rtm.on(CLIENT_EVENTS.RTM.WS_ERROR, (err) => {

            reject(err);
        });

        // kickoff
        ctx.toolbox.rtm.start();
    });
};

Service.sense = function sense(msgType){

    this.toolbox.rtm.on(msgType, (data) => {
        this.engage(msgType, data);
    });
};

Service.trigger = function trigger(msg, destination){

    if (this.toolbox.channels[destination]){
        this.toolbox.rtm.sendMessage(msg, this.toolbox.channels[destination]);
    }
};

