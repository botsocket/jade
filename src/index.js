'use strict';

const Assert = require('@botbind/dust/src/assert');

const Compile = require('./compile');
const Values = require('./values');
const Ref = require('./ref');
const Template = require('./template');
const Extend = require('./extend');
const Utils = require('./utils');

let Schemas;

const internals = {
    types: {
        any: require('./types/any'),
        alternatives: require('./types/alternatives'),
        boolean: require('./types/boolean'),
        string: require('./types/string'),
        date: require('./types/date'),
        number: require('./types/number'),
        array: require('./types/array'),
        function: require('./types/function'),
        object: require('./types/object'),
    },
};

internals.root = function () {

    const root = {};
    root._types = new Set(Object.keys(internals.types));
    root._aliases = {
        bool: 'boolean',
        str: 'string',
        alt: 'alternatives',
        num: 'number',
        fn: 'function',
        arr: 'array',
        obj: 'object',
    };

    // Types

    for (const type of root._types) {
        root[type] = function (...args) {

            return internals.create(internals.types[type], this, args);
        };
    }

    internals.assignAliases(root);

    // Shortcuts

    for (const method of [
        'allow', 'rule', 'custom', 'invalid', 'disallow', 'deny', 'not', 'valid', 'equal', 'is', 'required', 'exists', 'present',
        'forbidden', 'absent', 'optional', 'only', 'settings', 'options', 'strip', 'when', 'switch',
    ]) {

        root[method] = function (...args) {

            return this.any()[method](...args);
        };
    }

    // Methods

    root.values = function (values, refs) {

        return new Values(values, refs);
    };

    root.template = function (source, options) {

        return new Template(source, options);
    };

    root.ref = function (path, options) {

        return Ref.create(path, options);
    };

    root.in = function (path, options = {}) {

        Assert(options.in === undefined, 'Option in cannot be provided when using Lyra.in()');

        return Ref.create(path, { ...options, in: true });
    };

    root.isSchema = Utils.isSchema;
    root.isValues = Utils.isValues;
    root.isRef = Utils.isRef;
    root.isTemplate = Utils.isTemplate;
    root.isResolvable = Utils.isResolvable;

    root.compile = function (value) {

        return Compile.schema(this, value);
    };

    root.extend = function (...extensions) {

        Schemas = Schemas || require('./schemas');
        extensions = Schemas.extensions.attempt(extensions);

        const newRoot = { ...this };
        newRoot._types = new Set(newRoot._types);
        newRoot._aliases = { ...newRoot._aliases };

        for (let extension of extensions) {
            if (typeof extension === 'function') {
                extension = extension(newRoot);
            }

            extension = Schemas.extension.attempt(extension);

            const expanded = internals.expandExtension(newRoot, extension);
            for (const item of expanded) {
                const type = item.type;
                Assert(!newRoot[type] || newRoot._types.has(type) || newRoot._aliases[type], `Invalid extension ${type}`);

                newRoot._types.add(type);
                delete newRoot._aliases[type];

                const base = item.from || newRoot.any();
                const extended = Extend.schema(base, item);
                newRoot[type] = function (...args) {

                    return internals.create(extended, this, args);
                };

                if (item.alias) {
                    for (const alias of item.alias) {
                        Assert(!newRoot[alias] || newRoot._aliases[alias], `Invalid alias ${alias}`);

                        newRoot._aliases[alias] = type;
                    }
                }

                internals.assignAliases(newRoot);
            }
        }

        return newRoot;
    };

    // Symbols

    root.override = Utils.symbols.override;

    return root;
};

internals.create = function (schema, root, args) {

    schema.$root = root;

    if (schema._definition.args &&
        args.length) {

        return schema._definition.args(schema, ...args);
    }

    return schema;
};

internals.assignAliases = function (root) {

    for (const alias of Object.keys(root._aliases)) {
        root[alias] = root[root._aliases[alias]];
    }
};

internals.expandExtension = function (root, extension) {

    let types = [];
    if (Array.isArray(extension.type)) {
        if (extension.type.length === 1) {
            return [{ ...extension, type: extension.type[0] }];
        }

        types = extension.type;
    }
    else {
        for (const type of root._types) {
            if (extension.type.test(type)) {
                types.push(type);
            }
        }
    }

    const expanded = [];
    for (const type of types) {
        Assert(root[type], `Type ${type} is not defined`);

        const item = { ...extension };
        item.type = type;
        item.from = root[type]();
        expanded.push(item);
    }

    return expanded;
};

module.exports = internals.root();
