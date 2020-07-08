'use strict';

const Lyra = require('../../src');
const Utils = require('../utils');

describe('object()', () => {
    it('should validate objects', () => {
        const schema = Lyra.obj();

        Utils.validate(schema, [
            { value: {} },
            { value: new Date() },
            { value: new RegExp() },
            {
                value: [],
                error: {
                    code: 'object.base',
                    message: 'unknown must be an object',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should coerce to objects', () => {
        const schema = Lyra.obj().convert();

        Utils.validate(schema, [
            {
                value: '{}',
                output: {},
            },
            {
                value: '{ "a": 1 }',
                output: { a: 1 },
            },
            {
                value: 1,
                error: {
                    code: 'object.base',
                    message: 'unknown must be an object',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 'x',
                error: {
                    code: 'object.base',
                    message: 'unknown must be an object',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should use keys for labels', () => {
        const schema = Lyra.obj({ a: { b: 'x' } }).settings({ label: 'key' });

        Utils.validate(schema, [
            {
                value: { a: { b: 'y' } },
                error: {
                    code: 'any.only',
                    message: 'b must be x',
                    local: { values: ['x'], label: 'b' },
                },
            },
        ]);
    });

    it('should not trigger deep default is a value is passed to default()', () => {
        const schema = Lyra.obj({ a: 'x' }).default(1);

        Utils.validate(schema, [{ output: 1 }]);
    });

    it('should cast to maps', () => {
        Utils.validate(Lyra.obj().cast('map'), [
            {
                value: { x: 1, y: 'x' },
                output: new Map([
                    ['x', 1],
                    ['y', 'x'],
                ]),
            },
        ]);

        Utils.validate(Lyra.obj({}).cast('map'), [
            {
                value: {},
                output: new Map(),
            },
        ]);

        Utils.validate(Lyra.obj({ x: 'x' }).cast('map'), [
            {
                value: { x: 'x' },
                output: new Map([['x', 'x']]),
            },
        ]);
    });

    describe('unknown()', () => {
        it('should allow unknown keys', () => {
            const schema = Lyra.obj({ a: 'x' }).unknown();

            Utils.validate(schema, [{ value: { a: 'x', b: 'y' } }]);
        });

        it('should allow unknown patterns', () => {
            const schema = Lyra.obj()
                .pattern(/abc(.*)/)
                .unknown();

            Utils.validate(schema, [{ value: { abc: 'x' } }, { value: { a: 'x' } }]);
        });

        it('should avoid cloning when called twice', () => {
            const schema = Lyra.obj().unknown();

            expect(schema.unknown()).toBe(schema);
        });

        it('should not allow unknown keys for nested objects', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: {
                    c: 'x',
                },
            }).unknown();

            Utils.validate(schema, [
                { value: { a: 'x', b: { c: 'x' }, d: 'y' } },
                {
                    value: {
                        a: 'x',
                        b: { c: 'x', d: 'y' },
                    },
                    error: {
                        code: 'object.unknown',
                        message: 'b.d is not allowed',
                        local: { label: 'b.d' },
                    },
                },
            ]);
        });

        it('should disable unknown', () => {
            const schema = Lyra.obj({ a: 'x' }).unknown().unknown(false);

            Utils.validate(schema, [
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should override allowUnknown set via options', () => {
            const schema = Lyra.obj({ a: 'x' }).unknown(false);

            Utils.validate(schema, { allowUnknown: true }, [
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);
        });
    });

    describe('extract()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj({}).extract(1)).toThrow('Path must be a non-empty string');
        });

        it('should return the current schema if path is not provided', () => {
            const schema = Lyra.obj();

            expect(schema.extract()).toBe(schema);
        });

        it('should extract schema', () => {
            const a = Lyra.str();
            const b = Lyra.obj({ a });

            expect(b.extract('a')).toBe(a);
        });

        it('should extract deeply', () => {
            const a = Lyra.str();
            const b = Lyra.obj({
                a: { b: a },
            });

            expect(b.extract('a.b')).toBe(a);
        });

        it('should escape "."', () => {
            const a = Lyra.str();
            const b = Lyra.obj({ 'a.b': a });

            expect(b.extract('a\\.b')).toBe(a);
        });

        it('should extract schemas that allow any keys', () => {
            expect(Lyra.obj().extract('a.b.c.d.e')).toBe(undefined);
        });

        it('should extract schemas that allow no keys', () => {
            expect(Lyra.obj({}).extract('a.b.c.d.e')).toBe(undefined);
        });

        it('should extract non-object schemas', () => {
            const schema = Lyra.obj({ a: Lyra.num() });

            expect(schema.extract('a.b')).toBe(undefined);
        });

        it('should extract non-native objects', () => {
            const custom = Lyra.extend({
                type: 'test',
                from: Lyra.obj(),
            });

            const a = custom.num();
            const b = custom.obj({ a: custom.test({ b: a }) });

            expect(b.extract('a.b')).toBe(a);
        });
    });

    describe('keys()', () => {
        it('should allow any keys', () => {
            const schema = Lyra.obj().keys();

            Utils.validate(schema, [{ value: {} }, { value: { a: 'x' } }]);
        });

        it('should reject all keys', () => {
            const schema = Lyra.obj({});

            Utils.validate(schema, [
                { value: {} },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.unknown',
                        message: 'a is not allowed',
                        local: { label: 'a' },
                    },
                },
            ]);
        });

        it('should set keys via multiple calls', () => {
            const schema = Lyra.obj({
                a: Lyra.num(),
                b: 'x',
            }).keys({
                a: Lyra.str(),
                c: 'y',
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x', c: 'y' } },
                {
                    value: { a: 1 },
                    error: {
                        code: 'string.base',
                        message: 'a must be a string',
                        local: { label: 'a' },
                    },
                },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { c: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'c must be y',
                        local: { values: ['y'], label: 'c' },
                    },
                },
            ]);
        });

        it('should collect all errors', () => {
            const schema = Lyra.obj({
                a: Lyra.num(),
                b: {
                    c: 'x',
                    d: Lyra.num().integer().min(1),
                },
            }).settings({ abortEarly: false });

            Utils.validate(schema, [
                {
                    value: {
                        a: 'x',
                        b: {
                            c: 'y',
                            d: 0.5,
                        },
                        e: 1,
                    },
                    error: [
                        {
                            code: 'number.base',
                            message: 'a must be a number',
                            local: { label: 'a' },
                        },
                        {
                            code: 'any.only',
                            message: 'b.c must be x',
                            local: { values: ['x'], label: 'b.c' },
                        },
                        {
                            code: 'number.integer',
                            message: 'b.d must be an integer',
                            local: { label: 'b.d' },
                        },
                        {
                            code: 'number.min',
                            message: 'b.d must be greater than or equal to 1',
                            local: { limit: 1, label: 'b.d' },
                        },
                        {
                            code: 'object.unknown',
                            message: 'e is not allowed',
                            local: { label: 'e' },
                        },
                    ],
                },
            ]);
        });

        it('should not use parent label for unknown keys', () => {
            const schema = Lyra.obj({
                a: Lyra.str(),
            }).label('Options');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                {
                    value: 'x',
                    error: {
                        code: 'object.base',
                        message: 'Options must be an object',
                        local: { label: 'Options' },
                    },
                },
                {
                    value: { b: 'x' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);
        });
    });

    describe('pattern()', () => {
        it('should set patterns', () => {
            const schema = Lyra.obj().pattern(/abc(.*)/, 'x');

            Utils.validate(schema, [
                { value: { abc: 'x' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.unknown',
                        message: 'a is not allowed',
                        local: { label: 'a' },
                    },
                },
                {
                    value: { abc: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'abc must be x',
                        local: { values: ['x'], label: 'abc' },
                    },
                },
            ]);
        });

        it('should set patterns via multiple calls', () => {
            const schema = Lyra.obj()
                .pattern(/abc(.*)/, 'x')
                .pattern(/xyz(.*)/, 'y');

            Utils.validate(schema, [
                { value: { abc: 'x', xyz: 'y' } },
                {
                    value: { abc: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'abc must be x',
                        local: { values: ['x'], label: 'abc' },
                    },
                },
                {
                    value: { xyz: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'xyz must be y',
                        local: { values: ['y'], label: 'xyz' },
                    },
                },
            ]);
        });

        it('should support in references for key patterns', () => {
            const schema = Lyra.obj({
                a: Lyra.arr(Lyra.str()),
                b: Lyra.obj().pattern(Lyra.in('a'), Lyra.str()),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'x',
                            b: 'y',
                        },
                    },
                },
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'x',
                            b: 1,
                        },
                    },
                    error: {
                        code: 'string.base',
                        message: 'b.b must be a string',
                        local: { label: 'b.b' },
                    },
                },
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'x',
                            c: 'z',
                        },
                    },
                    error: {
                        code: 'object.unknown',
                        message: 'b.c is not allowed',
                        local: { label: 'b.c' },
                    },
                },
            ]);
        });

        it('should support in references for both key and value patterns', () => {
            const ref = Lyra.in('...a');
            const schema = Lyra.obj({
                a: Lyra.arr(Lyra.str()),
                b: Lyra.obj().pattern(Lyra.in('a'), ref),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'a',
                            b: 'b',
                        },
                    },
                },
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'b',
                            b: 'a',
                        },
                    },
                },
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'a',
                            b: 'a',
                        },
                    },
                },
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'a',
                            b: 1,
                        },
                    },
                    error: {
                        code: 'any.only',
                        message: 'b.b must be "...a"',
                        local: { label: 'b.b', values: [ref] },
                    },
                },
                {
                    value: {
                        a: ['a', 'b'],
                        b: {
                            a: 'a',
                            c: 'b',
                        },
                    },
                    error: {
                        code: 'object.unknown',
                        message: 'b.c is not allowed',
                        local: { label: 'b.c' },
                    },
                },
            ]);
        });

        it('should support templates', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: Lyra.obj().pattern(Lyra.template('prefix-{a}'), Lyra.str()),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 'x',
                        b: { 'prefix-x': 'x' },
                    },
                },
                {
                    value: {
                        a: 'x',
                        b: { 'prefix-y': 'x' },
                    },
                    error: {
                        code: 'object.unknown',
                        message: 'b.prefix-y is not allowed',
                        local: { label: 'b.prefix-y' },
                    },
                },
            ]);
        });

        it('should allow only key patterns', () => {
            const schema = Lyra.obj().pattern(/abc(.*)/);

            Utils.validate(schema, [
                { value: { abc: 'x' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.unknown',
                        message: 'a is not allowed',
                        local: { label: 'a' },
                    },
                },
            ]);
        });

        it('should collect all errors', () => {
            const schema = Lyra.obj()
                .pattern(/abc(.*)/, Lyra.num().integer().min(1))
                .pattern(/xyz(.*)/, 'x')
                .settings({ abortEarly: false });

            Utils.validate(schema, [
                {
                    value: { abc: 0.5, xyz: 'y', d: 1 },
                    error: [
                        {
                            code: 'number.integer',
                            message: 'abc must be an integer',
                            local: { label: 'abc' },
                        },
                        {
                            code: 'number.min',
                            message: 'abc must be greater than or equal to 1',
                            local: { limit: 1, label: 'abc' },
                        },
                        {
                            code: 'any.only',
                            message: 'xyz must be x',
                            local: { values: ['x'], label: 'xyz' },
                        },
                        {
                            code: 'object.unknown',
                            message: 'd is not allowed',
                            local: { label: 'd' },
                        },
                    ],
                },
            ]);
        });
    });

    describe('length()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().length('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.obj().length(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should set length', () => {
            const schema = Lyra.obj().length(2);

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.length',
                        message: 'unknown must have 2 key(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support reference', () => {
            const ref = Lyra.ref('a');
            const schema = Lyra.obj({
                a: 2,
                b: Lyra.obj().length(ref),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 2,
                        b: { a: 'x', b: 'x' },
                    },
                },
                {
                    value: {
                        a: 2,
                        b: { a: 'x' },
                    },
                    error: {
                        code: 'object.length',
                        message: 'b must have "a" key(s)',
                        local: { limit: ref, label: 'b' },
                    },
                },
            ]);
        });

        it('should throw on invalid reference', () => {
            const ref = Lyra.ref('a');
            const schema = Lyra.obj({
                a: 'x',
                b: Lyra.obj().length(ref),
            });

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: {} },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "length" references "a" which must be a number',
                        local: {
                            ref,
                            name: 'length',
                            message: 'must be a number',
                            label: 'b',
                        },
                    },
                },
            ]);
        });

        it('should override length', () => {
            const schema = Lyra.obj().length(1).length(2);

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.length',
                        message: 'unknown must have 2 key(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('max()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().max('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.obj().max(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should set max length', () => {
            const schema = Lyra.obj().max(2);

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x', b: 'x', c: 'x' },
                    error: {
                        code: 'object.max',
                        message: 'unknown must have at most 2 key(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support reference', () => {
            const ref = Lyra.ref('a');
            const schema = Lyra.obj({
                a: 2,
                b: Lyra.obj().max(ref),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 2,
                        b: { a: 'x', b: 'x' },
                    },
                },
                {
                    value: {
                        a: 2,
                        b: { a: 'x' },
                    },
                },
                {
                    value: {
                        a: 2,
                        b: { a: 'x', b: 'x', c: 'x' },
                    },
                    error: {
                        code: 'object.max',
                        message: 'b must have at most "a" key(s)',
                        local: { limit: ref, label: 'b' },
                    },
                },
            ]);
        });

        it('should throw on invalid reference', () => {
            const ref = Lyra.ref('a');
            const schema = Lyra.obj({
                a: 'x',
                b: Lyra.obj().max(ref),
            });

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: {} },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "max" references "a" which must be a number',
                        local: {
                            ref,
                            name: 'max',
                            message: 'must be a number',
                            label: 'b',
                        },
                    },
                },
            ]);
        });

        it('should override max length', () => {
            const schema = Lyra.obj().max(1).max(2);

            Utils.validate(schema, [{ value: { a: 'x', b: 'x' } }, { value: { a: 'x' } }]);
        });
    });

    describe('min()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().min('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.obj().min(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should set min length', () => {
            const schema = Lyra.obj().min(2);

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x', c: 'x' } },
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.min',
                        message: 'unknown must have at least 2 key(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support reference', () => {
            const ref = Lyra.ref('a');
            const schema = Lyra.obj({
                a: 2,
                b: Lyra.obj().min(ref),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 2,
                        b: { a: 'x', b: 'x' },
                    },
                },
                {
                    value: {
                        a: 2,
                        b: { a: 'x', b: 'x', c: 'x' },
                    },
                },
                {
                    value: {
                        a: 2,
                        b: { a: 'x' },
                    },
                    error: {
                        code: 'object.min',
                        message: 'b must have at least "a" key(s)',
                        local: { limit: ref, label: 'b' },
                    },
                },
            ]);
        });

        it('should throw on invalid reference', () => {
            const ref = Lyra.ref('a');
            const schema = Lyra.obj({
                a: 'x',
                b: Lyra.obj().min(ref),
            });

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: {} },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "min" references "a" which must be a number',
                        local: {
                            ref,
                            name: 'min',
                            message: 'must be a number',
                            label: 'b',
                        },
                    },
                },
            ]);
        });

        it('should override min length', () => {
            const schema = Lyra.obj().min(1).min(2);

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.min',
                        message: 'unknown must have at least 2 key(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('instance()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().instance(1)).toThrow('Constructor must be a function');
        });

        it('should validate class instances', () => {
            class X { }

            const a = new X();
            const schema = Lyra.obj().instance(X);

            Utils.validate(schema, [
                { value: a },
                {
                    value: {},
                    error: {
                        code: 'object.instance',
                        message: 'unknown must be an instance of X',
                        local: { ctor: X, name: 'X', label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate multiple class instances', () => {
            class X { }

            class Y extends X { }

            class Z extends X { }

            const b = new Y();
            const c = new Z();
            const schema = Lyra.obj().instance(X).instance(Y);

            Utils.validate(schema, [
                { value: b },
                {
                    value: c,
                    error: {
                        code: 'object.instance',
                        message: 'unknown must be an instance of Y',
                        local: { ctor: Y, name: 'Y', label: 'unknown' },
                    },
                },
                {
                    value: {},
                    error: {
                        code: 'object.instance',
                        message: 'unknown must be an instance of X',
                        local: { ctor: X, label: 'unknown', name: 'X' },
                    },
                },
            ]);
        });
    });

    describe('regex()', () => {
        it('should validate regular expressions', () => {
            const schema = Lyra.obj().regex();

            Utils.validate(schema, [
                { value: /x/ },
                {
                    value: new Date(),
                    error: {
                        code: 'object.instance',
                        message: 'unknown must be an instance of RegExp',
                        local: { label: 'unknown', ctor: RegExp, name: 'RegExp' },
                    },
                },
            ]);
        });
    });

    describe('schema()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().schema(1)).toThrow('Type must be a string');
        });

        it('should validate schema objects', () => {
            const schema = Lyra.obj().schema();

            Utils.validate(schema, [
                { value: Lyra.num() },
                { value: Lyra.str() },
                {
                    value: {},
                    error: {
                        code: 'object.schema',
                        message: 'unknown must be a valid schema',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate schema types', () => {
            const schema = Lyra.obj().schema('number');

            Utils.validate(schema, [
                { value: Lyra.num() },
                {
                    value: Lyra.str(),
                    error: {
                        code: 'object.schema.type',
                        message: 'unknown must be a valid schema of type number',
                        local: { type: 'number', label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate schema bases', () => {
            const custom = Lyra.extend({
                type: 'test',
                from: Lyra.obj(),
            });

            const schema = custom.obj().schema('object', { allowBase: true });

            Utils.validate(schema, [{ value: custom.test() }]);
        });
    });

    describe('values()', () => {
        it('should validate values objects', () => {
            const schema = Lyra.obj().values();

            Utils.validate(schema, [
                { value: Lyra.values() },
                {
                    value: {},
                    error: {
                        code: 'object.values',
                        message: 'unknown must be a valid values',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('ref()', () => {
        it('should validate reference objects', () => {
            const schema = Lyra.obj().ref();

            Utils.validate(schema, [
                { value: Lyra.ref('a') },
                {
                    value: {},
                    error: {
                        code: 'object.ref',
                        message: 'unknown must be a valid reference',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('template()', () => {
        it('should validate template objects', () => {
            const schema = Lyra.obj().template();

            Utils.validate(schema, [
                { value: Lyra.template('x') },
                {
                    value: {},
                    error: {
                        code: 'object.template',
                        message: 'unknown must be a valid template',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('and()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().and('a', Lyra.ref('b'), 'c')).toThrow('Peer must be a string');
        });

        it('should validate peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
                c: 'z',
            }).and('a', 'b', 'c');

            Utils.validate(schema, [
                { value: { a: 'x', b: 'y', c: 'z' } },
                { value: {} },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain a with b, c',
                        local: {
                            present: [{ path: 'a', label: 'a' }],
                            missing: [
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain b with a, c',
                        local: {
                            present: [{ path: 'b', label: 'b' }],
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { c: 'z' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain c with a, b',
                        local: {
                            present: [{ path: 'c', label: 'c' }],
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', c: 'z' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain a, c with b',
                        local: {
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'c', label: 'c' },
                            ],
                            missing: [{ path: 'b', label: 'b' }],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: {
                    c: 'y',
                },
            }).and('a', 'b.c');

            Utils.validate(schema, [
                {
                    value: {
                        a: 'x',
                        b: { c: 'y' },
                    },
                },
                { value: {} },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain a with b.c',
                        local: {
                            present: [{ path: 'a', label: 'a' }],
                            missing: [{ path: 'b.c', label: 'b.c' }],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { b: { c: 'y' } },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain b.c with a',
                        local: {
                            present: [{ path: 'b.c', label: 'b.c' }],
                            missing: [{ path: 'a', label: 'a' }],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate invalid nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
            }).and('a', 'b.c');

            Utils.validate(schema, [
                { value: {} },
                { value: { b: 'y' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain a with b.c',
                        local: {
                            present: [{ path: 'a', label: 'a' }],
                            missing: [{ path: 'b.c', label: 'b.c' }],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain a with b.c',
                        local: {
                            present: [{ path: 'a', label: 'a' }],
                            missing: [{ path: 'b.c', label: 'b.c' }],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: { c: 'y' } },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should not validate unknown peers', () => {
            const schema = Lyra.obj({ a: 'x' }).and('a', 'b');

            Utils.validate(schema, [
                { value: {} },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain a with b',
                        local: {
                            present: [{ path: 'a', label: 'a' }],
                            missing: [{ path: 'b', label: 'b' }],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should validate unknown peers when unknown is set to true', () => {
            const schema = Lyra.obj({ a: 'x' }).unknown().and('a', 'b');

            Utils.validate(schema, [
                { value: { a: 'x', b: 'y' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain a with b',
                        local: {
                            present: [{ path: 'a', label: 'a' }],
                            missing: [{ path: 'b', label: 'b' }],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: Lyra.valid('y').label('B'),
            }).and('a', 'b');

            Utils.validate(schema, [
                {
                    value: { a: 'x' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain A with B',
                        local: {
                            present: [{ path: 'a', label: 'A' }],
                            missing: [{ path: 'b', label: 'B' }],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels when validating invalid nested peers', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: 'y',
            }).and('a', 'b.c');

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.and',
                        message: 'unknown must contain A with b.c',
                        local: {
                            present: [{ path: 'a', label: 'A' }],
                            missing: [{ path: 'b.c', label: 'b.c' }],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });
    });

    describe('nand()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().nand('a', Lyra.ref('b'), 'c')).toThrow('Peer must be a string');
        });

        it('should validate peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
                c: 'z',
            }).nand('a', 'b', 'c');

            Utils.validate(schema, [
                { value: {} },
                { value: { a: 'x' } },
                { value: { b: 'y' } },
                { value: { c: 'z' } },
                { value: { a: 'x', b: 'y' } },
                { value: { b: 'y', c: 'z' } },
                { value: { a: 'x', c: 'z' } },
                {
                    value: { a: 'x', b: 'y', c: 'z' },
                    error: {
                        code: 'object.nand',
                        message: 'unknown must not contain all of a, b, c',
                        local: {
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: {
                    c: 'y',
                },
            }).nand('a', 'b.c');

            Utils.validate(schema, [
                { value: {} },
                { value: { a: 'x' } },
                { value: { b: { c: 'y' } } },
                {
                    value: {
                        a: 'x',
                        b: { c: 'y' },
                    },
                    error: {
                        code: 'object.nand',
                        message: 'unknown must not contain all of a, b.c',
                        local: {
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate invalid nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
            }).nand('a', 'b.c');

            Utils.validate(schema, [
                { value: {} },
                { value: { a: 'x' } },
                { value: { a: 'x', b: 'y' } },
                { value: { b: 'y' } },
                {
                    value: { a: 'x', b: { c: 'y' } },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should not validate unknown peers', () => {
            const schema = Lyra.obj({ a: 'x' }).nand('a', 'b');

            Utils.validate(schema, { abortEarly: false }, [
                {
                    value: { a: 'x', b: 'y' },
                    error: [
                        {
                            code: 'object.unknown',
                            message: 'b is not allowed',
                            local: { label: 'b' },
                        },
                        {
                            code: 'object.nand',
                            message: 'unknown must not contain all of a, b',
                            local: {
                                present: [
                                    { path: 'a', label: 'a' },
                                    { path: 'b', label: 'b' },
                                ],
                                label: 'unknown',
                            },
                        },
                    ],
                },
            ]);
        });

        it('should validate unknown peers when unknown is set to true', () => {
            const schema = Lyra.obj({ a: 'x' }).nand('a', 'b').unknown();

            Utils.validate(schema, [
                { value: {} },
                { value: { a: 'x' } },
                { value: { b: 'y' } },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.nand',
                        message: 'unknown must not contain all of a, b',
                        local: {
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: Lyra.valid('y').label('B'),
            }).nand('a', 'b');

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.nand',
                        message: 'unknown must not contain all of A, B',
                        local: {
                            present: [
                                { path: 'a', label: 'A' },
                                { path: 'b', label: 'B' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });
    });

    describe('or()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().or('a', Lyra.ref('b'), 'c')).toThrow('Peer must be a string');
        });

        it('should validate peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
                c: 'z',
            }).or('a', 'b', 'c');

            Utils.validate(schema, [
                { value: { a: 'x', b: 'y', c: 'z' } },
                { value: { a: 'x' } },
                { value: { b: 'y' } },
                { value: { c: 'z' } },
                { value: { a: 'x', b: 'y' } },
                { value: { b: 'y', c: 'z' } },
                { value: { a: 'x', c: 'z' } },
                {
                    value: {},
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of a, b, c',
                        local: {
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: {
                    c: 'y',
                },
            }).or('a', 'b.c');

            Utils.validate(schema, [
                {
                    value: {
                        a: 'x',
                        b: { c: 'y' },
                    },
                },
                { value: { a: 'x' } },
                { value: { b: { c: 'y' } } },
                {
                    value: {},
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of a, b.c',
                        local: {
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate invalid nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
            }).or('a', 'b.c');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { a: 'x', b: 'y' } },
                {
                    value: {},
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of a, b.c',
                        local: {
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of a, b.c',
                        local: {
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: { c: 'y' } },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should not validate unknown peers', () => {
            const schema = Lyra.obj({ a: 'x' }).or('a', 'b');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                {
                    value: {},
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of a, b',
                        local: {
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should validate unknown peers when unknown is set to true', () => {
            const schema = Lyra.obj({ a: 'x' }).unknown().or('a', 'b');

            Utils.validate(schema, [
                { value: { a: 'x', b: 'y' } },
                { value: { a: 'x' } },
                { value: { b: 'x' } },
                {
                    value: {},
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of a, b',
                        local: {
                            missing: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: Lyra.valid('y').label('B'),
            }).or('a', 'b');

            Utils.validate(schema, [
                {
                    value: {},
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of A, B',
                        local: {
                            missing: [
                                { path: 'a', label: 'A' },
                                { path: 'b', label: 'B' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels when validating invalid nested peers', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: 'y',
            }).or('a', 'b.c');

            Utils.validate(schema, [
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.or',
                        message: 'unknown must contain at least one of A, b.c',
                        local: {
                            missing: [
                                { path: 'a', label: 'A' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });
    });

    describe('xor()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().xor('a', Lyra.ref('b'), 'c')).toThrow('Peer must be a string');
        });

        it('should validate peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
                c: 'z',
            }).xor('a', 'b', 'c');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { b: 'y' } },
                { value: { c: 'z' } },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { b: 'y', c: 'z' },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', c: 'z' },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: 'y', c: 'z' },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: {},
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: {
                    c: 'y',
                },
            }).xor('a', 'b.c');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { b: { c: 'y' } } },
                {
                    value: {
                        a: 'x',
                        b: { c: 'y' },
                    },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b.c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate invalid nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
            }).xor('a', 'b.c');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { a: 'x', b: 'y' } },
                {
                    value: {},
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b.c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            present: [],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b.c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            present: [],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: { c: 'y' } },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should not validate unknown peers', () => {
            const schema = Lyra.obj({ a: 'x' }).xor('a', 'b');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                {
                    value: {},
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            present: [],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should validate unknown peers when unknown is set to true', () => {
            const schema = Lyra.obj({ a: 'x' }).unknown().xor('a', 'b');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { b: 'x' } },
                {
                    value: {},
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            present: [],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of a, b',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: Lyra.valid('y').label('B'),
            }).xor('a', 'b');

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of A, B',
                        local: {
                            peers: [
                                { path: 'a', label: 'A' },
                                { path: 'b', label: 'B' },
                            ],
                            present: [
                                { path: 'a', label: 'A' },
                                { path: 'b', label: 'B' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels when validating invalid nested peers', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: 'y',
            }).xor('a', 'b.c');

            Utils.validate(schema, [
                {
                    value: {},
                    error: {
                        code: 'object.xor',
                        message: 'unknown must contain exactly one of A, b.c',
                        local: {
                            peers: [
                                { path: 'a', label: 'A' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            present: [],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });
    });

    describe('oxor()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.obj().oxor('a', Lyra.ref('b'), 'c')).toThrow('Peer must be a string');
        });

        it('should validate peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
                c: 'z',
            }).oxor('a', 'b', 'c');

            Utils.validate(schema, [
                { value: {} },
                { value: { a: 'x' } },
                { value: { b: 'y' } },
                { value: { c: 'z' } },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.oxor',
                        message: 'unknown must contain one or none of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { b: 'y', c: 'z' },
                    error: {
                        code: 'object.oxor',
                        message: 'unknown must contain one or none of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', c: 'z' },
                    error: {
                        code: 'object.oxor',
                        message: 'unknown must contain one or none of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
                {
                    value: { a: 'x', b: 'y', c: 'z' },
                    error: {
                        code: 'object.oxor',
                        message: 'unknown must contain one or none of a, b, c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                                { path: 'c', label: 'c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: {
                    c: 'y',
                },
            }).oxor('a', 'b.c');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { b: { c: 'y' } } },
                {
                    value: {
                        a: 'x',
                        b: { c: 'y' },
                    },
                    error: {
                        code: 'object.oxor',
                        message: 'unknown must contain one or none of a, b.c',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b.c', label: 'b.c' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should validate invalid nested peers', () => {
            const schema = Lyra.obj({
                a: 'x',
                b: 'y',
            }).oxor('a', 'b.c');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { a: 'x', b: 'y' } },
                { value: {} },
                { value: { b: 'y' } },
                {
                    value: { a: 'x', b: { c: 'y' } },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should not validate unknown peers', () => {
            const schema = Lyra.obj({ a: 'x' }).oxor('a', 'b');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: {} },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should validate unknown peers when unknown is set to true', () => {
            const schema = Lyra.obj({ a: 'x' }).unknown().oxor('a', 'b');

            Utils.validate(schema, [
                { value: { a: 'x' } },
                { value: { b: 'x' } },
                { value: {} },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.oxor',
                        message: 'unknown must contain one or none of a, b',
                        local: {
                            peers: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            present: [
                                { path: 'a', label: 'a' },
                                { path: 'b', label: 'b' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });

        it('should use labels', () => {
            const schema = Lyra.obj({
                a: Lyra.valid('x').label('A'),
                b: Lyra.valid('y').label('B'),
            }).oxor('a', 'b');

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'object.oxor',
                        message: 'unknown must contain one or none of A, B',
                        local: {
                            peers: [
                                { path: 'a', label: 'A' },
                                { path: 'b', label: 'B' },
                            ],
                            present: [
                                { path: 'a', label: 'A' },
                                { path: 'b', label: 'B' },
                            ],
                            label: 'unknown',
                        },
                    },
                },
            ]);
        });
    });
});
