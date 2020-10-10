'use strict';

const Clone = require('@botsocket/bone/src/clone');
const Copal = require('@botsocket/copal');

const Ref = require('./ref');
const Utils = require('./utils');

const internals = {};

module.exports = internals.Template = class {
    constructor(source, options) {

        this._refs = [];
        this._settings = options;

        this._template = Copal.parse(source, {
            reference: (path) => {

                const ref = Ref.create(path, this._settings);
                this._refs.push(ref);
                return (context) => ref.resolve(...context);
            },
        });
    }

    resolve(value, settings, state, local) {

        return this._template.resolve([value, settings, state, local]);
    }

    toString() {

        return this._template.toString();
    }

    describe(options = {}) {

        if (options.compact &&
            !this._settings) {

            return this._template.source;
        }

        const desc = { template: this._template.source };

        if (this._settings) {
            desc.options = Clone(this._settings);
        }

        return desc;
    }
};

internals.Template.prototype[Utils.symbols.template] = true;
internals.Template.prototype.immutable = true;
