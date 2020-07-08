'use strict';

const Assert = require('@botbind/dust/src/assert');
const Clone = require('@botbind/dust/src/clone');
const Equal = require('@botbind/dust/src/equal');
const IsObject = require('@botbind/dust/src/isObject');
const Merge = require('@botbind/dust/src/merge');

const Compile = require('./compile');
const Blueprint = require('./blueprint');
const State = require('./state');
const Ref = require('./ref');
const Values = require('./values');
const Validate = require('./validate');
const Errors = require('./errors');
const Utils = require('./utils');

const internals = {};

internals.Schema = class {
    constructor() {
        this.type = 'any';

        this._definition = {};
        this._refs = new Ref.Register();
        this._rules = [];
        this._settings = {};
        this._valids = new Values();
        this._invalids = new Values();
        this._flags = {};

        this.$terms = {}; // Hash of arrays of immutable objects
        this.$super = {}; // Behaves like super
        this.$root = null;
    }

    clone() {
        const proto = Object.getPrototypeOf(this);
        return this._assign(Object.create(proto));
    }

    merge(source) {
        if (this === source) {
            return this;
        }

        Assert(Utils.isSchema(source), 'Source must be a valid schema');
        Assert(this.type === 'any' || source.type === 'any' || this.type === source.type, `Cannot merge a ${source.type} schema into a ${this.type} schema`);

        const target = this.clone();

        if (this.type === 'any') {
            target._definition = source._definition;
        }

        if (source.type !== 'any') {
            target.type = source.type;
        }

        // Rules

        for (const rule of source._rules) {
            if (target._definition.rules[rule.method].single !== false) {
                target._rules = target._rules.filter(({ name }) => name !== rule.name);
            }
        }

        target._rules.push(...source._rules);

        // Settings

        target._settings = Utils.settings(target._settings, source._settings);

        // Valids/invalids

        target._valids = target._valids.merge(source._valids, source._invalids);
        target._invalids = target._invalids.merge(source._invalids, source._valids);

        // Flags

        Merge(target._flags, source._flags);

        // Terms

        for (const key of Object.keys(source.$terms)) {
            const terms = source.$terms[key];
            if (!terms) {
                target.$terms[key] = null;
                continue;
            }

            if (!target.$terms[key]) {
                target.$terms[key] = Utils.isValues(terms) ? terms.clone() : [...terms];
                continue;
            }

            const def = target._definition.terms[key];
            if (def.merge) {
                target.$terms[key] = def.merge(target.$terms[key], terms, target, source);
                continue;
            }

            target.$terms[key] = Utils.isValues(terms) ? target.$terms[key].merge(terms) : [...target.$terms[key], ...terms];
        }

        return target.$rebuild();
    }

    describe() {
        return Blueprint.generate(this);
    }

    settings(options) {
        Assert(options.context === undefined, 'Cannot override context');
        internals.assertOptions(options);

        const target = this.clone();

        target._settings = Utils.settings(target._settings, options);
        return target;
    }

    cast(to) {
        Assert(to === false || typeof to === 'string', 'To must be a string or false');
        Assert(to === false || this._definition.casts[to], `Cast to ${to} for type ${this.type} is not supported`);

        return this.$setFlag('cast', to);
    }

    presence(presence) {
        Assert(internals.presence(presence), 'Presence must be optional, required or forbidden');

        return this.$setFlag('presence', presence);
    }

    optional() {
        return this.presence('optional');
    }

    required() {
        return this.presence('required');
    }

    forbidden() {
        return this.presence('forbidden');
    }

    default(value, options = {}) {
        Assert(value !== undefined, 'Value must be provided');
        Assert(typeof value === 'function' || !options.literal, 'Option literal only applies to function value');

        if (typeof value === 'function' &&
            !options.literal) {

            return this.$setFlag('default', { [Utils.symbols.callable]: true, fn: value });
        }

        return this.$setFlag('default', Clone(value, options));
    }

    label(label) {
        Assert(typeof label === 'string', 'Label must be a string');

        return this.$setFlag('label', label);
    }

    only(enabled = true) {
        return this.$setFlag('only', enabled);
    }

    allow(...values) {
        const target = this.clone();

        Values.add(values, target._valids, target._invalids);
        return target.$rebuild();
    }

    valid(...values) {
        const target = this.clone();

        Values.add(values, target._valids, target._invalids);
        target.$setFlag('only', true, { clone: false });
        return target.$rebuild();
    }

    invalid(...values) {
        const target = this.clone();

        Values.add(values, target._invalids, target._valids);
        return target.$rebuild();
    }

    strip(enabled = true) {
        return this.$setFlag('result', enabled ? 'strip' : undefined);
    }

    raw(enabled = true) {
        return this.$setFlag('result', enabled ? 'raw' : undefined);
    }

    switch(subject, ...branches) {
        if (Array.isArray(branches[0])) {
            branches = branches[0];
        }

        const length = branches.length;
        Assert(length, 'Branches must have at least 1 branch');

        let target = this;
        for (let i = 0; i < length; i++) {
            const branch = branches[i];
            Assert(i === length - 1 || branch.otherwise === undefined, 'Option otherwise can only be provided on the last branch');

            target = target.when(subject, { break: true, ...branch }, i === 0);
        }

        return target;
    }

    when(subject, options, _clone = true) {
        Assert(typeof subject === 'string' || Utils.isRef(subject), 'Subject must be a string or a valid reference');
        Assert(options.not === undefined || options.is === undefined, 'Option is and not cannot be provided together');
        Assert(options.then !== undefined || options.otherwise !== undefined, 'Option then or otherwise must be provided');

        let condition = { ...options };
        if (options.not !== undefined) {
            condition = { is: options.not, then: options.otherwise, otherwise: options.then, break: options.break };
        }

        condition.subject = Compile.ref(subject);
        condition.is = condition.is === undefined ? this.$root.invalid(null, 0, false, '') : this.$compile(condition.is);

        for (const key of ['then', 'otherwise']) {
            if (condition[key] === undefined) {
                delete condition[key];
                continue;
            }

            condition[key] = this.$compile(condition[key]);
        }

        const target = _clone ? this.clone() : this;

        target._refs.register(subject);
        target.$terms.conditions.push(condition);
        return target;
    }

    validate(value, options = {}) {
        internals.assertOptions(options);

        const settings = Utils.settings({
            strict: true,
            abortEarly: true,
            allowUnknown: false,
            stripUnknown: false,
            label: 'path',
            presence: 'optional',
        }, options);

        return this.$validate(value, settings, new State());
    }

    attempt(value, options = {}) {
        Assert(options.abortEarly === undefined, 'Option abortEarly only applies to validate()');

        const result = this.validate(value, options);
        if (result.errors) {
            throw result.errors[0];
        }

        return result.value;
    }

    // Extension methods

    $isType(type) {
        return this._definition.bases.has(type);
    }

    $compile(value) {
        return Compile.schema(this.$root, value);
    }

    $getFlag(name) {
        if (this._flags[name] === undefined) {
            const def = this._definition.flags[name];
            return def && def.default;
        }

        return this._flags[name];
    }

    $setFlag(name, value, options = {}) {
        Assert(typeof name === 'string', 'Name must be a string');

        if (Equal(this._flags[name], value)) {
            return this;
        }

        const def = this._definition.flags[name];
        const defaultValue = def && def.default;
        if (Equal(value, defaultValue)) {
            value = undefined;
        }

        const target = options.clone !== false ? this.clone() : this;

        if (value === undefined) {
            delete target._flags[name];
        }
        else {
            target._flags[name] = value;
            target._refs.register(value);
        }

        return target;
    }

    $rebuild() {
        this._refs.reset();

        for (const key of Object.keys(this._flags)) {
            this._register(this._flags[key]);
        }

        for (const rule of this._rules) {
            this._register(rule.args);
        }

        for (const key of Object.keys(this.$terms)) {
            this._register(this.$terms[key], this._definition.terms[key].register);
        }

        if (this._valids.size === 0) {
            this.$setFlag('only', false, { clone: false });
        }

        this._refs.register(this._valids);
        this._refs.register(this._invalids);

        if (this._definition.rebuild) {
            this._definition.rebuild(this);
        }

        return this;
    }

    $references() {
        return this._refs.references();
    }

    $addRule(options) {
        Assert(typeof options.name === 'string', 'Option name must be a string');
        Assert(options.method === undefined || typeof options.method === 'string', 'Option method must be a string');

        const rule = { clone: true, args: {}, ...options };

        const target = rule.clone ? this.clone() : this;
        delete rule.clone;

        rule.method = rule.method || rule.name;
        rule.refs = [];

        const def = target._definition.rules[rule.method];
        Assert(def, `Rule ${rule.method} is not defined`);
        Assert(def.validate, `Rule ${rule.method} does not have a validate function`);

        const keys = Object.keys(rule.args);
        Assert(keys.length === Object.keys(def.args).length, `Invalid arguments for rule ${rule.name}`);

        for (const key of keys) {
            const argDef = def.args[key];
            Assert(argDef, `Argument ${key} is not defined`);

            const arg = rule.args[key];
            if (argDef.ref &&
                Utils.isResolvable(arg)) {

                rule.refs.push(key);
                target._refs.register(arg);
                continue;
            }

            const processed = Utils.processArgs(arg, argDef, key);
            if (processed.message) {
                Assert(false, processed.message);
            }

            if (processed.arg === undefined) {
                delete rule.args[key];
                continue;
            }

            rule.args[key] = processed.arg;
        }

        // Remove dup rules. Single defaults to true
        if (def.single !== false) {
            target._rules = target._rules.filter(({ name }) => name !== rule.name);
        }

        target._rules.push(rule);
        return target;
    }

    $createError(value, code, settings, state, local, options = {}) {
        return Errors.create(this, value, code, settings, state, local || {}, options);
    }

    $validate(value, settings, state, overrides = {}) {
        return Validate.schema(this, value, settings, state, overrides);
    }

    // Private

    _applyConditions(value, settings, state) {
        let schema = this;
        for (const condition of schema.$terms.conditions) {
            const result = condition.is.$validate(condition.subject.resolve(value, settings, state), settings, state);
            let matched = false;

            if (result.errors) {
                if (condition.otherwise) {
                    matched = true;
                    schema = schema.merge(condition.otherwise._applyConditions(value, settings, state));
                }
            }
            else if (condition.then) {
                matched = true;
                schema = schema.merge(condition.then._applyConditions(value, settings, state));
            }

            if (condition.break &&
                matched) {

                break;
            }
        }

        return schema;
    }

    _assign(target) {
        target.type = this.type;
        target._definition = this._definition;
        target._refs = this._refs.clone();
        target._rules = [...this._rules];
        target._settings = { ...this._settings };
        target._valids = this._valids.clone();
        target._invalids = this._invalids.clone();
        target._flags = Clone(this._flags);
        target.$root = this.$root;
        target.$terms = {};

        for (const key of Object.keys(this.$terms)) {
            const terms = this.$terms[key];
            if (terms) {
                target.$terms[key] = Utils.isValues(terms) ? terms.clone() : [...terms];
                continue;
            }

            target.$terms[key] = null;
        }

        target.$super = {};
        for (const key of Object.keys(this.$super)) {
            // Rebound otherwise the method will point to the original extended schema
            target.$super[key] = this._definition.super[key].bind(target);
        }

        return target;
    }

    _register(value, register) {
        if (!IsObject(value)) {
            return;
        }

        if (Utils.isSchema(value) ||
            Utils.isResolvable(value) ||
            Utils.isValues(value)) {

            this._refs.register(value, register);
            return;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                this._register(item, register);
            }

            return;
        }

        for (const key of Object.keys(value)) {
            this._register(value[key], register);
        }
    }
};

internals.Schema.prototype[Utils.symbols.schema] = true;
internals.Schema.prototype.immutable = true;

internals.setup = function () {
    for (const [method, ...aliases] of [
        ['required', 'exists', 'present'],
        ['forbidden', 'absent'],
        ['valid', 'equal', 'is'],
        ['invalid', 'deny', 'disallow', 'not'],
        ['settings', 'options'],
    ]) {

        for (const alias of aliases) {
            internals.Schema.prototype[alias] = internals.Schema.prototype[method];
        }
    }
};

internals.setup();

module.exports = new internals.Schema();

internals.assertOptions = function (options) {
    Assert(options.label === undefined || options.label === 'path' || options.label === 'key', 'Option label must be path or key');
    Assert(options.presence === undefined || internals.presence(options.presence), 'Option presence must be optional, required or forbidden');
};

internals.presence = function (presence) {
    return presence === 'optional' || presence === 'required' || presence === 'forbidden';
};
