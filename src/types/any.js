'use strict';

const Assert = require('@botbind/dust/src/assert');

const Schema = require('../schema');
const Extend = require('../extend');

module.exports = Extend.schema(Schema, {
    flags: {
        only: false,
        cast: false,
    },
    messages: {
        'any.required': '{#label} is required',
        'any.forbidden': '{#label} is forbidden',
        'any.default': 'Default value for {#label} fails to resolve due to: "{#error.message}"',
        'any.ref': 'Rule "{#name}" references {#ref} which {#message}',
        'any.only': '{#label} must be {#values}',
        'any.invalid': '{#label} must not be {#values}',
        'any.rule': '{#label} fails validation due to {#error.message}',
    },
    terms: {
        conditions: { default: [] },
        notes: { default: [] },
    },

    rules: {
        convert: {
            method(enabled = true) {

                return this.settings({ strict: !enabled });
            },
        },

        messages: {
            method(messages) {

                return this.settings({ messages });
            },
        },

        annotate: {
            alias: ['notes', 'description'],

            method(...notes) {

                Assert(notes.length, 'Notes must contain at least one note');

                const target = this.clone();

                for (const note of notes) {
                    Assert(typeof note === 'string', 'Notes must contain only strings');

                    target.$terms.notes.push(note);
                }

                return target;
            },
        },

        rule: {
            alias: 'custom',
            single: false,
            args: ['method', 'description'],

            method(method, description) {

                Assert(typeof method === 'function', 'Method must be a function');
                Assert(description === undefined || typeof description === 'string', 'Description must be a string');

                return this.$addRule({ name: 'rule', args: { method, description } });
            },

            validate: (value, helpers, { method }) => {

                try {
                    return method(value, helpers);
                }
                catch (error) {
                    return helpers.error('any.rule', { error });
                }
            },
        },
    },
});
