'use strict';

const Any = require('./any');
const Extend = require('../extend');
const Utils = require('../utils');

const internals = {};

module.exports = Extend.schema(Any, {
    type: '_baseObject',

    rebuild(schema) {

        if (schema.$getFlag('default') === Utils.symbols.deepDefault) {
            internals.deepDefault(schema, true);
        }
    },

    overrides: {
        default(value, options) {

            if (value === undefined) {
                const target = this.$super.default(Utils.symbols.deepDefault, options);
                return target.$rebuild();
            }

            return this.$super.default(value, options);
        },
    },
});

internals.deepDefault = function (schema, initial) {

    if (!initial &&
        internals.hasDefault(schema)) {                         // Do not process schema with default values

        return schema;
    }

    let hasDefault = false;

    // Object schemas

    if (schema.$isType('object')) {
        if (!schema.$terms.keys) {
            return schema;
        }

        for (const child of schema.$terms.keys) {
            child.schema = internals.deepDefault(child.schema);
            if (!hasDefault) {
                hasDefault = !initial && internals.hasDefault(child.schema);
            }
        }
    }

    // Array schemas

    if (schema.$isType('array')) {
        const ordereds = schema.$terms.ordereds;
        for (let i = 0; i < ordereds.length; i++) {
            ordereds[i] = internals.deepDefault(ordereds[i]);
            if (!hasDefault) {
                hasDefault = !initial && internals.hasDefault(ordereds[i]);
            }
        }
    }

    return hasDefault
        ? schema.default(Utils.symbols.deepDefault)             // Pass deepDefault explicitly to prevent $rebuild from being triggered
        : schema;
};

internals.hasDefault = function (schema) {

    return schema.$getFlag('default') !== undefined;
};


