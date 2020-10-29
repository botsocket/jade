'use strict';

const Clone = require('@botsocket/bone/src/clone');

const Errors = require('./errors');
const Utils = require('./utils');

const internals = {};

exports.schema = function (schema, value, settings, state, overrides) {

    settings = Utils.settings(settings, schema._settings);
    schema = schema._applyConditions(value, settings, state);

    const def = schema._definition;
    const helpers = {
        schema,
        state,
        settings,
        original: value,
        error: (code, local, divedState, options) => schema.$createError(value, code, settings, divedState || state, local, options),
    };

    // Coerce (Always exit early)

    if (def.coerce &&
        value !== undefined &&
        !settings.strict) {

        const result = def.coerce(value, helpers);
        const errors = Errors.extract(result);
        if (!errors) {
            value = result;
        }
        else {
            return { errors };
        }
    }

    const presence = overrides.presence || schema.$getFlag('presence') || settings.presence;

    // Presence

    if (value === undefined) {
        if (presence === 'required') {
            return { errors: [helpers.error('any.required')] };
        }

        if (presence === 'forbidden') {
            return { value };
        }

        if (presence === 'optional') {
            if (schema.$getFlag('default') !== Utils.symbols.deepDefault) {
                return internals.result(value, helpers);
            }

            value = schema.$isType('object') ? {} : [];
        }
    }

    if (presence === 'forbidden') {
        return { errors: [helpers.error('any.forbidden')] };
    }

    const insensitive = schema.$getFlag('insensitive');

    // Valid values

    const valids = schema._valids;
    if (valids.size) {
        if (valids.has(value, settings, state, insensitive)) {
            return internals.result(value, helpers);
        }

        // Only
        if (schema.$getFlag('only')) {
            return { errors: [helpers.error('any.only', { values: valids.values })] };
        }
    }

    // Invalid values

    if (schema._invalids.has(value, settings, state, insensitive)) {
        return { errors: [helpers.error('any.invalid', { values: schema._invalids.values })] };
    }

    // Base check (Always exit early)

    if (def.validate) {
        const result = def.validate(value, helpers);
        const errors = Errors.extract(result);
        if (!errors) {
            value = result;
        }
        else {
            return { errors };
        }
    }

    // Rules

    const errors = [];
    for (const rule of schema._rules) {
        const ruleDef = def.rules[rule.method];

        if (ruleDef.convert &&
            !settings.strict) { // Skip convert rules

            continue;
        }

        let args = rule.args;
        let errored = false;
        if (rule.refs.length) {
            args = { ...rule.args };

            for (const key of rule.refs) {
                const argDef = ruleDef.args[key];
                const arg = args[key];

                const processed = Utils.processArgs(arg.resolve(value, settings, state), argDef);
                if (processed.message) {
                    errors.push(helpers.error('any.ref', { name: rule.name, ref: arg, message: processed.message }));
                    errored = true;

                    if (settings.abortEarly) {
                        return { errors };
                    }
                }

                args[key] = processed.arg;
            }
        }

        if (errored) {
            continue;
        }

        const result = ruleDef.validate(value, helpers, args, rule);
        const extractedErrors = Errors.extract(result);
        if (!extractedErrors) {
            value = result;
        }
        else {
            errors.push(...extractedErrors);

            if (settings.abortEarly) {
                return { errors };
            }
        }
    }

    const failed = errors.length;

    // Cast

    if (!failed) {
        const cast = schema.$getFlag('cast');

        if (cast) {
            value = def.casts[cast](value, helpers);
        }
    }

    return failed ? { errors } : internals.result(value, helpers);
};

internals.result = function (value, helpers) {

    const { schema, settings, state } = helpers;

    const result = schema.$getFlag('result');
    if (result) {
        return { value: result === 'strip' ? undefined : helpers.original };
    }

    if (value === undefined) {
        const defaultValue = schema.$getFlag('default');
        if (defaultValue === undefined) {
            return { value };
        }

        if (defaultValue[Utils.symbols.callable]) {
            try {
                return { value: defaultValue.fn(Clone(state.ancestors[0]), helpers) };
            }
            catch (error) {
                return { errors: [helpers.error('any.default', { error })] };
            }
        }

        if (Utils.isResolvable(defaultValue)) {
            return { value: defaultValue.resolve(value, settings, state) };
        }

        return { value: defaultValue };
    }

    return { value };
};
