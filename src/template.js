'use strict';

const Clone = require('@botbind/dust/src/clone');
const Template = require('@botbind/template');

const Ref = require('./ref');
const Utils = require('./utils');

const internals = {};

module.exports = internals.Template = class {
    constructor(source, options) {
        this._refs = [];
        this._settings = options;

        this._template = Template.parse(source, {
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

    describe() {
        const template = { source: this._template.source };

        if (this._settings) {
            template.options = Clone(this._settings);
        }

        return { template };
    }
};

internals.Template.prototype[Utils.symbols.template] = true;
internals.Template.prototype.immutable = true;
