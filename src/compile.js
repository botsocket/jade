'use strict';

const Assert = require('@botbind/dust/src/assert');

const Ref = require('./ref');
const Utils = require('./utils');

const internals = {};

exports.schema = function (root, value) {

    Assert(value !== undefined, 'Cannot compile undefined to a schema');

    if (Utils.isSchema(value)) {
        return value;
    }

    if (internals.simple(value)) {
        return root.valid(root.override, value);
    }

    if (typeof value === 'function') {
        return root.rule(value);
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            if (!internals.simple(item)) {
                return root.alt(...value);
            }
        }

        return root.valid(root.override, ...value);
    }

    if (value instanceof RegExp) {
        return root.str().pattern(value);
    }

    Assert(Object.getPrototypeOf(value) === Object.prototype, 'Value must be a plain object');

    return root.obj(value);
};

internals.simple = function (value) {

    const type = typeof value;
    return (
        value === null ||
        type === 'number' ||
        type === 'string' ||
        type === 'boolean' ||
        Utils.isResolvable(value)
    );
};

exports.ref = function (value, options) {

    return Utils.isRef(value) ? value : Ref.create(value, options);
};
