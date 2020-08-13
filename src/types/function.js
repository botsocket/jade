'use strict';

const Assert = require('@botbind/dust/src/assert');

const Any = require('./any');
const Extend = require('../extend');

module.exports = Extend.schema(Any, {
    type: 'function',
    messages: {
        'function.base': '{#label} must be a function',
        'function.inherit': '{#label} must inherit {#name}',
    },

    validate: (value, { error }) => {

        if (typeof value !== 'function') {
            return error('function.base');
        }

        return value;
    },

    rules: {
        inherit: {
            single: false,
            args: ['ctor'],

            method(ctor) {

                Assert(typeof ctor === 'function', 'Constructor must be a function');

                return this.$addRule({ name: 'inherit', args: { ctor } });
            },

            validate: (value, { error }, { ctor }) => {

                if (value.prototype instanceof ctor) {
                    return value;
                }

                return error('function.inherit', { ctor, name: ctor.name });
            },
        },
    },
});
