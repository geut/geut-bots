/**
 * Module: Plugin
 * @description Chassis general expansion point. Allows the creation of plugins, services connections
 * and extensions hooks usage.
 */

const Signal = require('mini-signals');
const EVENTS = require('./constants').events;

// Declare internals

const internals = {};

exports = module.exports = internals.Plugin = function (chassis) {

    // Public interface
    this.root = chassis;
    // services shortcut
    this.services = this.root._service.services;

    return this;
};

internals.Plugin.prototype.register = function (plugins, options, callback) {

    plugins = [].concat(plugins);

    const registrations = plugins.map( (plugin) => {

        if (typeof plugin === 'function') {
            if (!plugin.register) {                                 // plugin is register() function
                plugin = { register: plugin };
            } else {
                const target = {
                    options: {}
                };
                plugin = Object.assign(target, plugin);                      // Convert function to object
            }
        }
        const attributes = plugin.register.attributes;
        const registrationData = {
            register: plugin.register,
            name: attributes.name || attributes.pkg.name,
            version: attributes.version || attributes.pkg.version,
            pluginOptions: plugin.options,
            dependencies: attributes.dependencies
        };

        if (!this.root._registrations[registrationData.name]) {
            this.root._registrations[registrationData.name] = registrationData;
        } else {
            console.warning(`Plugin ${registrationData.name} already registered`);
        }

        return registrationData;
    });

    this.root._registring = true;

    const each = (item, next) => {

        const pluginInstance = new internals.Plugin(this.root, item.name);

        if (item.dependencies) {
            pluginInstance.dependency(item.dependencies);
        }
        // Register
        item.register(pluginInstance, item.pluginOptions, next);
    };

    for (const item of registrations) {

        this.root._registring = false;
        const iteratee = () => {

            const done = (err) => {
                if (err) {
                    return callback(err);
                }
                iteratee();
            };
            each(item, done);
        };
        iteratee();
    }
};

internals.Plugin.prototype.dependency = function (dependencies) {

    this.root._dependencies.push({
        plugin: this.plugin,
        deps: [].concat(dependencies)
    });
};

internals.Plugin.prototype.service = function (name, method, options) {

    return this.root._service.add(name, method, options);
};

internals.Plugin.prototype.ext = function (events) {        // (event, method, options) -OR- (events)

    const callerFn = (arguments.callee && arguments.callee.caller) ? arguments.callee.caller.name : '';

    if (typeof events === 'string') {
        events = { type: arguments[0], method: arguments[1], options: arguments[2], callerFn };
        events = [].concat(events);
    }

    for (let i = 0; i < events.length; ++i) {
        this._ext(events[i]);
    }
};

internals.Plugin.prototype._ext = function (event) {

    event.plugin = this;
    const type = event.type;

    // general level (chassis) extensions
    this.root._assert(type !== EVENTS.start.pre || this.root._state === 'stopped', 'Cannot add onPreStart (after) extension after chassis was initialized');
    this.root._extensions[type].add(event);
};

internals.Plugin.prototype.engage = function (messageType, payload) {

    return this.root._invoke(EVENTS.message.received.pre, { messageType, payload })
        .then( (res) => this.onSense(res) )
        .then( (res) => this.root._invoke(EVENTS.message.received.post, res) );
};

internals.Plugin.prototype.onSense = function (msg) {
 
    if (!msg) return;
    if (typeof msg === 'function') return msg();
    const { messageType, payload } = msg;
    console.log('> onSense ', JSON.stringify(payload));
    this.root._signals[messageType].dispatch(payload);
    return this.root._invoke(EVENTS.message.received.on, { messageType, payload });
};

internals.Plugin.prototype.sense = function (messageType = 'sense', cb) {

    this.root._assert(this.root._running, 'First you need to register a service and then call chassis.startup method');

    if (typeof this.root._signals[messageType] === 'undefined') {
        this.root._signals[messageType] = new Signal();
        this.services[this.root._serviceName].sense.call(this, messageType);
    }
    this.root._signals[messageType].add(cb);
};

internals.Plugin.prototype.scan = function (fn) {

    this.root._assert(this.root._running, 'First you need to register a service and then call chassis.startup method');
    this.root._signals.scan.add(fn);
};

internals.Plugin.prototype.onTrigger = function (msg) {
    if (!msg) return;
    const { payload, where } = msg;
    this.root._signals.trigger.dispatch(payload, where);
    return this.root._invoke(EVENTS.message.sent.on, msg);
};

internals.Plugin.prototype.trigger = function (payload, where) {

    this.root._assert(this.root._running, 'First you need to register a service and then call chassis.startup method');
    return this.root._invoke(EVENTS.message.sent.pre, { payload, where })
        .then( (res) => this.onTrigger(res) )
        .then( (res) => this.root._invoke(EVENTS.message.sent.post, res) );
};

internals.Plugin.prototype.series = function (items) {
    /*
    try {
        return items.reduce( (promise, item) => {
            return promise
                .then( (result) => {
                    return action.call(ctx, item, result);
                });
        }, Promise.resolve() );
    } catch (e) {
        return Promise.reject(e);
    }
    */
    const iterate = index => (...args) => {
        // debugger;
        const itemFn = items[index];
        const next = iterate(index + 1);
        return itemFn ?
            Promise.resolve(itemFn.func(...args, next)) :
            Promise.resolve(...args);
    };

    try {
        return iterate(0)();
    } catch (ex) {
        return Promise.reject(ex);
    }
};

