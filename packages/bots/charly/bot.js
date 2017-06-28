// Bot: charly
const Chassis = require('@geut/Chassis').Chassis;
const SlackChassis = require('@geut/chassis-slack-service');
const Conversation = require('@geut/conversation-plugin');
const Topics = require('@geut/topics-plugin');
const Charly = new Chassis({debug: true});

/**
 * Excercise: lets mock our new bot, Charly, using the Chassis API.
 **/

// A service defines a basic connection mechanism for our bot.
Charly.service(SlackChassis.attributes.name, SlackChassis);

// Create a simple plugin
const log = function log(chassis){

    chassis.ext('onMessageReceived', function(message, next){

        console.log(`> raw message: ${JSON.stringify(message)}`);
        return next(message);
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
        register: Topics,
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

        console.log('Charly bot: Up and ready!');

        Charly.sense('message', (input) => {
            if (input.chassis && input.chassis.topics) {
                Charly.trigger(
                    `:spiral_note_pad:Los temas de la última conversación fueron: ${JSON.stringify(input.chassis.topics.keywords)}\nLas frases destacadas: ${JSON.stringify(input.chassis.topics.phrases)}`,
                    'backyard'
                );
            }
        });

    })
    .catch((error) => {

        console.log(`Something wrong happened on bot startup ${JSON.stringify(error)}`);
    });
