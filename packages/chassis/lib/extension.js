const Topo = require('topo');

const internals = {};

exports = module.exports = internals.Extension = function (type, chassis) {

    this._topo = new Topo();
    this._chassis = chassis;
    this.type = type;
    this.nodes = null;
};

/**
 * add
 * @description Adds a new event method (and options) into the topo structure
 */
internals.Extension.prototype.add = function (event) {

    const methods = [].concat(event.method);
    const options = event.options || {};
    const methodsLength = methods.length;
    let idx = 0;

    for (; idx < methodsLength; ++idx) {
        const settings = {
            before: options.before,
            after: options.after,
            sort: this._chassis._extensionsSeq++
        };
        const node = {
            func: methods[idx],
            callerFn: event.callerFn,
            bind: options.bind,
            plugin: event.plugin
        };

        this._topo.add(node, settings);
    }

    this.nodes = this._topo.nodes;
};
