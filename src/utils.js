'use strict';

let Errors;

exports.symbols = {
    deepDefault: Symbol('deepDefault'),
    callable: Symbol('callable'),
    values: Symbol('values'),
    schema: Symbol('schema'),
    ref: Symbol('ref'),
    template: Symbol('template'),
    override: Symbol('override'),
};

exports.isSchema = function (value) {

    if (!value) {
        return false;
    }

    return Boolean(value[exports.symbols.schema]);
};

exports.isRef = function (value) {

    if (!value) {
        return false;
    }

    return Boolean(value[exports.symbols.ref]);
};

exports.isTemplate = function (value) {

    if (!value) {
        return false;
    }

    return Boolean(value[exports.symbols.template]);
};

exports.isValues = function (value) {

    if (!value) {
        return false;
    }

    return Boolean(value[exports.symbols.values]);
};

exports.isResolvable = function (value) {

    return exports.isRef(value) || exports.isTemplate(value);
};

exports.isNumber = function (value) {

    return typeof value === 'number' && !Number.isNaN(value);
};

exports.compare = function (left, right, operator) {

    switch (operator) {
        case '>': return left > right;
        case '<': return left < right;
        case '>=': return left >= right;
        case '<=': return left <= right;
        case '=': return left === right;
    }
};

exports.settings = function (target, source) {

    Errors = Errors || require('./errors');

    const merged = { ...target, ...source };

    const messages = Errors.messages(target.messages, source.messages);
    if (messages) {
        merged.messages = messages;
    }

    return merged;
};

exports.processArgs = function (arg, def, label) {

    if (def.normalize) {
        arg = def.normalize(arg);
    }

    if (def.assert) {
        if (exports.isSchema(def.assert)) {
            const result = def.assert.validate(arg);
            if (result.errors) {
                return { message: result.errors[0].message };
            }

            arg = result.value;
        }
        else if (!def.assert(arg)) {
            return { message: label ? `${label} ${def.message} or a valid reference` : def.message };
        }
    }

    return { arg };
};
