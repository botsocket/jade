'use strict';

const Any = require('./any');
const Extend = require('../extend');
const Values = require('../values');

module.exports = Extend.schema(Any, {
    type: 'boolean',
    flags: {
        insensitive: false,
    },
    terms: {
        truthy: {
            default: new Values(),

            merge: (target, source, _, sourceParent) => {
                return target.merge(source, sourceParent.$terms.falsy);
            },
        },
        falsy: {
            default: new Values(),

            merge: (target, source, _, sourceParent) => {
                return target.merge(source, sourceParent.$terms.truthy);
            },
        },
    },
    messages: {
        'boolean.base': '{#label} must be a boolean',
    },

    coerce: (value, { schema, settings, state }) => {
        const type = typeof value;
        if (type === 'boolean') {
            return value;
        }

        const insensitive = schema.$getFlag('insensitive');

        if (type === 'string') {
            const coerced = insensitive ? value.toLowerCase() : value;

            if (coerced === 'true') {
                return true;
            }

            if (coerced === 'false') {
                return false;
            }
        }

        if (schema.$terms.truthy.has(value, settings, state, insensitive)) {
            return true;
        }

        if (schema.$terms.falsy.has(value, settings, state, insensitive)) {
            return false;
        }

        return value;
    },

    validate: (value, { error }) => {
        if (typeof value === 'boolean') {
            return value;
        }

        return error('boolean.base');
    },

    rules: {
        insensitive: {
            method(enabled = true) {
                return this.$setFlag('insensitive', enabled);
            },
        },

        truthy: {
            method(...values) {
                const target = this.clone();

                Values.add(values, target.$terms.truthy, target.$terms.falsy);
                return target.$rebuild();
            },
        },

        falsy: {
            method(...values) {
                const target = this.clone();

                Values.add(values, target.$terms.falsy, target.$terms.truthy);
                return target.$rebuild();
            },
        },
    },

    casts: {
        string: (value) => (value ? 'true' : 'false'),
        number: (value) => (value ? 1 : 0),
    },
});
