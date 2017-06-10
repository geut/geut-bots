// Bot: charly
const Chassis = require('@geut/Chassis').Chassis;
const SlackChassis = require('@geut/chassis-slack-service');
const Conversation = require('@geut/conversation-plugin');
const Charly = new Chassis({debug: true});

/**
 * Excercise: lets mock our new bot, Charly, using the Chassis API.
 **/

// A service defines a basic connection mechanism for our bot.
Charly.service(SlackChassis.attributes.name, SlackChassis);

// Create a simple plugin
const log = function log(chassis){

    chassis.ext('onMessageReceived', function(message, next){

        console.log(`raw message is: ${JSON.stringify(message)}`);
        // next(null, message);
        return message;
    });
};

log.attributes = {
    name: 'logPlugin',
    version: '1.0.0'
};

// register some plugins
Charly.register([
    {
        register: Conversation,
        options: {}
    },
    {
        register: log,
        options: {}
    }
]);

const credentials = {
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN
};

Charly.startup(credentials, SlackChassis.attributes.name)
    .then((data) => {

        console.log(`Is Chassis running? ${JSON.stringify(Charly._running)}`);
        console.log('Charly bot: Up and ready!');
        Charly.sense('message', (input) => {
        })
    })
    .catch((error) => {

        console.log(`Something wrong happened on bot startup ${JSON.stringify(error)}`);
    });
