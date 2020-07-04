'use strict';

const Assert = require('@botbind/dust/src/assert');
const Clone = require('@botbind/dust/src/clone');
const IsObject = require('@botbind/dust/src/isObject');

const Ref = require('./ref');
const Template = require('./template');
const Utils = require('./utils');

const internals = {};

exports.generate = function (schema) {
    const blueprint = { type: schema.type, flags: {} };

    // Valids/invalids

    if (schema._valids.size) {
        blueprint.allows = schema._valids.describe();
    }

    if (schema._invalids.size) {
        blueprint.invalids = schema._invalids.describe();
    }

    // Settings

    if (Object.keys(schema._settings).length) {
        blueprint.settings = Clone(schema._settings);

        const messages = blueprint.settings.messages;
        if (messages) {
            for (const code of Object.keys(messages)) {
                messages[code] = messages[code].describe();
            }
        }
    }

    // Flags

    for (const key of Object.keys(schema._flags)) {
        if (key[0] === '_') {
            continue;
        }

        blueprint.flags[key] = internals.describe(schema._flags[key]);
    }

    if (!Object.keys(blueprint.flags).length) {
        delete blueprint.flags;
    }

    // Rules

    for (const { name, args } of schema._rules) {
        if (!blueprint.rules) {
            blueprint.rules = [];
        }

        const rule = { name };
        for (const key of Object.keys(args)) {
            if (!rule.args) {
                rule.args = {};
            }

            rule.args[key] = internals.describe(args[key], { arg: true });
        }

        blueprint.rules.push(rule);
    }

    // Terms

    for (const key of Object.keys(schema.$terms)) {
        const def = schema._definition.terms[key];
        Assert(def, `Terms ${key} is not defined`);

        if (key[0] === '_') {
            continue;
        }

        Assert(!blueprint[key], 'Cannot generate blueprint for this schema due to internal key conflicts');

        const terms = schema.$terms[key];
        if (!terms) {
            continue;
        }

        if (Utils.isValues(terms)) {
            if (terms.size) {
                blueprint[key] = terms.describe();
            }

            continue;
        }

        if (!terms.length &&
            !def.blueprint) {

            continue;
        }

        const normalized = terms.map(internals.describe);

        if (def.blueprint) {
            const { key: mapKey, value } = def.blueprint.mapped;

            blueprint[key] = {};
            for (const term of normalized) {
                blueprint[key][term[mapKey]] = term[value];
            }

            continue;
        }

        blueprint[key] = normalized;
    }

    return blueprint;
};

internals.describe = function (value, options = {}) {
    if (value === Utils.symbols.deepDefault) {
        return { deep: true };
    }

    if (!IsObject(value)) {
        return options.arg ? { value } : value;
    }

    if (value[Utils.symbols.callable]) {
        return { callable: value.fn };
    }

    if (Utils.isSchema(value)) {
        return { schema: value.describe() };
    }

    if (typeof value.describe === 'function') {
        return value.describe();
    }

    if (options.arg) {
        return { value: Clone(value) };
    }

    if (value instanceof RegExp) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(internals.describe);
    }

    const blueprint = {};
    for (const key of Object.keys(value)) {
        blueprint[key] = internals.describe(value[key]);
    }

    return blueprint;
};

exports.construct = function (root, blueprint) {
    return new internals.Constructor(root).parse(blueprint);
};

internals.Constructor = class {
    constructor(root) {
        this.root = root;
    }

    parse(blueprint) {
        Assert(this.root[blueprint.type], 'Invalid blueprint type');

        // Type

        let schema = this.root[blueprint.type]();

        // Valids/invaids

        if (blueprint.allows) {
            schema = schema.allow(...this.construct(blueprint.allows));
        }

        if (blueprint.invalids) {
            schema = schema.invalid(...this.construct(blueprint.invalids));
        }

        // Settings

        if (blueprint.settings) {
            schema = schema.settings(this.construct(blueprint.settings));
        }

        // Flags

        if (blueprint.flags) {
            for (const key of Object.keys(blueprint.flags)) {
                schema = schema.$setFlag(key, this.construct(blueprint.flags[key]));
            }
        }

        // Rules

        if (blueprint.rules) {
            for (const rule of blueprint.rules) {
                Assert(schema[rule.name], `Invalid rule name ${rule.name} for type ${blueprint.type}`);

                const args = [];
                if (rule.args) {
                    for (const key of Object.keys(rule.args)) {
                        args.push(this.construct(rule.args[key]));
                    }
                }

                schema = schema[rule.name](...args);
            }
        }

        const def = schema._definition;
        const terms = {};
        for (const key of Object.keys(blueprint)) {
            if (['type', 'allows', 'invalids', 'settings', 'flags', 'rules'].includes(key)) {
                continue;
            }

            Assert(def.terms[key], `Terms ${key} is not defined`);

            terms[key] = this.construct(blueprint[key]);
        }

        return def.construct(schema, terms);
    }

    construct(blueprint) {
        if (!IsObject(blueprint)) {
            return blueprint;
        }

        if (Array.isArray(blueprint)) {
            return blueprint.map((item) => this.construct(item));
        }

        if (blueprint instanceof RegExp) {
            return blueprint;
        }

        if (Object.keys(blueprint).length === 1) {
            if (blueprint.override) {
                return Utils.symbols.override;
            }

            if (blueprint.value !== undefined) {
                return Clone(blueprint.value);
            }

            if (blueprint.schema) {
                return this.parse(blueprint.schema);
            }

            if (blueprint.callable) {
                return { [Utils.symbols.callable]: true, fn: blueprint.callable };
            }

            if (blueprint.ref) {
                return Ref.build(blueprint.ref);
            }

            if (blueprint.template) {
                return Template.build(blueprint.template);
            }

            if (blueprint.deep) {
                return Utils.symbols.deepDefault;
            }
        }

        const normalized = {};
        for (const key of Object.keys(blueprint)) {
            normalized[key] = this.construct(blueprint[key]);
        }

        return normalized;
    }
};
