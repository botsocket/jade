'use strict';

const Assert = require('@botsocket/bone/src/assert');
const Get = require('@botsocket/bone/src/get');
const Equal = require('@botsocket/bone/src/equal');

const BaseObject = require('./baseObject');
const Extend = require('../extend');
const Utils = require('../utils');

const internals = {};

module.exports = Extend.schema(BaseObject, {
    type: 'array',
    flags: {
        sparse: false,
        single: false,
    },
    terms: {
        ordereds: { default: [] },
        items: { default: [] },
        _requireds: { default: [] },
        _forbiddens: { default: [] },
        _inclusions: { default: [] },
    },
    messages: {
        'array.base': '{#label} must be an array',
        'array.sparse': '{#label} must not be a sparse array item',
        'array.forbidden': '{#label} is forbidden',
        'array.unknown': '{#label} is not allowed',
        'array.requiredBoth': '{#label} does not have {#knownMisses} and {#unknownMisses} other required value{if(#unknownMisses == 1, "", "s")}',
        'array.requiredKnowns': '{#label} does not have {#knownMisses}',
        'array.requiredUnknowns': '{#label} does not have {#unknownMisses} required value{if(#unknownMisses == 1, "", "s")}',
        'array.orderedLength': '{#label} must have at most {#limit} item(s)',
        'array.length': '{#label} must have {#limit} item(s)',
        'array.min': '{#label} must have at least {#limit} item(s)',
        'array.max': '{#label} must have at most {#limit} item(s)',
        'array.unique': '{#label} must not have duplicate items at {#pos} and {#dupPos}',
    },

    args: (schema, ...items) => {

        return schema.items(...items);
    },

    coerce: (value) => {

        if (typeof value !== 'string') {
            return value;
        }

        try {
            return JSON.parse(value);
        }
        catch (error) {
            return value;
        }
    },

    rebuild: (schema) => {

        schema.$terms._requireds = [];
        schema.$terms._inclusions = [];
        schema.$terms._forbiddens = [];

        for (const item of schema.$terms.items) {
            internals.verifySingle(item, schema);

            const presence = item.$getFlag('presence');
            if (presence === 'required') {
                schema.$terms._requireds.push(item);
                continue;
            }

            if (presence === 'forbidden') {
                schema.$terms._forbiddens.push(item);
                continue;
            }

            schema.$terms._inclusions.push(item);
        }

        for (const item of schema.$terms.ordereds) {
            internals.verifySingle(item, schema);
        }
    },

    validate: (value, { error, state, schema, settings }) => {

        let single = false;

        if (!Array.isArray(value)) {
            if (schema.$getFlag('single')) {
                single = true;
                value = [value];
            }
            else {
                return error('array.base');
            }
        }

        const sparse = schema.$getFlag('sparse');

        // No rules to test

        if (!schema.$terms.items.length &&
            !schema.$terms.ordereds.length &&
            sparse) {

            return value;
        }

        // Clone if not single

        if (!single) {
            value = [...value];
        }

        const errors = [];
        const ordereds = [...schema.$terms.ordereds];
        const requireds = [...schema.$terms._requireds];
        const inclusions = [...schema.$terms._inclusions, ...schema.$terms._requireds];

        for (let i = 0; i < value.length; i++) {
            const item = value[i];
            const divedState = state.dive(value, i);

            // Sparse

            if (!sparse &&
                item === undefined) {

                errors.push(error('array.sparse', { pos: i }, divedState));

                if (settings.abortEarly) {
                    return errors;
                }

                ordereds.shift();
                continue;
            }

            let errored = false;

            // Forbiddens

            for (const forbidden of schema.$terms._forbiddens) {
                const result = forbidden.$validate(item, settings, divedState, { presence: 'ignore' });                                 // Prevent undefined from generating in array.forbidden

                if (result.errors) {
                    continue;
                }

                errors.push(error('array.forbidden', { pos: i }, divedState));

                if (settings.abortEarly) {
                    return errors;
                }

                errored = true;
                ordereds.shift();
                break;
            }

            if (errored) {
                continue;
            }

            // Ordereds

            if (schema.$terms.ordereds.length) {
                if (ordereds.length) {
                    const ordered = ordereds.shift();
                    const result = ordered.$validate(item, settings, divedState);

                    if (result.errors) {
                        errors.push(...result.errors);

                        if (settings.abortEarly) {
                            return result.errors;
                        }

                        continue;                                                                       // Failed. Move on to the next item
                    }

                    if (ordered.$getFlag('result') === 'strip') {
                        value.splice(i, 1);
                        i--;
                    }
                    else {
                        value[i] = result.value;
                    }

                    continue;
                }
                else if (!schema.$terms.items.length) {
                    errors.push(error('array.orderedLength', { limit: schema.$terms.ordereds.length }));

                    if (settings.abortEarly) {
                        return errors;
                    }

                    break;                                                                              // No more rules to test, so move on to the next item
                }
            }

            let isValid = false;
            const requiredChecks = [];

            // Requireds

            for (let j = 0; j < requireds.length; j++) {
                const required = requireds[j];
                const result = required.$validate(item, settings, divedState);

                requiredChecks[j] = result;

                if (!result.errors) {
                    isValid = true;

                    if (required.$getFlag('result') === 'strip') {
                        value.splice(i, 1);
                        i--;
                    }
                    else {
                        value[i] = result.value;
                    }

                    requireds.splice(j, 1);
                    break;                                                                              // Matched
                }
            }

            if (isValid) {                                                                              // Required match. Move on to the next item
                continue;
            }

            // Inclusions

            for (const inclusion of inclusions) {
                let result;

                const idx = requireds.indexOf(inclusion);                                               // Prevent running failed requireds twice
                if (idx !== -1) {
                    result = requiredChecks[idx];
                }
                else {
                    result = inclusion.$validate(item, settings, divedState);

                    if (!result.errors) {
                        isValid = true;

                        if (inclusion.$getFlag('result') === 'strip') {
                            value.splice(i, 1);
                            i--;
                        }
                        else {
                            value[i] = result.value;                                                    // Reassign item with the modified value for forbidden checks
                        }

                        break;
                    }
                }

                if (inclusions.length === 1) {                                                          // Return actual error if there's only 1 item defined
                    if (settings.stripUnknown) {
                        value.splice(i, 1);
                        i--;
                        isValid = true;                                                                 // This item although failed, is still valid because it is considered unknown and has been stripped
                        continue;
                    }

                    errors.push(...result.errors);

                    if (settings.abortEarly) {
                        return errors;
                    }

                    errored = true;
                }
            }

            if (errored) {                                                                              // Prevent having actual error with array.unknown
                continue;
            }

            if (inclusions.length &&
                !isValid) {

                if (settings.stripUnknown) {
                    value.splice(i, 1);
                    i--;
                    continue;
                }

                errors.push(error('array.unknown', { pos: i }, divedState));

                if (settings.abortEarly) {
                    return errors;
                }
            }
        }

        // Required checks

        if (requireds.length) {
            errors.push(internals.errorMissedRequireds(requireds, error));

            if (settings.abortEarly) {
                return errors;
            }
        }

        const requiredOrdereds = ordereds.filter((ordered) => ordered.$getFlag('presence') === 'required');

        if (requiredOrdereds.length) {
            errors.push(internals.errorMissedRequireds(requiredOrdereds, error));

            if (settings.abortEarly) {
                return errors;
            }
        }

        if (errors.length) {
            return errors;
        }

        // Fill ordered default values

        for (let i = 0; i < ordereds.length; i++) {
            const result = ordereds[i].$validate(undefined, settings, state.dive(value.length + i - 1));
            const defaultValue = result.value;

            if (defaultValue === undefined) {
                if (!settings.produceSparseArrays) {
                    break;
                }

                let next;
                while (next === undefined &&
                    i < ordereds.length - 1) {

                    i++;
                    const nextResult = ordereds[i].$validate(undefined, settings, state.dive(value.length + i - 1));
                    next = nextResult.value;
                }

                if (next !== undefined) {
                    value[i] = next;
                }

                continue;
            }

            value.push(defaultValue);
        }

        return value;
    },

    rules: {
        items: {
            alias: 'of',

            method(...items) {

                return internals.items(this, items, 'items');
            },
        },

        ordered: {
            alias: 'tuple',

            method(...items) {

                return internals.items(this, items, 'ordereds');
            },
        },

        single: {
            method(enabled = true) {

                Assert(!enabled || !this.$getFlag('_hasArrayItems'), 'Cannot specify single when array has array items');

                return this.$setFlag('single', enabled);
            },
        },

        sparse: {
            method(enabled = true) {

                return this.$setFlag('sparse', enabled);
            },
        },

        length: {
            args: {
                limit: {
                    ref: true,
                    assert: Utils.isNumber,
                    message: 'must be a number',
                },
            },

            method(limit) {

                return this.$addRule({ name: 'length', args: { limit }, operator: '=' });
            },

            validate: (value, { error }, { limit }, { name, args, operator }) => {

                if (Utils.compare(value.length, limit, operator)) {
                    return value;
                }

                return error(`array.${name}`, { limit: args.limit });
            },
        },

        min: {
            method(limit) {

                return this.$addRule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            },
        },

        max: {
            method(limit) {

                return this.$addRule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            },
        },

        unique: {
            args: ['comparator'],

            method(comparator) {

                const isComparator = typeof comparator === 'function';
                const isPath = typeof comparator === 'string';

                Assert(comparator === undefined || isPath || isComparator, 'Comparator must be a string or a function');

                return this.$addRule({ name: 'unique', args: { comparator }, isPath, isComparator });
            },

            validate: (value, helpers, { comparator }, { isComparator, isPath }) => {

                const records = new Map();
                const compare = isComparator ? comparator : (a, b) => Equal(a, b);

                for (let i = 0; i < value.length; i++) {
                    const item = isPath ? Get(value[i], comparator) : value[i];
                    for (const [current, idx] of records) {
                        if (compare(current, item)) {
                            return helpers.error('array.unique', { pos: idx, dupPos: i });
                        }
                    }

                    records.set(item, i);
                }

                return value;
            },
        },
    },

    casts: {
        set: (value) => new Set(value),
    },
});

internals.verifySingle = function (item, schema) {

    if (item.$isType('array') ||
        item.$getFlag('_hasArrayItems')) {

        Assert(!schema.$getFlag('single'), 'Cannot specify single when array has array items');

        schema.$setFlag('_hasArrayItems', true, { clone: false });
    }
};

internals.errorMissedRequireds = function (requireds, error) {

    const knownMisses = [];
    let unknownMisses = 0;

    for (const required of requireds) {
        const label = required.$getFlag('label');
        if (label) {
            knownMisses.push(label);
            continue;
        }

        unknownMisses++;
    }

    if (knownMisses.length) {
        if (unknownMisses) {
            return error('array.requiredBoth', {
                knownMisses,
                unknownMisses,
            });
        }

        return error('array.requiredKnowns', { knownMisses });
    }

    return error('array.requiredUnknowns', { unknownMisses });
};

internals.items = function (schema, items, type) {

    Assert(items.length, 'Items must have at least one item');

    const target = schema.clone();

    target.$terms[type].push(...items.map((item) => schema.$compile(item)));
    return target.$rebuild();
};
