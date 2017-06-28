const Test = require('tape');
const Chassis = require('../lib').Chassis;

Test('Initialization', (t) => {

    const chassis = new Chassis();
    t.deepEqual(typeof chassis, 'object', 'chassis instance should be an object');
    t.deepEqual(typeof chassis.startup, 'function', 'chassis instance should not be an empty object');
    t.end();
});

Test('Register a new service', (t) => {

    const chassis = new Chassis();

    // creating a new service
    chassis.service('demoservice', {
        connect: (ctx, credentials) => Promise.resolve( () => `service credentials: ${credentials}`),
        sense: (msgType) => { this.engage(msgType,`${msgType} just happen`) },
        trigger: (msg, destination) => {
            return `triggering ${msg}`
        }
    });

    t.deepEqual(typeof chassis.services['demoservice'].connect, 'function', 'connect function should be registered ok');

    chassis.startup({}, 'demoservice')
        .then((result) => {

            chassis
                .trigger('test message', 'general')
                .then(() => t.end())
                .catch((err) => {
                    t.fail(err);
                });
        })
        .catch((err) => {
            t.fail(err);
        })
});

Test('Add a simple plugin', (t) => {

    const chassis = new Chassis();

    // creating a new service
    chassis.service('demoservice', {
        connect: (ctx, credentials) => Promise.resolve( () => `service credentials: ${credentials}`),
        sense: (msgType) => { this.engage(msgType,`${msgType} just happen`) },
        trigger: (msg, destination) => { return `triggering ${msg}`; }
    });

    t.deepEqual(typeof chassis.services.demoservice.connect, 'function', 'connect function should be registered ok');

    // creating new plugin
    const plugin = function plugin(chassis){

        t.deepEqual(typeof chassis.ext, 'function', 'chassis ext method is available');
        chassis.ext('onPreMessageSent', (data, next) => {

            t.deepEqual(typeof chassis, 'object', 'chassis instance available from within the plugin');
            t.deepEqual(data.payload, 'test message', 'received message on plugin should be equal to triggered message');
            return next(data);
        });
    };

    plugin.attributes = {
        name: 'demoPlugin',
        version: '1.1.1'
    };

    chassis.register({ register: plugin, options: {} });

     chassis.startup({}, 'demoservice')
        .then((result) => {
            chassis
                .trigger('test message', 'general')
                .then(() => t.end())
                .catch((err) => {
                    t.fail(err);
                });
        })
        .catch((err) => {
            t.fail(err);
        });
});

Test('Add a simple plugin which fails', (t) => {

    const chassis = new Chassis();

    // creating a new service
    chassis.service('demoservice', {
        connect: (ctx, credentials) => Promise.resolve( () => `service credentials: ${credentials}`),
        sense: (msgType) => { this.engage(msgType,`${msgType} just happen`) },
        trigger: (msg, destination) => { return `triggering ${msg}`; }
    });

    t.deepEqual(typeof chassis.services.demoservice.connect, 'function', 'connect function should be registered ok');

    // creating new plugin
    const plugin = function plugin(chassis){

        t.deepEqual(typeof chassis.ext, 'function', 'chassis ext method is available');
        chassis.ext('onPreMessageSent', (data, next) => {

            t.deepEqual(typeof chassis, 'object', 'chassis instance available from within the plugin');
            t.deepEqual(data.payload, 'test message', 'received message on plugin should be equal to triggered message');
            throw new Error('Failing from plugin')
            return next();
        });
    };

    plugin.attributes = {
        name: 'demoPlugin',
        version: '1.1.1'
    };

    chassis.register({ register: plugin, options: {} });

     chassis.startup({}, 'demoservice')
        .then((result) => {
            chassis
                .trigger('test message', 'general')
                .catch((err) => {
                    t.equal(err.message, 'Failing from plugin', 'Should catch the error');
                    t.end();
                });
        })
        .catch((err) => {
            t.fail(err);
        });
});

