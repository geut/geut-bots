const Retext = require('retext');
const NlcstToString = require('nlcst-to-string');
const Keywords = require('retext-keywords');
const Pkg = require('./package.json');

const Topics = function (chassis, options){

    chassis.ext('onPreMessageReceived', (msg, next) => {

        if (typeof msg === 'function') return msg();

        // debugger;
        if (!msg.payload.chassis || !msg.payload.chassis.lastTalk) return next(msg);

        // TODO (dk): use plugin options to get the key where the conversation will be stored. default:lastTalk
        return new Promise( (resolve, reject) => {
            Retext()
                .use(Keywords)
                .process(msg.payload.chassis.lastTalk.join(' '), (err, out) => {
                    if (err) reject(err);

                    msg.payload.chassis.topics = msg.payload.chassis.topics || {};

                    out.data.keywords.forEach((keyword) => {
                        msg.payload.chassis.topics.keywords = NlcstToString(keyword.matches[0].node)
                    });

                    out.data.keyphrases.forEach(function (phrase) {
                        msg.payload.chassis.topics.phrases = phrase.matches[0].nodes.map(NlcstToString).join('');
                    });

                    resolve(next(msg));
                });
        });
    });
}

Topics.attributes = {
    name: 'topics',
    version: Pkg.version
};

module.exports = Topics;
