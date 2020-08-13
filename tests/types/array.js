'use strict';

const Lyra = require('../../src');
const Utils = require('../utils');

describe('array()', () => {

    it('should validate arrays', () => {

        const schema = Lyra.arr();

        Utils.validate(schema, [
            { value: [] },
            { value: [1] },
            {
                value: new Array(3),
                error: {
                    code: 'array.sparse',
                    message: '0 must not be a sparse array item',
                    local: { pos: 0, label: '0' },
                },
            },
            {
                value: 'x',
                error: {
                    code: 'array.base',
                    message: 'unknown must be an array',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should coerce to arrays', () => {

        const schema = Lyra.arr().convert();

        Utils.validate(schema, [
            {
                value: '[]',
                output: [],
            },
            {
                value: '[{"a": 1}]',
                output: [{ a: 1 }],
            },
            {
                value: 1,
                error: {
                    code: 'array.base',
                    message: 'unknown must be an array',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 'x',
                error: {
                    code: 'array.base',
                    message: 'unknown must be an array',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should cast to sets', () => {

        const schema = Lyra.arr().cast('set');

        Utils.validate(schema, [
            {
                value: ['x', 'y', 1],
                output: new Set(['x', 'y', 1]),
            },
        ]);
    });

    it('should reject sparse array items', () => {

        const schema = Lyra.arr();

        Utils.validate(schema, [
            {
                value: [undefined],
                error: {
                    code: 'array.sparse',
                    message: '0 must not be a sparse array item',
                    local: { label: '0', pos: 0 },
                },
            },
        ]);
    });

    describe('items()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Lyra.arr().items()).toThrow('Items must have at least one item');
        });

        it('should validate single item', () => {

            const schema = Lyra.arr({ a: Lyra.str().required() });

            Utils.validate(schema, [
                { value: [] },
                { value: [{ a: 'x' }] },
                { value: [{ a: 'x' }, { a: 'y' }] },
                {
                    value: [{ a: 'x' }, 1],
                    error: {
                        code: 'object.base',
                        message: '1 must be an object',
                        local: { label: '1' },
                    },
                },
                {
                    value: [{ a: 'x' }, {}],
                    error: {
                        code: 'any.required',
                        message: '1.a is required',
                        local: { label: '1.a' },
                    },
                },
            ]);
        });

        it('should reject sparse item', () => {

            const schema = Lyra.arr(Lyra.str());

            Utils.validate(schema, [
                {
                    value: ['x', undefined, 'x'],
                    error: {
                        code: 'array.sparse',
                        message: '1 must not be a sparse array item',
                        local: { label: '1', pos: 1 },
                    },
                },
            ]);
        });

        it('should validate items added via multiple calls', () => {

            const schema = Lyra.arr(Lyra.str()).items(Lyra.num()).items(Lyra.bool());

            Utils.validate(schema, [
                { value: ['a', 1, true] },
                {
                    value: [1, {}],
                    error: {
                        code: 'array.unknown',
                        message: '1 is not allowed',
                        local: { label: '1', pos: 1 },
                    },
                },
            ]);
        });

        it('should validate multiple items', () => {

            const schema = Lyra.arr(Lyra.num().max(10).convert(), Lyra.num().max(5).convert(), Lyra.str());

            Utils.validate(schema, [
                {
                    value: [9, '11', '6', 4],
                    output: [9, '11', 6, 4],
                },
                {
                    value: [11],
                    error: {
                        code: 'array.unknown',
                        message: '0 is not allowed',
                        local: { label: '0', pos: 0 },
                    },
                },
                {
                    value: [4, '9', 11],
                    error: {
                        code: 'array.unknown',
                        message: '2 is not allowed',
                        local: { label: '2', pos: 2 },
                    },
                },
            ]);
        });

        it('should validate array items', () => {

            const schema = Lyra.arr(Lyra.arr(Lyra.str()));

            Utils.validate(schema, [
                { value: [] },
                { value: [[]] },
                { value: [['x']] },
                {
                    value: [[1]],
                    error: {
                        code: 'string.base',
                        message: '0.0 must be a string',
                        local: { label: '0.0' },
                    },
                },
            ]);
        });

        it('should validate forbidden items', () => {

            const schema = Lyra.arr().items(Lyra.str().min(2).forbidden(), Lyra.number().convert(), Lyra.str());

            Utils.validate(schema, [
                {
                    value: ['x', 1, 'xyz'],
                    error: {
                        code: 'array.forbidden',
                        message: '2 is forbidden',
                        local: { label: '2', pos: 2 },
                    },
                },
                {
                    value: ['123', 'x', 1],                                 // Verify that forbidden items are validated first
                    error: {
                        code: 'array.forbidden',
                        message: '0 is forbidden',
                        local: { label: '0', pos: 0 },
                    },
                },
            ]);
        });

        it('should support forbidden references', () => {

            const schema = Lyra.obj({
                a: Lyra.arr(Lyra.valid(Lyra.ref('...b')).forbidden(), Lyra.str()),
                b: Lyra.number().convert(),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: ['x', 'y', 'z', 4],
                        b: '4',
                    },
                    error: {
                        code: 'array.forbidden',
                        message: 'a.3 is forbidden',
                        local: { label: 'a.3', pos: 3 },
                    },
                },
            ]);
        });

        it('should validate single required items', () => {

            const schema = Lyra.arr(Lyra.str().required());

            Utils.validate(schema, [
                { value: ['x'] },
                { value: ['x', 'x'] },
                {
                    value: [1],
                    error: {
                        code: 'string.base',
                        message: '0 must be a string',
                        local: { label: '0' },
                    },
                },
                {
                    value: ['x', true],
                    error: {
                        code: 'string.base',
                        message: '1 must be a string',
                        local: { label: '1' },
                    },
                },
            ]);
        });

        it('should validate multiple required items', () => {

            const a = Lyra.str().min(2).required();
            const schema = Lyra.arr(a, a, Lyra.num());                              // 2 required 'a' schemas

            Utils.validate(schema, [
                { value: ['xy', 'xx'] },
                { value: ['xx', 'xy', 1] },
                {
                    value: ['xx', 1],
                    error: {
                        code: 'array.requiredUnknowns',
                        message: 'unknown does not have 1 required value',
                        local: { unknownMisses: 1, label: 'unknown' },
                    },
                },
                {
                    value: [1],
                    error: {
                        code: 'array.requiredUnknowns',
                        message: 'unknown does not have 2 required values',
                        local: { unknownMisses: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should strip required values', () => {

            const schema = Lyra.arr(Lyra.str().required().strip(), Lyra.num().required().strip(), Lyra.bool());

            Utils.validate(schema, [
                {
                    value: ['x', 1, true, 'y', 2],
                    output: [true],
                },
            ]);
        });

        it('should support required references', () => {

            const schema = Lyra.obj({
                a: Lyra.arr(Lyra.valid(Lyra.ref('...b')).required(), Lyra.str()),
                b: Lyra.number().convert(),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: [4, 'x'],
                        b: '4',
                    },
                    output: {
                        a: [4, 'x'],
                        b: 4,
                    },
                },
                {
                    value: {
                        a: ['x'],
                        b: '4',
                    },
                    error: {
                        code: 'array.requiredUnknowns',
                        message: 'a does not have 1 required value',
                        local: { label: 'a', unknownMisses: 1 },
                    },
                },
            ]);
        });

        it('should use labels for required items', () => {

            const schema = Lyra.arr(Lyra.str().label('A').required(), Lyra.num().label('B').required());

            Utils.validate(schema, [
                {
                    value: [],
                    error: {
                        code: 'array.requiredKnowns',
                        message: 'unknown does not have A, B',
                        local: { knownMisses: ['A', 'B'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should use labels for some required items if provided', () => {

            const schema = Lyra.arr(Lyra.str().label('A').required(), Lyra.num().required());

            Utils.validate(schema, [
                {
                    value: [],
                    error: {
                        code: 'array.requiredBoth',
                        message: 'unknown does not have A and 1 other required value',
                        local: { knownMisses: ['A'], unknownMisses: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should strip unknown items', () => {

            const schema = Lyra.arr(Lyra.str(), Lyra.num().required()).settings({ stripUnknown: true });

            Utils.validate(schema, [
                {
                    value: ['x', 1, true, {}],
                    output: ['x', 1],
                },
                {
                    value: [1, true, {}],
                    output: [1],
                },
                {
                    value: ['x', true, {}],                             // Required schemas are always validated
                    error: {
                        code: 'array.requiredUnknowns',
                        message: 'unknown does not have 1 required value',
                        local: { unknownMisses: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should strip unknown if provided a single item', () => {

            const schema = Lyra.arr(Lyra.str()).settings({ stripUnknown: true });

            Utils.validate(schema, [
                {
                    value: ['x', true, {}, 1],
                    output: ['x'],
                },
            ]);
        });

        it('should collect all errors for single item', () => {

            const schema = Lyra.arr(Lyra.str().min(2).forbidden(), Lyra.str()).settings({ abortEarly: false });

            Utils.validate(schema, [
                {
                    value: ['xx', 1, 2, undefined, 3, 'xx'],
                    error: [
                        {
                            code: 'array.forbidden',
                            message: '0 is forbidden',
                            local: { label: '0', pos: 0 },
                        },
                        {
                            code: 'string.base',
                            message: '1 must be a string',
                            local: { label: '1' },
                        },
                        {
                            code: 'string.base',
                            message: '2 must be a string',
                            local: { label: '2' },
                        },
                        {
                            code: 'array.sparse',
                            message: '3 must not be a sparse array item',
                            local: { label: '3', pos: 3 },
                        },
                        {
                            code: 'string.base',
                            message: '4 must be a string',
                            local: { label: '4' },
                        },
                        {
                            code: 'array.forbidden',
                            message: '5 is forbidden',
                            local: { label: '5', pos: 5 },
                        },
                    ],
                },
            ]);
        });

        it('should collect all errors for multiple items', () => {

            const schema = Lyra.arr(Lyra.str().min(2).forbidden(), Lyra.num().required(), Lyra.str()).settings({ abortEarly: false });

            Utils.validate(schema, [
                {
                    value: ['xx', true],
                    error: [
                        {
                            code: 'array.forbidden',
                            message: '0 is forbidden',
                            local: { label: '0', pos: 0 },
                        },
                        {
                            code: 'array.unknown',
                            message: '1 is not allowed',
                            local: { label: '1', pos: 1 },
                        },
                        {
                            code: 'array.requiredUnknowns',
                            message: 'unknown does not have 1 required value',
                            local: { unknownMisses: 1, label: 'unknown' },
                        },
                    ],
                },
            ]);
        });
    });

    describe('ordered()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Lyra.arr().ordered()).toThrow('Items must have at least one item');
        });

        it('should validate ordered items', () => {

            const schema = Lyra.arr().ordered(Lyra.str(), Lyra.num().convert());

            Utils.validate(schema, [
                { value: ['x', 1] },
                {
                    value: ['x', '1'],
                    output: ['x', 1],
                },
                {
                    value: ['x', 'x'],
                    error: {
                        code: 'number.base',
                        message: '1 must be a number',
                        local: { label: '1' },
                    },
                },
                {
                    value: ['x', 1, 'x'],
                    error: {
                        code: 'array.orderedLength',
                        message: 'unknown must have at most 2 item(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate optional ordered items', () => {

            const schema = Lyra.arr().ordered(Lyra.str().required(), Lyra.num().required(), Lyra.num());

            Utils.validate(schema, [
                { value: ['x', 1, 1] },
                { value: ['x', 1] },
                {
                    value: ['x', 1, 'y'],
                    error: {
                        code: 'number.base',
                        message: '2 must be a number',
                        local: { label: '2' },
                    },
                },
                {
                    value: ['x'],
                    error: {
                        code: 'array.requiredUnknowns',
                        message: 'unknown does not have 1 required value',
                        local: { unknownMisses: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should reject sparse array items', () => {

            const schema = Lyra.arr().ordered(Lyra.str().required(), Lyra.num());

            Utils.validate(schema, [
                {
                    value: [undefined],
                    error: {
                        code: 'array.sparse',
                        message: '0 must not be a sparse array item',
                        local: { label: '0', pos: 0 },
                    },
                },
                {
                    value: ['x', undefined],
                    error: {
                        code: 'array.sparse',
                        message: '1 must not be a sparse array item',
                        local: { label: '1', pos: 1 },
                    },
                },
            ]);
        });

        it('should validate items after ordered items', () => {

            const schema = Lyra.arr()
                .ordered(Lyra.str(), Lyra.num())
                .items(Lyra.str().min(2).required(), Lyra.str());

            Utils.validate(schema, [
                { value: ['x', 1, 'xx', 'x'] },
                {
                    value: [1, 1],
                    error: {
                        code: 'string.base',
                        message: '0 must be a string',
                        local: { label: '0' },
                    },
                },
                {
                    value: ['x', 1, 'x', 'x'],
                    error: {
                        code: 'array.requiredUnknowns',
                        message: 'unknown does not have 1 required value',
                        local: { label: 'unknown', unknownMisses: 1 },
                    },
                },
                {
                    value: ['x', 1, 'xx', 1],
                    error: {
                        code: 'array.unknown',
                        message: '3 is not allowed',
                        local: { label: '3', pos: 3 },
                    },
                },
            ]);
        });

        it('should validate forbidden items with ordered items', () => {

            const schema = Lyra.arr()
                .ordered(Lyra.str())
                .items(Lyra.str().min(2).forbidden(), Lyra.num());

            Utils.validate(schema, [
                { value: ['x', 1] },
                {
                    value: ['xx', 1],
                    error: {
                        code: 'array.forbidden',
                        message: '0 is forbidden',
                        local: { label: '0', pos: 0 },
                    },
                },
            ]);
        });

        it('should strip ordered items', () => {

            const schema = Lyra.arr().ordered(Lyra.str().strip(), Lyra.num());

            Utils.validate(schema, [
                {
                    value: ['x'],
                    output: [],
                },
                {
                    value: ['x', 1],
                    output: [1],
                },
            ]);
        });

        it('should collect all errors', () => {

            const schema = Lyra.arr()
                .ordered(Lyra.str(), Lyra.num().required())
                .items(Lyra.str().min(2).forbidden(), Lyra.num())
                .settings({ abortEarly: false });

            Utils.validate(schema, [
                { value: ['x', 1, 1] },
                {
                    value: ['xx'],
                    error: [
                        {
                            code: 'array.forbidden',
                            message: '0 is forbidden',
                            local: { label: '0', pos: 0 },
                        },
                        {
                            code: 'array.requiredUnknowns',
                            message: 'unknown does not have 1 required value',
                            local: { unknownMisses: 1, label: 'unknown' },
                        },
                    ],
                },
                {
                    value: [undefined, 'x', 'xx'],
                    error: [
                        {
                            code: 'array.sparse',
                            message: '0 must not be a sparse array item',
                            local: { label: '0', pos: 0 },
                        },
                        {
                            code: 'number.base',
                            message: '1 must be a number',
                            local: { label: '1' },
                        },
                        {
                            code: 'array.forbidden',
                            message: '2 is forbidden',
                            local: { label: '2', pos: 2 },
                        },
                    ],
                },
                {
                    value: ['x', 1, 'xx', 'x'],
                    error: [
                        {
                            code: 'array.forbidden',
                            message: '2 is forbidden',
                            local: { label: '2', pos: 2 },
                        },
                        {
                            code: 'number.base',
                            message: '3 must be a number',
                            local: { label: '3' },
                        },
                    ],
                },
                {
                    value: ['xx', 'x', 'x', 1],
                    error: [
                        {
                            code: 'array.forbidden',
                            message: '0 is forbidden',
                            local: { label: '0', pos: 0 },
                        },
                        {
                            code: 'number.base',
                            message: '1 must be a number',
                            local: { label: '1' },
                        },
                        {
                            code: 'number.base',
                            message: '2 must be a number',
                            local: { label: '2' },
                        },
                    ],
                },
            ]);
        });

        it('should collect all errors when there are more ordered items than array items', () => {

            const schema = Lyra.arr()
                .ordered(Lyra.str())
                .settings({ abortEarly: false });

            Utils.validate(schema, [
                {
                    value: [1, 2, 3],
                    error: [
                        {
                            code: 'string.base',
                            message: '0 must be a string',
                            local: { label: '0' },
                        },
                        {
                            code: 'array.orderedLength',
                            message: 'unknown must have at most 1 item(s)',
                            local: { limit: 1, label: 'unknown' },
                        },
                    ],
                },
            ]);
        });
    });

    describe('single()', () => {

        it('should throw when array has array items', () => {

            expect(() => Lyra.arr(Lyra.arr()).single()).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().items(Lyra.str(), Lyra.arr())).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().items(Lyra.alt(Lyra.arr()))).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().items(Lyra.alt(Lyra.str()).try(Lyra.arr()))).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().items(Lyra.str())).not.toThrow();
            expect(() => Lyra.arr().single().items(Lyra.alt(Lyra.str()))).not.toThrow();

            expect(() => Lyra.arr().ordered(Lyra.arr()).single()).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().ordered(Lyra.str(), Lyra.arr())).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().ordered(Lyra.alt(Lyra.arr()))).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().ordered(Lyra.alt(Lyra.str()).try(Lyra.arr()))).toThrow('Cannot specify single when array has array items');
            expect(() => Lyra.arr().single().ordered(Lyra.str())).not.toThrow();
            expect(() => Lyra.arr().single().ordered(Lyra.alt(Lyra.str()))).not.toThrow();
        });

        it('should validate single item', () => {

            const schema = Lyra.arr(Lyra.str()).single();

            Utils.validate(schema, [
                {
                    value: 'x',
                    output: ['x'],
                },
                {
                    value: 1,
                    error: {
                        code: 'string.base',
                        message: '0 must be a string',
                        local: { label: '0' },
                    },
                },
            ]);
        });

        it('should validate single ordered item', () => {

            const schema = Lyra.arr().ordered(Lyra.str()).single();

            Utils.validate(schema, [
                {
                    value: 'x',
                    output: ['x'],
                },
                {
                    value: 1,
                    error: {
                        code: 'string.base',
                        message: '0 must be a string',
                        local: { label: '0' },
                    },
                },
            ]);
        });
    });

    describe('sparse()', () => {

        it('should avoid cloning if set to the same value', () => {

            const schema = Lyra.arr().sparse();

            expect(schema.sparse()).toBe(schema);
        });

        it('should allow sparse array items', () => {

            const schema = Lyra.arr().sparse();

            Utils.validate(schema, [{ value: [1, 2, undefined, 3] }]);
        });

        it('should allow sparse array items when combined with items calls', () => {

            const schema = Lyra.arr(Lyra.str().min(2).required(), Lyra.str(), Lyra.num().forbidden()).sparse();

            Utils.validate(schema, [
                { value: ['xx', undefined, 'x', undefined, 'y', 'z'] },
                {
                    value: [undefined],
                    error: {
                        code: 'array.requiredUnknowns',
                        message: 'unknown does not have 1 required value',
                        local: { label: 'unknown', unknownMisses: 1 },
                    },
                },
                {
                    value: ['xx', undefined, 'x', undefined, 1],
                    error: {
                        code: 'array.forbidden',
                        message: '4 is forbidden',
                        local: { label: '4', pos: 4 },
                    },
                },
            ]);
        });

        it('should allow sparse array items when combined with ordered calls', () => {

            const schema = Lyra.arr()
                .ordered(Lyra.str(), Lyra.num().required())
                .items(Lyra.str()).sparse();

            Utils.validate(schema, [
                { value: [undefined, 1, 'x'] },
                { value: ['x', 1, undefined, undefined, 'x'] },
                {
                    value: ['x', undefined, 'x'],
                    error: {
                        code: 'any.required',
                        message: '1 is required',
                        local: { label: '1' },
                    },
                },
            ]);
        });

        it('should cancel sparse', () => {

            const schema = Lyra.arr().sparse().sparse(false);

            Utils.validate(schema, [
                {
                    value: [undefined],
                    error: {
                        code: 'array.sparse',
                        message: '0 must not be a sparse array item',
                        local: { label: '0', pos: 0 },
                    },
                },
            ]);
        });
    });

    describe('length()', () => {

        it('should throw  on incorrect parameters', () => {

            expect(() => Lyra.arr().length('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.arr().length(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should validate array lengths', () => {

            const schema = Lyra.arr().length(2);

            Utils.validate(schema, [
                { value: ['x', 'y'] },
                {
                    value: [],
                    error: {
                        code: 'array.length',
                        message: 'unknown must have 2 item(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.arr().length(ref),
                b: Lyra.num(),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: ['x', 'y'],
                        b: 2,
                    },
                },
                {
                    value: {
                        a: [],
                        b: 2,
                    },
                    error: {
                        code: 'array.length',
                        message: 'a must have "b" item(s)',
                        local: { limit: ref, label: 'a' },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.arr().length(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: [],
                        b: 'x',
                    },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "length" references "b" which must be a number',
                        local: { name: 'length', ref, message: 'must be a number', label: 'a' },
                    },
                },
            ]);
        });

        it('should override length', () => {

            const schema = Lyra.arr().length(1).length(2);

            Utils.validate(schema, [
                { value: ['x', 'y'] },
                {
                    value: ['x'],
                    error: {
                        code: 'array.length',
                        message: 'unknown must have 2 item(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('max()', () => {

        it('should throw  on incorrect parameters', () => {

            expect(() => Lyra.arr().max('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.arr().max(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should validate max array lengths', () => {

            const schema = Lyra.arr().max(2);

            Utils.validate(schema, [
                { value: ['x'] },
                { value: ['x', 'y'] },
                {
                    value: ['x', 'y', 'z'],
                    error: {
                        code: 'array.max',
                        message: 'unknown must have at most 2 item(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.arr().max(ref),
                b: Lyra.num(),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: ['x', 'y'],
                        b: 2,
                    },
                },
                {
                    value: {
                        a: ['x', 'y', 'z'],
                        b: 2,
                    },
                    error: {
                        code: 'array.max',
                        message: 'a must have at most "b" item(s)',
                        local: { limit: ref, label: 'a' },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.arr().max(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: [],
                        b: 'x',
                    },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "max" references "b" which must be a number',
                        local: { name: 'max', ref, message: 'must be a number', label: 'a' },
                    },
                },
            ]);
        });

        it('should override max length', () => {

            const schema = Lyra.arr().max(1).max(2);

            Utils.validate(schema, [{ value: ['x', 'y'] }, { value: ['x'] }]);
        });
    });

    describe('min()', () => {

        it('should throw  on incorrect parameters', () => {

            expect(() => Lyra.arr().min('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.arr().min(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should validate max array lengths', () => {

            const schema = Lyra.arr().min(2);

            Utils.validate(schema, [
                { value: ['x', 'y'] },
                {
                    value: [],
                    error: {
                        code: 'array.min',
                        message: 'unknown must have at least 2 item(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.arr().min(ref),
                b: Lyra.num(),
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: ['x', 'y'],
                        b: 2,
                    },
                },
                {
                    value: {
                        a: [],
                        b: 2,
                    },
                    error: {
                        code: 'array.min',
                        message: 'a must have at least "b" item(s)',
                        local: { limit: ref, label: 'a' },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.arr().min(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: [],
                        b: 'x',
                    },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "min" references "b" which must be a number',
                        local: { name: 'min', ref, message: 'must be a number', label: 'a' },
                    },
                },
            ]);
        });

        it('should override max length', () => {

            const schema = Lyra.arr().min(1).min(2);

            Utils.validate(schema, [
                { value: ['x', 'y'] },
                {
                    value: ['x'],
                    error: {
                        code: 'array.min',
                        message: 'unknown must have at least 2 item(s)',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('unique()', () => {

        it('should throw on incorrect parameter', () => {

            expect(() => Lyra.arr().unique(1)).toThrow('Comparator must be a string or a function');
        });

        it('should validate uniqueness', () => {

            const schema = Lyra.arr().unique();
            const fn = () => { };
            const obj = {};
            const date = new Date('01/01/2020');

            Utils.validate(schema, [
                { value: [1, 2] },
                { value: ['2', 2] },
                { value: [() => { }, () => { }] },
                {
                    value: [1, 1],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 1',
                        local: { pos: 0, dupPos: 1, label: 'unknown' },
                    },
                },
                {
                    value: ['x', 1, 'x'],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 2',
                        local: { pos: 0, dupPos: 2, label: 'unknown' },
                    },
                },
                {
                    value: [['x'], 1, ['x']],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 2',
                        local: { pos: 0, dupPos: 2, label: 'unknown' },
                    },
                },
                {
                    value: [fn, fn],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 1',
                        local: { pos: 0, dupPos: 1, label: 'unknown' },
                    },
                },
                {
                    value: [{ a: 'x' }, { a: 'x' }],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 1',
                        local: { pos: 0, dupPos: 1, label: 'unknown' },
                    },
                },
                {
                    value: [obj, obj],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 1',
                        local: { pos: 0, dupPos: 1, label: 'unknown' },
                    },
                },
                {
                    value: [date, date],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 1',
                        local: { pos: 0, dupPos: 1, label: 'unknown' },
                    },
                },
                {
                    value: [date, new Date(date.getTime())],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 1',
                        local: { pos: 0, dupPos: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should use custom comparators', () => {

            const schema = Lyra.arr().unique((a, b) => a === b);

            Utils.validate(schema, [
                { value: [{}, {}] },
                { value: [[], []] },
                {
                    value: ['x', 'x'],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 1',
                        local: { pos: 0, dupPos: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should use paths', () => {

            const schema = Lyra.arr().unique('id');

            Utils.validate(schema, [
                { value: [{ id: 'x' }, { id: 'y' }, { id: 1 }] },
                { value: [{ id: 'x' }, { id: 'y' }, {}] },
                {
                    value: [{ id: 'x' }, { id: 'y' }, { id: 'x' }],
                    error: {
                        code: 'array.unique',
                        message: 'unknown must not have duplicate items at 0 and 2',
                        local: { pos: 0, dupPos: 2, label: 'unknown' },
                    },
                },
            ]);
        });
    });
});
