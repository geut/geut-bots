const Pkg = require('./package.json');

const Msg = {"messageType":"message","payload":{"type":"message","channel":"C59830KKJ","user":"U09UDDD89","text":"hi","ts":"1495994050.861681","source_team":"T09UD9JEB","team":"T09UD9JEB"}};

const internals = {
    window: 30,
    lastTalk: [],
    lastMessageTs: false,
    regex: /(\d+)/
};

const Conversation = function (chassis, options) {

    if (options.window) {
        internals.window = options.window;
    }

    chassis.ext('onPreMessageReceived', (msg, next) => {

        if (msg.messageType !== 'message') return msg;

        let ts = internals.regex.exec(msg.payload.ts);

        if (!ts) return msg;

        ts = ts[1];

        if (!internals.lastMessageTs) {
            internals.lastMessageTs = ts;
        }

        const diff = ts - internals.lastMessageTs;
        if (diff <= internals.window) {
            internals.lastTalk.push(msg.payload.text);
        } else {
            msg.payload.chassis = msg.payload.chassis || {};
            msg.payload.chassis.lastTalk = internals.lastTalk;
            internals.lastTalk = [];
        }
        internals.lastMessageTs = ts;
        return msg;
    });
};

Conversation.attributes = {
    name: 'slack-conversation',
    version: Pkg.version
};

module.exports = Conversation;
