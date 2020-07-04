'use strict';

const Any = require('./any');
const Extend = require('../extend');
const Utils = require('../utils');

module.exports = Extend.schema(Any, {
    type: 'number',
    flags: {
        unsafe: false,
    },
    messages: {
        'number.base': '{#label} must be a number',
        'number.integer': '{#label} must be an integer',
        'number.min': '{#label} must be greater than or equal to {#limit}',
        'number.max': '{#label} must be less than or equal to {#limit}',
        'number.multiple': '{#label} must be a multiple of {#factor}',
        'number.divide': '{#label} must divide {#dividend}',
        'number.greater': '{#label} must be greater than {#limit}',
        'number.less': '{#label} must be less than {#limit}',
        'number.even': '{#label} must be an even number',
        'number.infinity': '{#label} must not be infinity',
        'number.unsafe': '{#label} must be a safe number',
    },

    coerce: (value) => {
        if (typeof value !== 'string') {
            return value;
        }

        const coerced = Number(value);
        if (!Number.isNaN(coerced)) {
            return coerced;
        }

        return value;
    },

    validate: (value, { schema, error }) => {
        if (value === Infinity ||
            value === -Infinity) {

            return error('number.infinity');
        }

        if (!Utils.isNumber(value)) {
            return error('number.base');
        }

        if (!schema.$getFlag('unsafe') &&
            (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)) {

            return error('number.unsafe');
        }

        return value;
    },

    rules: {
        unsafe: {
            method(enabled = true) {
                return this.$setFlag('unsafe', enabled);
            },
        },

        compare: {
            method: false,
            args: {
                limit: {
                    ref: true,
                    assert: Utils.isNumber,
                    message: 'must be a number',
                },
            },

            validate: (value, { error }, { limit }, { name, args, operator }) => {
                if (Utils.compare(value, limit, operator)) {
                    return value;
                }

                return error(`number.${name}`, { limit: args.limit });
            },
        },

        integer: {
            validate: (value, { error }) => {
                if (Number.isInteger(value)) {
                    return value;
                }

                return error('number.integer');
            },
        },

        min: {
            method(limit) {
                return this.$addRule({ name: 'min', method: 'compare', args: { limit }, operator: '>=' });
            },
        },

        max: {
            method(limit) {
                return this.$addRule({ name: 'max', method: 'compare', args: { limit }, operator: '<=' });
            },
        },

        greater: {
            method(limit) {
                return this.$addRule({ name: 'greater', method: 'compare', args: { limit }, operator: '>' });
            },
        },

        less: {
            method(limit) {
                return this.$addRule({ name: 'less', method: 'compare', args: { limit }, operator: '<' });
            },
        },

        multiple: {
            single: false,
            alias: 'divisible',
            args: {
                factor: {
                    ref: true,
                    assert: Utils.isNumber,
                    message: 'must be a number',
                },
            },

            method(factor) {
                return this.$addRule({ name: 'multiple', args: { factor } });
            },

            validate: (value, { error }, { factor }, { args }) => {
                if (value % factor === 0) {
                    return value;
                }

                return error('number.multiple', { factor: args.factor });
            },
        },

        even: {
            method() {
                return this.multiple(2);
            },
        },

        divide: {
            single: false,
            args: {
                dividend: {
                    ref: true,
                    assert: Utils.isNumber,
                    message: 'must be a number',
                },
            },

            method(dividend) {
                return this.$addRule({ name: 'divide', args: { dividend } });
            },

            validate: (value, { error }, { dividend }, { args }) => {
                if (dividend % value === 0) {
                    return value;
                }

                return error('number.divide', { dividend: args.dividend });
            },
        },
    },

    casts: {
        string: (value) => value.toString(),
    },
});
