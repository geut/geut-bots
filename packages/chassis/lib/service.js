const internals = {};

exports = module.exports = internals.Services = function (chassis) {

    this.root = chassis;
    this.services = {};

    return this;
};

exports.methodNameRx = /^[_$a-zA-Z][$\w]*(?:\.[_$a-zA-Z][$\w]*)*$/;

internals.Services.prototype.add = function (name, service) {

    if (typeof name !== 'object') {
        return this._add(name, service);
    }

    const items = [].concat(name);
    for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        this._add(item.name, item.service);
    }
};

internals.Services.prototype._add = function (name, service) {

    this.root._assert(typeof service === 'object', 'service must be an object');
    this.root._assert(typeof name === 'string', 'name must be a string');
    this.root._assert(name.match(exports.methodNameRx), `Invalid name: ${name}`);
    // NOTE: consider using joi to more "complex" arguments validation.
    this.root._assert(typeof service.connect === 'function', 'service must implement a connect method');

    if (this.services[name]) {
        console.warning(`Service ${name} already registered`);
    }
    // registering the service
    this.root._serviceName = name;
    this.services[name] = service;
    if (typeof service.trigger === 'function') {
        this.root._signals.trigger.add(service.trigger, this.root);
    }
};

