// Load modules
const Assert = require('assert');
const Emitter = require('events');
const Util = require('util');
const Signal = require('mini-signals');
const Pkg = require('../package');
const Extension = require('./extension');
const Plugin = require('./plugin');
const Service = require('./service');
const EVENTS = require('./constants').events;

const internals = {};

exports = module.exports = internals.Chassis = function (opts = {}) {

    if (!(this instanceof internals.Chassis)) {
        return new internals.Chassis(opts);
    }

    // internal properties
    this._assert = Assert;
    this._events = new Emitter();
    this._dependencies = [];
    this._registrations = {};
    this._service = new Service(this);
    this._serviceName = '';
    this._running = false;
    this._extensionsSeq = 0;
    this._extensions = {
        [EVENTS.start.pre]: new Extension(EVENTS.start.pre, this),
        [EVENTS.start.on]: new Extension(EVENTS.start.on, this),
        [EVENTS.start.post]: new Extension(EVENTS.start.post, this),
        [EVENTS.stop.pre]: new Extension(EVENTS.stop.pre, this),
        [EVENTS.stop.on]: new Extension(EVENTS.stop.pre, this),
        [EVENTS.stop.post]: new Extension(EVENTS.stop.post, this),
        [EVENTS.message.sent.pre]: new Extension(EVENTS.message.sent.pre, this),
        [EVENTS.message.sent.on]: new Extension(EVENTS.message.sent.on, this),
        [EVENTS.message.sent.post]: new Extension(EVENTS.message.sent.post, this),
        [EVENTS.message.received.pre]: new Extension(EVENTS.message.received.pre, this),
        [EVENTS.message.received.on]: new Extension(EVENTS.message.received.on, this),
        [EVENTS.message.received.post]: new Extension(EVENTS.message.received.post, this)
    };
    this._signals = {
        sense: new Signal(),
        trigger: new Signal(),
        scan: new Signal()
    };

    // public bot properties
    this.toolbox = {};

    // build plugin system
    Plugin.call(this, this);

    // debug mode
    this.debug = !!opts.debug;

    if (opts.debug) {

        const debug = (msg) => console.info('> DEBUG', msg);
        const error = (err) => console.error('> ERROR', err.stack || JSON.stringify(err));
        this._events.on('debug', debug);
        this._events.on('internal-error', error);
    }

    return this;
};

Util.inherits(internals.Chassis, Plugin);

internals.detectManager = () => {

    Assert(Pkg &&
        Pkg.geut &&
        Pkg.geut.bots &&
        Pkg.geut.bots.service, 'GEUT bots service metadata is not present');
    return Pkg.geut.bots.service;
};

internals.Chassis.prototype._validateDeps = function () {

    const dependenciesLength = this._dependencies.length;
    for (let i = 0; i < dependenciesLength; ++i) {
        const dependency = this._dependencies[i];
        const dependencyLength = dependency.deps.length;
        for (let j = 0; j < dependencyLength; ++j) {
            const dep = dependency.deps[j];
            if (!this._registrations[dep]) {
                return new Error(`Plugin ${dependency.plugin} missing dependency ${dep}`);
            }
        }
    }

    return null;
};

internals.Chassis.prototype._invoke = function (extType, params) {

    this._assert.strictEqual(typeof extType, 'string', 'An extension type is required');

    const exts = this._extensions[extType];

    if (!exts.nodes) {
        return Promise.resolve(params);
    }

    const debugWrap = (fnObj) => {

        if (this.debug && fnObj.callerFn) {
            this._events.emit('debug', `calling ${fnObj.callerFn} plugin`);
        }
        return fnObj.func;
    };

    const iterate = index => (...args) => {
        const itemFn = exts.nodes[index];
        const nextFn = iterate(index + 1);

        return itemFn ?
            Promise.resolve(debugWrap(itemFn)(...args, nextFn)) :
            Promise.resolve(...args);
    };

    try {
        return iterate(0)(params);
    } catch (ex) {
        return Promise.reject(ex);
    }
};

internals.Chassis.prototype.startup = function (credentials, serviceName) {

    this._assert(credentials && typeof credentials === 'object', 'An object with service credentials is required');

    if (typeof serviceName !== 'string') {
        serviceName = internals.detectManager();
        this._assert.strictEqual(typeof serviceName, 'string', 'A string indicating a service is expected');
    }
    this._events.emit(EVENTS.start.pre, this);

    return this._service.services[serviceName].connect(this, credentials)
        .then(() => {
            this._running = true;
            this._events.emit(EVENTS.start.on, this);
            this._invoke(EVENTS.start.post, () => console.log('onPostStart triggered!'), this);
        });
};

internals.Chassis.prototype.shutdown = function () {

    this._events.emit(EVENTS.stop.pre);
    // close service connection
    this._events.emit(EVENTS.stop.post);
    return;
};
