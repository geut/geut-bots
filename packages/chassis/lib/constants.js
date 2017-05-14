module.exports = {
    events: {
        start: {
            pre: 'onPreStart',
            on: 'onStart',
            post: 'onPostStart'
        },
        stop: {
            pre: 'onPreStop',
            on: 'onStop',
            post: 'onPostStop'
        },
        message: {
            received: {
                pre: 'onPreMessageReceived',
                on: 'onMessageReceived',
                post: 'onPostMessageReceived'
            },
            sent: {
                pre: 'onPreMessageSent',
                on: 'onMessageSent',
                post: 'onPostMessageSent'
            }
        }
    }
};
