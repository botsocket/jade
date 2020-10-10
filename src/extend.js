'use strict';

const Assert = require('@botsocket/bone/src/assert');
const Clone = require('@botsocket/bone/src/clone');

const Errors = require('./errors');
const Utils = require('./utils');

const internals = {};

exports.schema = function (schema, extension) {

    const parent = Object.getPrototypeOf(schema);
    const proto = Clone(parent);
    const target = schema._assign(Object.create(proto));
    const def = Clone(target._definition);

    target.type = extension.type || schema.type;

    if (!def.bases) {
        def.bases = new Set([schema.type]);
    }

    def.bases.add(target.type);
    def.rebuild = internals.rebuild(def.rebuild, extension.rebuild);
    def.coerce = internals.method(def.coerce, extension.coerce);
    def.validate = internals.method(def.validate, extension.validate);
    def.messages = Errors.messages(def.messages, extension.messages);

    if (extension.args) {
        def.args = extension.args;
    }

    if (extension.flags) {
        for (const key of Object.keys(extension.flags)) {
            if (!def.flags) {
                def.flags = {};
            }

            def.flags[key] = { default: extension.flags[key] };
        }
    }

    if (extension.terms) {
        for (const key of Object.keys(extension.terms)) {
            if (!def.terms) {
                def.terms = {};
            }

            Assert(!def.terms[key], `Terms ${key} has already been defined`);

            const term = extension.terms[key];
            target.$terms[key] = term.default;
            def.terms[key] = term;
        }
    }

    if (extension.rules) {
        for (const key of Object.keys(extension.rules)) {
            if (!def.rules) {
                def.rules = {};
            }

            Assert(!def.rules[key], `Rule ${key} has already been defined`);

            const rule = extension.rules[key];

            if (typeof rule.alias === 'string') {
                rule.alias = [rule.alias];
            }

            if (rule.method === undefined) {
                proto[key] = function () {

                    return this.$addRule({ name: key });
                };
            }

            if (typeof rule.method === 'function') {
                proto[key] = rule.method;
            }

            if (rule.alias) {
                for (const alias of rule.alias) {
                    proto[alias] = proto[key];
                }
            }

            if (!rule.args) {
                rule.args = {};
            }

            if (Array.isArray(rule.args)) {
                const args = {};
                for (const arg of rule.args) {
                    args[arg] = {};
                }

                rule.args = args;
            }

            for (const label of Object.keys(rule.args)) {
                const arg = rule.args[label];
                if (Utils.isSchema(arg.assert)) {
                    arg.assert = arg.assert.label(label);
                }
            }

            delete rule.method;
            delete rule.alias;
            def.rules[key] = rule;
        }
    }

    if (extension.overrides) {
        for (const key of Object.keys(extension.overrides)) {
            const method = parent[key];
            Assert(method, `Cannot override missing ${key}`);

            if (!def.super) {
                def.super = {};
            }

            def.super[key] = method;
            target.$super[key] = method.bind(target);
            proto[key] = extension.overrides[key];
        }
    }

    if (extension.casts) {
        def.casts = { ...def.casts, ...extension.casts };
    }

    target._definition = def;
    return target;
};

internals.rebuild = function (target, source) {

    if (!target ||
        !source) {

        return target || source;
    }

    return (schema) => {

        target(schema);
        source(schema);
    };
};

internals.method = function (target, source) {

    if (!target ||
        !source) {

        return target || source;
    }

    return (value, helpers) => {

        const result = target(value, helpers);
        const errors = Errors.extract(result);
        if (!errors) {
            return source(result, helpers);
        }

        return errors;
    };
};
