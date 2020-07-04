'use strict';

const Any = require('./any');
const Extend = require('../extend');
const Utils = require('../utils');

const internals = {
    numberRx: /^[+-]?\d+(\.\d+)?$/,
};

module.exports = Extend.schema(Any, {
    type: 'date',
    messages: {
        'date.base': '{#label} must be a valid date',
        'date.max': '{#label} must be less than or equal to {#limit}',
        'date.min': '{#label} must be greater than or equal to {#limit}',
        'date.greater': '{#label} must be greater than {#limit}',
        'date.less': '{#label} must be less than {#limit}',
    },

    coerce: (value) => {
        const type = typeof value;
        if (type !== 'number' &&
            type !== 'string') {

            return value;
        }

        const coerced = internals.date(value);
        if (!coerced) {
            return value;
        }

        return coerced;
    },

    validate: (value, { error }) => {
        if (value instanceof Date &&
            !Number.isNaN(value.getTime())) {

            return value;
        }

        return error('date.base');
    },

    rules: {
        compare: {
            method: false,
            args: {
                limit: {
                    ref: true,
                    normalize: (arg) => (arg === 'now' ? arg : internals.date(arg)),
                    assert: (arg) => arg,
                    message: 'must be now or a valid date',
                },
            },

            validate: (value, { error }, { limit }, { name, args, operator }) => {
                if (limit === 'now') {
                    limit = Date.now();
                }
                else {
                    limit = limit.getTime();
                }

                if (Utils.compare(value.getTime(), limit, operator)) {
                    return value;
                }

                return error(`date.${name}`, { limit: args.limit });
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
    },

    casts: {
        string: (value) => value.toString(),
        number: (value) => value.getTime(),
    },
});

internals.date = function (value) {
    // Normalize string timestamps

    if (typeof value === 'string' &&
        internals.numberRx.test(value)) {

        value = Number(value);
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        return date;
    }

    return false;
};
