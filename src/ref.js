'use strict';

const Assert = require('@botbind/dust/src/assert');
const Get = require('@botbind/dust/src/get');
const SplitPath = require('@botbind/dust/src/splitPath');

const Utils = require('./utils');

const internals = {};

exports.create = function (path, options = {}) {

    Assert(typeof path === 'string', 'Path must be a string');
    Assert(options.ancestor === undefined || typeof options.ancestor === 'number', 'Option ancestor must be a number');

    const context = internals.context(path, options);
    context.in = options.in;

    return new internals.Ref(context);
};

internals.context = function (path, options) {

    if (options.prefix !== false) {
        if (path[0] === '$') {
            return { path: path.slice(1), type: 'global' };
        }

        if (path[0] === '#') {
            return { path: path.slice(1), type: 'local' };
        }

        if (path[0] === '.') {
            Assert(options.ancestor === undefined, 'Cannot use both the ancestor option with the ancestor prefix');

            let slice = 1;
            while (path[slice] === '.') {
                slice++;
            }

            return { path: path.slice(slice), type: 'value', ancestor: slice - 1 };
        }
    }

    return {
        path,
        type: 'value',
        ancestor: options.ancestor === undefined ? 1 : options.ancestor,
    };
};

internals.Ref = class {
    constructor(context) {

        this._path = context.path;
        this._type = context.type;
        this._ancestor = context.ancestor;
        this._in = context.in;
        this._keys = SplitPath(this._path);
        this._root = this._keys[0];
        this._display = null;

        this._createDisplay();
    }

    _createDisplay() {

        let head = '';
        if (this._type === 'value' &&
            this._ancestor !== 1) {

            head = new Array(this._ancestor + 1).fill('.').join('');
        }

        const type = this._type === 'value' ? '' : `${this._type}:`;
        this._display = `"${type}${head}${this._path}"`;
    }

    resolve(value, settings, state, local) {

        if (this._type === 'global') {
            return Get(settings.context, this._keys);
        }

        if (this._type === 'local') {
            return Get(local, this._keys);
        }

        if (!this._ancestor) {
            return Get(value, this._keys);
        }

        Assert(this._ancestor <= state.ancestors.length, `Reference to ${this._display} exceeds the schema root`);

        return Get(state.ancestors[this._ancestor - 1], this._keys);
    }

    toString() {

        return this._display;
    }

    describe() {

        const ref = { ref: this._path };

        if (this._type !== 'value') {
            ref.type = this._type;
        }

        if (this._type === 'value' &&
            this._ancestor !== 1) {

            ref.ancestor = this._ancestor;
        }

        if (this._in) {
            ref.in = this._in;
        }

        return ref;
    }
};

internals.Ref.prototype[Utils.symbols.ref] = true;
internals.Ref.prototype.immutable = true;

exports.Register = class {
    constructor(refs = []) {

        this.refs = refs;                           // [[ancestor, root]]
    }

    reset() {

        this.refs = [];
    }

    clone() {

        return new exports.Register([...this.refs]);
    }

    register(value, register = 1) {

        // References

        if (Utils.isRef(value) &&
            value._type === 'value' &&
            value._ancestor - register >= 0) {

            this.refs.push([value._ancestor - register, value._root]);
            return;
        }

        // Schemas

        if (Utils.isSchema(value)) {
            for (const [ancestor, root] of value._refs.refs) {
                if (ancestor - register >= 0) {
                    this.refs.push([ancestor - register, root]);
                }
            }

            return;
        }

        // Values

        if (Utils.isValues(value)) {
            for (const ref of value._refs) {
                this.register(ref, register);
            }

            return;
        }

        // Templates

        if (Utils.isTemplate(value)) {
            for (const ref of value._refs) {
                this.register(ref, register);
            }
        }
    }

    references() {

        const references = [];
        for (const [ancestor, root] of this.refs) {
            if (!ancestor) {
                references.push(root);
            }
        }

        return references;
    }
};
