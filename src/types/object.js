'use strict';

const Constellation = require('@botbind/constellation');
const Assert = require('@botbind/dust/src/assert');
const Clone = require('@botbind/dust/src/clone');
const IsObject = require('@botbind/dust/src/isObject');
const SplitPath = require('@botbind/dust/src/splitPath');

const Any = require('./any');
const Compile = require('../compile');
const Extend = require('../extend');
const Utils = require('../utils');

const internals = {};

module.exports = Extend.schema(Any, {
    type: 'object',
    terms: {
        keys: {
            default: null,
            blueprint: {
                mapped: { key: 'key', value: 'schema' },
            },

            merge: (target, source) => {
                if (!source.length) {
                    return source;
                }

                const keys = new Map();

                target = [...target];

                for (let i = 0; i < target.length; i++) {
                    keys.set(target[i].key, i);
                }

                for (const { key, schema } of source) {
                    const pos = keys.get(key);
                    if (pos === undefined) {
                        target.push({ key, schema });
                        continue;
                    }

                    target[pos] = { key, schema: target[pos].schema.merge(schema) };
                }

                return target;
            },
        },
        dependencies: { default: [] },
        patterns: { default: [] },
    },
    messages: {
        'object.base': '{#label} must be an object',
        'object.unknown': '{#label} is not allowed',
        'object.length': '{#label} must have {#limit} key(s)',
        'object.min': '{#label} must have at least {#limit} key(s)',
        'object.max': '{#label} must have at most {#limit} key(s)',
        'object.instance': '{#label} must be an instance of {#name}',
        'object.and': '{#label} must contain {[#present.*.label]} with {[#missing.*.label]}',
        'object.nand': '{#label} must not contain all of {[#present.*.label]}',
        'object.or': '{#label} must contain at least one of {[#missing.*.label]}',
        'object.xor': '{#label} must contain exactly one of {[#peers.*.label]}',
        'object.oxor': '{#label} must contain one or none of {[#peers.*.label]}',
        'object.schema': '{#label} must be a valid schema',
        'object.schema.type': '{#label} must be a valid schema of type {#type}',
        'object.values': '{#label} must be a valid values',
        'object.ref': '{#label} must be a valid reference',
        'object.template': '{#label} must be a valid template',
    },

    construct: (schema, terms) => {
        if (terms.keys) {
            schema = schema.keys(terms.keys);
        }

        if (terms.dependencies) {
            for (const { type, peers } of terms.dependencies) {
                schema = internals.dependency(schema, peers, type);
            }
        }

        if (terms.patterns) {
            for (const { key, value } of terms.patterns) {
                schema = schema.pattern(key, value);
            }
        }

        return schema;
    },

    args: (schema, keys) => {
        return schema.keys(keys);
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
        const children = schema.$terms.keys;
        if (!children) {
            return;
        }

        // Call default() on child schemas

        if (schema.$getFlag('default') === Utils.symbols.deepDefault) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.schema.$isType('object')) {
                    child.schema = internals.deepDefault(child.schema);
                }
            }
        }

        // Sort keys

        const sorter = Constellation.sorter();
        const keys = new Map(children.map((child) => [child.key, child]));
        for (const child of children) {
            const references = child
                .schema
                .$references()
                .filter((ref) => keys.has(ref)) // Filter out refs that point to nothing
                .map((ref) => keys.get(ref));

            sorter.add(child, references);
        }

        schema.$terms.keys = sorter.sort();
    },

    validate: (value, { schema, settings, state, error }) => {
        if (!IsObject(value) ||
            Array.isArray(value)) {

            return error('object.base');
        }

        // Allows anything

        if (!schema.$terms.keys &&
            !schema.$terms.patterns.length &&
            !schema.$terms.dependencies.length) {

            return value;
        }

        // Shallow clone
        value = Clone(value, { shallow: false });

        const errors = [];
        const keys = new Set(Object.keys(value));

        // Keys

        if (schema.$terms.keys) {
            for (const { key, schema: childSchema } of schema.$terms.keys) {
                keys.delete(key);

                const item = value[key];
                const divedState = state.dive(value, key);
                const result = childSchema.$validate(item, settings, divedState);

                if (result.errors) {
                    if (settings.abortEarly) {
                        return result.errors;
                    }

                    errors.push(...result.errors);
                    continue;
                }

                if (result.value === undefined) {
                    delete value[key];
                    continue;
                }

                value[key] = result.value;
            }
        }

        // Patterns

        for (const key of keys) {
            const item = value[key];

            for (const { key: keyPattern, value: valuePattern } of schema.$terms.patterns) {
                let result = keyPattern.$validate(key, settings, state);

                if (result.errors) {
                    continue;
                }

                keys.delete(key);

                if (!valuePattern) {
                    continue;
                }

                result = valuePattern.$validate(item, settings, state.dive(value, key));

                if (result.errors) {
                    if (settings.abortEarly) {
                        return result.errors;
                    }

                    errors.push(...result.errors);
                }
            }
        }

        if (settings.stripUnknown) {
            for (const key of keys) {
                delete value[key];
                keys.delete(key);
            }
        }

        let allowUnknown = schema.$getFlag('unknown');
        allowUnknown = allowUnknown === undefined ? settings.allowUnknown : allowUnknown;

        if (!allowUnknown) {
            for (const key of keys) {
                errors.push(error('object.unknown', undefined, state.dive(value, key)));

                if (settings.abortEarly) {
                    return errors;
                }
            }
        }

        // Deps

        for (const { type, peers } of schema.$terms.dependencies) {
            const failed = internals.dependencies(value, peers, settings, state)[type]();
            if (!failed) {
                continue;
            }

            errors.push(error(failed.code, failed.local));

            if (settings.abortEarly) {
                return errors;
            }
        }

        return errors.length ? errors : value;
    },

    rules: {
        unknown: {
            method(enabled = true) {
                return this.$setFlag('unknown', enabled);
            },
        },

        extract: {
            alias: ['get', 'reach'],

            method(path) {
                if (path === undefined) {
                    return this;
                }

                if (!this.$terms.keys) {
                    return undefined;
                }

                const keys = SplitPath(path);
                const currKey = keys.shift();

                const child = this.$terms.keys.find(({ key }) => key === currKey);
                if (!child) {
                    return undefined;
                }

                const schema = child.schema;
                if (!keys.length) {
                    return schema;
                }

                if (!schema.$isType('object')) {
                    return undefined;
                }

                return schema.extract(keys);
            },
        },

        keys: {
            alias: ['of', 'shape', 'entries'],

            method(keys) {
                const target = this.clone();

                if (keys === undefined) {
                    target.$terms.keys = null;
                    return target;
                }

                const keysKeys = Object.keys(keys);
                target.$terms.keys = !target.$terms.keys ? [] : target.$terms.keys.filter((child) => keys[child.key] === undefined);

                const children = keysKeys.map((key) => ({ key, schema: this.$compile(keys[key]) }));
                target.$terms.keys.push(...children);
                return target.$rebuild();
            },
        },

        pattern: {
            method(key, value) {
                Assert(key !== undefined, 'Key pattern must be provided');

                const target = this.clone();
                const pattern = { key: this.$compile(key) };

                if (value !== undefined) {
                    pattern.value = this.$compile(value);
                }

                target.$terms.patterns.push(pattern);
                return target.$rebuild();
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
                if (Utils.compare(Object.keys(value).length, limit, operator)) {
                    return value;
                }

                return error(`object.${name}`, { limit: args.limit });
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

        instance: {
            single: false,
            args: ['ctor'],

            method(ctor) {
                Assert(typeof ctor === 'function', 'Constructor must be a function');

                return this.$addRule({ name: 'instance', args: { ctor } });
            },

            validate: (value, { error }, { ctor }) => {
                if (value instanceof ctor) {
                    return value;
                }

                return error('object.instance', { ctor, name: ctor.name });
            },
        },

        regex: {
            method() {
                return this.instance(RegExp);
            },
        },

        schema: {
            args: ['type', 'options'],

            method(type = 'any', options = {}) {
                Assert(typeof type === 'string', 'Type must be a string');

                return this.$addRule({ name: 'schema', args: { type, options } });
            },

            validate: (value, { error }, { type, options }) => {
                if (Utils.isSchema(value)) {
                    const isType = options.allowBase ? value.$isType(type) : value.type === type;
                    if (type === 'any' ||
                        isType) {

                        return value;
                    }
                }

                if (type === 'any') {
                    return error('object.schema');
                }

                return error('object.schema.type', { type });
            },
        },

        values: {
            validate: (value, { error }) => {
                if (Utils.isValues(value)) {
                    return value;
                }

                return error('object.values');
            },
        },

        ref: {
            validate: (value, { error }) => {
                if (Utils.isRef(value)) {
                    return value;
                }

                return error('object.ref');
            },
        },

        template: {
            validate: (value, { error }) => {
                if (Utils.isTemplate(value)) {
                    return value;
                }

                return error('object.template');
            },
        },

        and: {
            method(...peers) {
                return internals.dependency(this, peers, 'and');
            },
        },

        nand: {
            method(...peers) {
                return internals.dependency(this, peers, 'nand');
            },
        },

        or: {
            method(...peers) {
                return internals.dependency(this, peers, 'or');
            },
        },

        xor: {
            method(...peers) {
                return internals.dependency(this, peers, 'xor');
            },
        },

        oxor: {
            method(...peers) {
                return internals.dependency(this, peers, 'oxor');
            },
        },
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

    casts: {
        map: (value) => new Map(Object.entries(value)),
    },
});

internals.deepDefault = function (schema) {
    if (schema.$getFlag('default') !== undefined) { // Does not process if already has default
        return schema;
    }

    if (!schema.$terms.keys) {
        return schema;
    }

    for (let i = 0; i < schema.$terms.keys.length; i++) {
        const child = schema.$terms.keys[i];

        if (child.schema.$isType('object')) {
            child.schema = internals.deepDefault(child.schema);
        }

        if (child.schema.$getFlag('default') !== undefined) {
            return schema.default();
        }
    }

    return schema;
};

internals.dependencies = function (value, peers, settings, state) {
    return {
        and: () => {
            const missing = [];
            const present = [];
            for (const peer of peers) {
                if (peer.resolve(value, settings, state) === undefined) {
                    missing.push(peer.context);
                }
                else {
                    present.push(peer.context);
                }
            }

            const length = peers.length;
            if (missing.length !== length &&
                present.length !== length) {

                return {
                    code: 'object.and',
                    local: { present, missing },
                };
            }
        },

        nand: () => {
            const present = [];
            for (const peer of peers) {
                if (peer.resolve(value, settings, state) === undefined) {
                    return;
                }

                present.push(peer.context);
            }

            return {
                code: 'object.nand',
                local: { present },
            };
        },

        or: () => {
            const missing = [];
            for (const peer of peers) {
                if (peer.resolve(value, settings, state) !== undefined) {
                    return;
                }

                missing.push(peer.context);
            }

            return {
                code: 'object.or',
                local: { missing },
            };
        },

        xor: () => {
            const present = [];
            const peerContexts = [];
            for (const peer of peers) {
                if (peer.resolve(value, settings, state) !== undefined) {
                    present.push(peer.context);
                }

                peerContexts.push(peer.context);
            }

            if (present.length === 1) {
                return;
            }

            return {
                code: 'object.xor',
                local: { peers: peerContexts, present },
            };
        },

        oxor: () => {
            const present = [];
            const peerContexts = [];
            for (const peer of peers) {
                if (peer.resolve(value, settings, state) !== undefined) {
                    present.push(peer.context);
                }

                peerContexts.push(peer.context);
            }

            if (present.length === 1 ||
                !present.length) {

                return;
            }

            return {
                code: 'object.oxor',
                local: { peers: peerContexts, present },
            };
        },
    };
};

internals.dependency = function (schema, peers, type) {
    Assert(peers.length, 'Peers must have at least one peer');

    const target = schema.clone();

    const dependency = { type, peers: [] };
    for (const peer of peers) {
        Assert(typeof peer === 'string', 'Peer must be a string');

        dependency.peers.push(new internals.Peer(schema, peer));
    }

    target.$terms.dependencies.push(dependency);
    return target;
};

internals.Peer = class {
    constructor(schema, peer) {
        this.ref = Compile.ref(peer, { ancestor: 0, prefix: false });
        this.context = { path: peer, label: peer };

        this.label(schema);
    }

    label(schema) {
        const child = schema.extract(this.context.path);
        if (!child) {
            return;
        }

        const label = child.$getFlag('label');
        if (!label) {
            return;
        }

        this.context.label = label;
    }

    resolve(value, settings, state) {
        return this.ref.resolve(value, settings, state);
    }

    describe() {
        return this.context.path;
    }
};
