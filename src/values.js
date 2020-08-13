'use strict';

const Assert = require('@botbind/dust/src/assert');
const Equal = require('@botbind/dust/src/equal');

const Utils = require('./utils');

const internals = {};

module.exports = internals.Values = class {
    constructor(values, refs) {

        this._values = new Set(values);
        this._refs = new Set(refs);
        this._insensitives = new Map();

        this._override = false;

        this._mapInsensitives();
    }

    _mapInsensitives() {

        for (const value of this._values) {
            if (typeof value === 'string') {
                this._insensitives.set(value.toLowerCase(), value);
            }
        }
    }

    get size() {

        return this._values.size + this._refs.size;
    }

    get values() {

        return [...this._values, ...this._refs];
    }

    clone() {

        const values = new internals.Values(this._values, this._refs);
        values._override = this._override;
        return values;
    }

    override() {

        this._override = true;
        this._values.clear();
        this._refs.clear();
        this._insensitives.clear();
    }

    merge(source, remove) {

        Assert(Utils.isValues(source), 'Source must be a valid values');
        Assert(remove === undefined || Utils.isValues(remove), 'Remove must be a valid values');

        if (source._override) {
            return source.clone();
        }

        for (const value of source.values) {
            this.add(value);
        }

        if (remove) {
            for (const value of remove.values) {
                this.delete(value);
            }
        }

        return this;
    }

    add(item) {

        if (Utils.isResolvable(item)) {
            if (!this._refs.has(item)) {
                this._refs.add(item);
            }

            return;
        }

        if (!this.has(item)) {
            this._values.add(item);

            if (typeof item === 'string') {
                this._insensitives.set(item.toLowerCase(), item);
            }
        }

        return this;
    }

    delete(item) {

        if (Utils.isResolvable(item)) {
            this._refs.delete(item);
        }
        else {
            this._values.delete(item);

            if (typeof item === 'string') {
                this._insensitives.delete(item.toLowerCase());
            }
        }

        return this;
    }

    has(value, settings, state, insensitive) {

        if (!this.size) {
            return false;
        }

        if (this._values.has(value)) {
            return true;
        }

        if (typeof value === 'string' &&
            insensitive &&
            this._insensitives.has(value.toLowerCase())) {

            return true;
        }

        for (const v of this._values) {
            if (Equal(v, value)) {
                return true;
            }
        }

        if (!settings) {
            return false; // Values only search
        }

        for (const ref of this._refs) {
            const resolved = ref.resolve(value, settings, state);
            if (resolved === undefined) {
                continue;
            }

            let items;
            if (ref._in &&
                typeof resolved === 'object') {

                items = Array.isArray(resolved) ? resolved : Object.keys(resolved);
            }
            else {
                items = [resolved];
            }

            if (ref._in &&
                Array.isArray(resolved)) {

                items = [...resolved];
            }

            for (const item of items) {
                if (insensitive &&
                    typeof value === 'string' &&
                    typeof item === 'string' &&
                    value.toLowerCase() === item.toLowerCase()) {

                    return true;
                }

                if (Equal(item, value)) {
                    return true;
                }
            }
        }

        return false;
    }

    describe() {

        const desc = [];

        if (this._override) {
            desc.push({ override: true });
        }

        for (const value of this._values) {
            desc.push(typeof value === 'object' ? { value } : value);
        }

        for (const ref of this._refs) {
            desc.push(ref.describe());
        }

        return desc;
    }

    static add(values, target, other) {

        Assert(values.length, 'Values must have at least a value');

        const override = values[0] === Utils.symbols.override;
        if (override) {
            values = values.slice(1);
            target.override();
        }

        for (const value of values) {
            Assert(value !== Utils.symbols.override, 'Override must be the first value');

            target.add(value);
            other.delete(value);
        }
    }
};

internals.Values.prototype[Utils.symbols.values] = true;
