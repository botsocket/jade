'use strict';

const Assert = require('@botbind/dust/src/assert');

const Template = require('./template');
const Utils = require('./utils');

const internals = {};

exports.create = function (schema, value, code, settings, state, local, options) {

    Assert(typeof code === 'string', 'Code must be a string');

    const messages = { ...schema._definition.messages, ...settings.messages };
    const template = messages[code];

    Assert(template, `Message ${code} is not defined`);
    Assert(!local.label, 'Cannot pass custom label as local');

    if (options.flags !== false) {
        local.label = schema.$getFlag('label');
    }

    if (!local.label) {
        const length = state.keys.length;
        if (length) {
            local.label = settings.label === 'path' ? internals.path(state.keys) : state.keys[length - 1];
        }
        else {
            local.label = 'unknown';
        }
    }

    return new internals.ValidationError(template.resolve(value, settings, state, local), code, state, local);
};

exports.extract = function (result) {

    if (result instanceof internals.ValidationError) {
        return [result];
    }

    if (Array.isArray(result) &&
        result[0] instanceof internals.ValidationError) {

        return result;
    }

    return false;
};

exports.messages = function (target, source) {

    if (!source) {
        return target;
    }

    const messages = { ...target };
    for (const key of Object.keys(source)) {
        const message = source[key];
        messages[key] = Utils.isTemplate(message) ? message : new Template(message);
    }

    return messages;
};

internals.ValidationError = class extends Error {
    constructor(message, code, state, local) {

        super(message);

        this.name = 'ValidationError';
        this.code = code;
        this.state = state;
        this.local = local;
    }
};

internals.path = function (keys) {

    return keys.map((key) => String(key).replace(/\./g, '\\.')).join('.');
};
