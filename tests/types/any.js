'use strict';

const Bone = require('@botsocket/bone');

const Jade = require('../../src');
const Utils = require('../utils');

describe('any()', () => {

    describe('describe()', () => {

        it('should describe example', () => {

            const schema = Jade.object({
                a: Jade.number().max(10),
            });
            const desc = {
                type: 'object',
                keys: {
                    a: {
                        type: 'number',
                        rules: [
                            { name: 'max', args: { limit: 10 } },
                        ],
                    },
                },
            };

            expect(Bone.equal(schema.describe(), desc)).toBe(true);
        });

        describe('settings', () => {

            it('should describe settings', () => {

                const schema = Jade.any().settings({ abortEarly: false });
                const desc = {
                    type: 'any',
                    settings: { abortEarly: false },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe messages', () => {

                const schema = Jade.any().messages({ 'any.required': 'Test' });
                const desc = {
                    type: 'any',
                    settings: {
                        messages: {
                            'any.required': 'Test',
                        },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe message templates with settings', () => {

                const schema = Jade.any().messages({ 'any.required': Jade.template('Test', { ancestor: 0 }) });
                const desc = {
                    type: 'any',
                    settings: {
                        messages: {
                            'any.required': {
                                template: 'Test',
                                options: { ancestor: 0 },
                            },
                        },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });
        });

        describe('flags', () => {

            it('should describe flags', () => {

                const schema = Jade.num().optional().cast('string').label('test').default(5);
                const desc = {
                    type: 'number',
                    flags: {
                        presence: 'optional',
                        cast: 'string',
                        label: 'test',
                        default: 5,
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should not describe private flags', () => {

                const schema = Jade.arr(Jade.arr());
                const desc = {
                    type: 'array',
                    items: [
                        { type: 'array' },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });
        });

        describe('rules', () => {

            it('should describe rules', () => {

                const schema = Jade.num().min(1).max(10);
                const desc = {
                    type: 'number',
                    rules: [
                        { name: 'min', args: { limit: 1 } },
                        { name: 'max', args: { limit: 10 } },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe rules with reference and template arguments', () => {

                const schema = Jade.obj({
                    a: Jade.num(),
                    b: Jade.num().min(Jade.ref('a')).max(Jade.template('{a + 10}')),
                });
                const desc = {
                    type: 'object',
                    keys: {
                        a: { type: 'number' },
                        b: {
                            type: 'number',
                            rules: [
                                {
                                    name: 'min',
                                    args: { limit: { ref: 'a' } },
                                },
                                {
                                    name: 'max',
                                    args: { limit: { template: '{a + 10}' } },
                                },
                            ],
                        },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe custom rules', () => {

                const method = () => { };
                const schema = Jade.rule(method, 'some description');
                const desc = {
                    type: 'any',
                    rules: [
                        { name: 'rule', args: { method, description: 'some description' } },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should preserve date arguments', () => {

                const date = new Date();
                const schema = Jade.date().min(date);
                const desc = {
                    type: 'date',
                    rules: [
                        { name: 'min', args: { limit: date } },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should preserve regex arguments', () => {

                const regex = /a/;
                const schema = Jade.str().pattern(regex);
                const desc = {
                    type: 'string',
                    rules: [
                        { name: 'pattern', args: { regex } },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe options arguments', () => {

                const schema = Jade.str().dataUri({ paddingRequired: false });
                const desc = {
                    type: 'string',
                    rules: [
                        {
                            name: 'dataUri',
                            args: { options: { value: { paddingRequired: false } } },
                        },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });
        });

        describe('default values', () => {

            it('should describe default object', () => {

                const schema = Jade.num().default({ someKey: 'someValue' });
                const desc = {
                    type: 'number',
                    flags: {
                        default: {
                            value: { someKey: 'someValue' },
                        },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe default array', () => {

                const schema = Jade.num().default(['someArray']);
                const desc = {
                    type: 'number',
                    flags: {
                        default: {
                            value: ['someArray'],
                        },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe default function', () => {

                const fn = () => 1;
                const schema = Jade.any().default(fn);
                const desc = {
                    type: 'any',
                    flags: {
                        default: { callable: fn },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe deep default', () => {

                const schema = Jade.obj().default();
                const desc = {
                    type: 'object',
                    flags: {
                        default: { deep: true },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe default template', () => {

                const schema = Jade.any().default(Jade.template('Test'));
                const desc = {
                    type: 'any',
                    flags: {
                        default: { template: 'Test' },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe default reference', () => {

                const schema = Jade.object({
                    a: Jade.num(),
                    b: Jade.num().default(Jade.ref('a')),
                });
                const desc = {
                    type: 'object',
                    keys: {
                        a: { type: 'number' },
                        b: {
                            type: 'number',
                            flags: {
                                default: { ref: 'a' },
                            },
                        },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });
        });

        describe('valids/invalids', () => {

            it('should describe allows/invalids', () => {

                const schema = Jade.num().allow(Infinity, { x: 1 }, [1]).invalid(0);
                const desc = {
                    type: 'number',
                    allows: [
                        Infinity,
                        { value: { x: 1 } },
                        { value: [1] },
                    ],
                    invalids: [0],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe valids', () => {

                const schema = Jade.valid('x');
                const desc = {
                    type: 'any',
                    flags: { only: true },
                    allows: ['x'],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe allows/invalids with templates and references', () => {

                const schema = Jade.obj({
                    a: Jade.num(),
                    b: Jade.num()
                        .allow(Jade.template('Test'))
                        .invalid(Jade.ref('a')),
                });
                const desc = {
                    type: 'object',
                    keys: {
                        a: { type: 'number' },
                        b: {

                            type: 'number',
                            allows: [{ template: 'Test' }],
                            invalids: [{ ref: 'a' }],
                        },
                    },
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe override', () => {

                const schema = Jade.any().allow(Jade.override, 1);
                const desc = {
                    type: 'any',
                    allows: [{ override: true }, 1],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });
        });

        describe('terms()', () => {

            it('should describe truthy/falsy values', () => {

                const schema = Jade.bool().truthy('x', { x: 1 }, [1]).convert();
                const desc = {
                    type: 'boolean',
                    settings: { strict: false },
                    truthy: [
                        'x',
                        { value: { x: 1 } },
                        { value: [1] },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe dependencies', () => {

                const schema = Jade.obj({
                    a: Jade.num(),
                    b: Jade.num(),
                })
                    .and('a', 'b');
                const desc = {
                    type: 'object',
                    keys: {
                        a: { type: 'number' },
                        b: { type: 'number' },
                    },
                    dependencies: [
                        {
                            value: { type: 'and', peers: ['a', 'b'] },
                        },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe replacements', () => {

                const schema = Jade.str().replace('a', 'b').replace('c', 'd');
                const desc = {
                    type: 'string',
                    replacements: [
                        { value: { pattern: 'a', replacement: 'b' } },
                        { value: { pattern: 'c', replacement: 'd' } },
                    ],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });

            it('should describe annotations', () => {

                const schema = Jade.str().invalid('not this string').annotate('Some string', 'but not this string');
                const desc = {
                    type: 'string',
                    invalids: ['not this string'],
                    notes: ['Some string', 'but not this string'],
                };

                expect(Bone.equal(schema.describe(), desc)).toBe(true);
            });
        });
    });

    describe('merge()', () => {

        it('should return the current schema if is merging itself', () => {

            const schema = Jade.any();

            expect(schema.merge(schema)).toBe(schema);
        });

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.any().merge('x')).toThrow('Source must be a valid schema');
            expect(() => Jade.str().merge(Jade.num())).toThrow('Cannot merge a number schema into a string schema');
        });

        it('should keep the target type if the source type is any', () => {

            const a = Jade.num().min(1).convert();
            const b = Jade.any();

            Utils.validate(a, [
                { value: 1 },
                {
                    value: '1',
                    output: 1,
                },
                {
                    value: '0',
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 1',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);

            const schema = a.merge(b);

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: '1',
                    output: 1,
                },
                {
                    value: '0',
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 1',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);

            expect(schema.type).toBe('number');
        });

        it('should merge other types to any', () => {

            const a = Jade.any();
            const b = Jade.str().trim().replace(/a/g, 'b').convert();

            Utils.validate(a, [{ value: '   aa ' }]);

            Utils.validate(b, [
                {
                    value: '   aa ',
                    output: 'bb',
                },
            ]);

            Utils.validate(a.merge(b), [
                {
                    value: '   aa ',
                    output: 'bb',
                },
            ]);
        });

        it('should merge non-single rules', () => {

            const a = Jade.num().multiple(2);
            const b = Jade.num().multiple(5);

            Utils.validate(a, [
                { value: 2 },
                { value: 10 },
                {
                    value: 5,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 2',
                        local: { factor: 2, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 5 },
                { value: 10 },
                {
                    value: 2,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 5',
                        local: { factor: 5, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: 10 },
                {
                    value: 2,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 5',
                        local: { factor: 5, label: 'unknown' },
                    },
                },
                {
                    value: 5,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 2',
                        local: { factor: 2, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: 10 },
                {
                    value: 2,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 5',
                        local: { factor: 5, label: 'unknown' },
                    },
                },
                {
                    value: 5,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 2',
                        local: { factor: 2, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should override single rules', () => {

            const a = Jade.num().min(2);
            const b = Jade.num().min(3);

            Utils.validate(a, [
                { value: 2 },
                { value: 3 },
                {
                    value: 1,
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 2',
                        local: { limit: 2, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 3 },
                {
                    value: 2,
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 3',
                        local: { limit: 3, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: 3 },
                {
                    value: 2,
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 3',
                        local: { limit: 3, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [{ value: 2 }, { value: 3 }]);
        });

        it('should merge flags', () => {

            const a = Jade.required();
            const b = Jade.forbidden();

            Utils.validate(a, [
                { value: 1 },
                {
                    value: undefined,
                    error: {
                        code: 'any.required',
                        message: 'unknown is required',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: undefined },
                {
                    value: 1,
                    error: {
                        code: 'any.forbidden',
                        message: 'unknown is forbidden',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: undefined },
                {
                    value: 1,
                    error: {
                        code: 'any.forbidden',
                        message: 'unknown is forbidden',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: 1 },
                {
                    value: undefined,
                    error: {
                        code: 'any.required',
                        message: 'unknown is required',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should merge messages', () => {

            const a = Jade.num().min(1).messages({ 'number.base': '{#label} is not good enough' });
            const b = Jade.num().min(1).messages({ 'number.min': '{#label} is not big enough' });

            Utils.validate(a, [
                { value: 1 },
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown is not good enough',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 0,
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 1',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 1 },
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 0,
                    error: {
                        code: 'number.min',
                        message: 'unknown is not big enough',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: 1 },
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown is not good enough',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 0,
                    error: {
                        code: 'number.min',
                        message: 'unknown is not big enough',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: 1 },
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown is not good enough',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 0,
                    error: {
                        code: 'number.min',
                        message: 'unknown is not big enough',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should merge settings', () => {

            const a = Jade.num();
            const b = Jade.num().convert();

            Utils.validate(a, [
                { value: 1 },
                {
                    value: '1',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 1 },
                {
                    value: '1',
                    output: 1,
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: 1 },
                {
                    value: '1',
                    output: 1,
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: 1 },
                {
                    value: '1',
                    output: 1,
                },
            ]);
        });

        it('should merge allowed and valid values', () => {

            const a = Jade.number().allow('x');
            const b = Jade.valid('y');

            Utils.validate(a, [
                { value: 1 },
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 1,
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 1,
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y, x',
                        local: { values: ['y', 'x'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should merge valid values', () => {

            const a = Jade.valid('x');
            const b = Jade.valid('y');

            Utils.validate(a, [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [{ value: 'x' }, { value: 'y' }]);
            Utils.validate(b.merge(a), [{ value: 'x' }, { value: 'y' }]);
        });

        it('should merge invalid values', () => {

            const a = Jade.invalid('x');
            const b = Jade.invalid('y');

            Utils.validate(a, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                {
                    value: 'x',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
                {
                    value: 'y',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                {
                    value: 'x',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be y, x',
                        local: { values: ['y', 'x'], label: 'unknown' },
                    },
                },
                {
                    value: 'y',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be y, x',
                        local: { values: ['y', 'x'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should merge valid and invalid values', () => {

            const a = Jade.valid('x').invalid('y');
            const b = Jade.valid('y').invalid('x');

            Utils.validate(a, [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should merge valid and invalid values with override', () => {

            const a = Jade.valid('x', 'y').invalid('z');
            const b = Jade.valid(Jade.override, 'z').invalid('x');

            Utils.validate(a, [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 'z',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: 'z' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be z',
                        local: { values: ['z'], label: 'unknown' },
                    },
                },
                {
                    value: 'y',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be z',
                        local: { values: ['z'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: 'z' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be z',
                        local: { values: ['z'], label: 'unknown' },
                    },
                },
                {
                    value: 'y',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be z',
                        local: { values: ['z'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 'z',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should remove valid values', () => {

            const a = Jade.valid('x');
            const b = Jade.allow(Jade.override);

            Utils.validate(a.merge(b), [{ value: 'x' }, { value: 'y' }, { value: 'z' }]);
            Utils.validate(a.merge(b).allow('x'), [{ value: 'x' }, { value: 'y' }]);                // Validate that flag only is removed
        });

        it('should merge truthy values on boolean', () => {

            const a = Jade.bool().truthy('yes').convert();
            const b = Jade.bool().truthy(1).convert();

            Utils.validate(a, [
                { value: true },
                {
                    value: 'yes',
                    output: true,
                },
                {
                    value: 1,
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: true },
                {
                    value: 1,
                    output: true,
                },
                {
                    value: 'yes',
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: true },
                {
                    value: 1,
                    output: true,
                },
                {
                    value: 'yes',
                    output: true,
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: true },
                {
                    value: 1,
                    output: true,
                },
                {
                    value: 'yes',
                    output: true,
                },
            ]);
        });

        it('should merge falsy values on boolean', () => {

            const a = Jade.bool().falsy('no').convert();
            const b = Jade.bool().falsy(0).convert();

            Utils.validate(a, [
                { value: false },
                {
                    value: 'no',
                    output: false,
                },
                {
                    value: 0,
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: false },
                {
                    value: 0,
                    output: false,
                },
                {
                    value: 'no',
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: false },
                {
                    value: 0,
                    output: false,
                },
                {
                    value: 'no',
                    output: false,
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: false },
                {
                    value: 0,
                    output: false,
                },
                {
                    value: 'no',
                    output: false,
                },
            ]);
        });

        it('should merge truthy and falsy values on boolean', () => {

            const a = Jade.bool().truthy('yes').falsy('no').convert();
            const b = Jade.bool().truthy('no').falsy('yes').convert();

            Utils.validate(a, [
                { value: true },
                {
                    value: 'yes',
                    output: true,
                },
                {
                    value: 'no',
                    output: false,
                },
            ]);

            Utils.validate(b, [
                { value: true },
                {
                    value: 'yes',
                    output: false,
                },
                {
                    value: 'no',
                    output: true,
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: true },
                {
                    value: 'yes',
                    output: false,
                },
                {
                    value: 'no',
                    output: true,
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: true },
                {
                    value: 'yes',
                    output: true,
                },
                {
                    value: 'no',
                    output: false,
                },
            ]);
        });

        it('should merge any keys and specific keys on objects', () => {

            const a = Jade.obj();
            const b = Jade.obj({ a: 'x' });

            Utils.validate(a, [{ value: { a: 'x' } }, { value: { a: 'y' } }]);

            Utils.validate(b, [
                { value: { a: 'x' } },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: { a: 'x' } },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [{ value: { a: 'x' } }, { value: { a: 'y' } }]);
        });

        it('should merge no keys and specific keys on objects', () => {

            const a = Jade.obj({});
            const b = Jade.obj({ a: 'x' });

            Utils.validate(a, [
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

            Utils.validate(b, [
                { value: { a: 'x' } },
                { value: {} },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: { a: 'x' } },
                { value: {} },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
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

        it('should merge no keys and any keys on objects', () => {

            const a = Jade.obj();
            const b = Jade.obj({});

            Utils.validate(a, [{ value: {} }, { value: { a: 'x' } }]);

            Utils.validate(b, [
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

            Utils.validate(a.merge(b), [
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

            Utils.validate(b.merge(a), [{ value: {} }, { value: { a: 'x' } }]);
        });

        it('should merge specific keys and specific keys on objects', () => {

            const a = Jade.obj({ a: 'x' });
            const b = Jade.obj({ b: 'x' });

            Utils.validate(a, [
                { value: { a: 'x' } },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
                {
                    value: { a: 'x', b: 'x' },
                    error: {
                        code: 'object.unknown',
                        message: 'b is not allowed',
                        local: { label: 'b' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: { b: 'x' } },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { a: 'x', b: 'x' },
                    error: {
                        code: 'object.unknown',
                        message: 'a is not allowed',
                        local: { label: 'a' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: { a: 'x' } },
                { value: { b: 'x' } },
                { value: { a: 'x', b: 'x' } },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: { a: 'x' } },
                { value: { b: 'x' } },
                { value: { a: 'x', b: 'x' } },
                {
                    value: { b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);
        });

        it('should merge same keys on objects', () => {

            const a = Jade.obj({ a: Jade.num().min(1) });
            const b = Jade.obj({ a: Jade.num().max(10).convert() });

            Utils.validate(a, [
                { value: { a: 1 } },
                {
                    value: { a: 0 },
                    error: {
                        code: 'number.min',
                        message: 'a must be greater than or equal to 1',
                        local: { limit: 1, label: 'a' },
                    },
                },
                {
                    value: { a: '1' },
                    error: {
                        code: 'number.base',
                        message: 'a must be a number',
                        local: { label: 'a' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: { a: 10 } },
                {
                    value: { a: '10' },
                    output: { a: 10 },
                },
                {
                    value: { a: 11 },
                    error: {
                        code: 'number.max',
                        message: 'a must be less than or equal to 10',
                        local: { limit: 10, label: 'a' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: { a: 1 } },
                {
                    value: { a: '1' },
                    output: { a: 1 },
                },
                { value: { a: 10 } },
                {
                    value: { a: '10' },
                    output: { a: 10 },
                },
                {
                    value: { a: 0 },
                    error: {
                        code: 'number.min',
                        message: 'a must be greater than or equal to 1',
                        local: { limit: 1, label: 'a' },
                    },
                },
                {
                    value: { a: '11' },
                    error: {
                        code: 'number.max',
                        message: 'a must be less than or equal to 10',
                        local: { limit: 10, label: 'a' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: { a: 1 } },
                {
                    value: { a: '1' },
                    output: { a: 1 },
                },
                { value: { a: 10 } },
                {
                    value: { a: '10' },
                    output: { a: 10 },
                },
                {
                    value: { a: 0 },
                    error: {
                        code: 'number.min',
                        message: 'a must be greater than or equal to 1',
                        local: { limit: 1, label: 'a' },
                    },
                },
                {
                    value: { a: '11' },
                    error: {
                        code: 'number.max',
                        message: 'a must be less than or equal to 10',
                        local: { limit: 10, label: 'a' },
                    },
                },
            ]);
        });

        it('should merge same keys on objects with implicit override', () => {

            const a = Jade.obj({ a: 'x' });
            const b = Jade.obj({ a: 'y' });

            Utils.validate(a, [
                { value: { a: 'x' } },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(b, [
                { value: { a: 'y' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'a must be y',
                        local: { values: ['y'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(a.merge(b), [
                { value: { a: 'y' } },
                {
                    value: { a: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'a must be y',
                        local: { values: ['y'], label: 'a' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: { a: 'x' } },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be x',
                        local: { values: ['x'], label: 'a' },
                    },
                },
            ]);
        });

        it('should throw on different schemas of the same keys on objects', () => {

            const a = Jade.obj({ a: Jade.num() });
            const b = Jade.obj({ a: Jade.str() });

            expect(() => a.merge(b)).toThrow('Cannot merge a string schema into a number schema');
        });

        it('should re-arrange keys with cross references on one object schema', () => {

            const ref = Jade.ref('b');
            const a = Jade.obj({ a: ref });
            const b = Jade.obj({ b: 'x' });

            Utils.validate(a.merge(b), [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'y', b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'a must be "b"',
                        local: { values: [ref], label: 'a' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'y', b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'a must be "b"',
                        local: { values: [ref], label: 'a' },
                    },
                },
            ]);
        });

        it('should re-arrange keys with cross references on both object schemas', () => {

            const ref = Jade.ref('b');
            const ref2 = Jade.ref('c');
            const a = Jade.obj({ a: ref, c: 'x' });
            const b = Jade.obj({ b: ref2 });

            Utils.validate(a.merge(b), [
                { value: { a: 'x', b: 'x', c: 'x' } },
                {
                    value: { a: 'x', b: 'y', c: 'x' },                              // Should throw on b first - verify ordering
                    error: {
                        code: 'any.only',
                        message: 'b must be "c"',
                        local: { values: [ref2], label: 'b' },
                    },
                },
                {
                    value: { a: 'y', b: 'x', c: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'a must be "b"',
                        local: { values: [ref], label: 'a' },
                    },
                },
            ]);

            Utils.validate(b.merge(a), [
                { value: { a: 'x', b: 'x', c: 'x' } },
                {
                    value: { a: 'x', b: 'y', c: 'x' },                              // Should throw on b first - verify ordering
                    error: {
                        code: 'any.only',
                        message: 'b must be "c"',
                        local: { values: [ref2], label: 'b' },
                    },
                },
                {
                    value: { a: 'y', b: 'x', c: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'a must be "b"',
                        local: { values: [ref], label: 'a' },
                    },
                },
            ]);
        });

        it('should merge complex cross references on objects', () => {

            const ref = Jade.ref('b');
            const ref2 = Jade.ref('c');
            const a = Jade.obj({ a: ref, c: Jade.ref('a') });
            const b = Jade.obj({ b: ref2, c: 'x' });

            Utils.validate(a.merge(b), [
                { value: { c: 'x', b: 'x', a: 'x' } },
                {
                    value: { c: 'x', b: 'y', a: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be "c"',
                        local: { values: [ref2], label: 'b' },
                    },
                },
                {
                    value: { c: 'x', b: 'x', a: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'a must be "b"',
                        local: { values: [ref], label: 'a' },
                    },
                },
            ]);

            expect(() => b.merge(a)).toThrow('Circular dependency detected');
        });
    });

    describe('settings()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.settings({ context: {} })).toThrow('Cannot override context');
            expect(() => Jade.settings({ presence: 'x' })).toThrow('Option presence must be optional, required or forbidden');
            expect(() => Jade.settings({ label: 'x' })).toThrow('Option label must be path or key');
        });

        it('should set settings', () => {

            const schema = Jade.num().convert();

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: '1',
                    output: 1,
                },
            ]);
        });

        it('should set settings via multiple calls', () => {

            const schema = Jade.obj({ a: Jade.num() }).settings({ allowUnknown: true }).convert().settings({ stripUnknown: true });

            Utils.validate(schema, [{ value: { a: '1', b: 'x' }, output: { a: 1 } }]);
        });

        it('should override settings', () => {

            const schema = Jade.num().convert().convert(false);

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: '1',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should set messages', () => {

            const schema = Jade.num()
                .min(1)
                .messages({ 'number.base': '{#label} is not good enough' })
                .messages({ 'number.min': '{#label} is not big enough' });

            Utils.validate(schema, [
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown is not good enough',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 0,
                    error: {
                        code: 'number.min',
                        message: 'unknown is not big enough',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support templates', () => {

            const schema = Jade.num()
                .min(1)
                .messages({ 'number.min': Jade.template('{#limit} must be less than {#label}') });

            Utils.validate(schema, [
                {
                    value: 0,
                    error: {
                        code: 'number.min',
                        message: '1 must be less than unknown',
                        local: { limit: 1, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should apply deeply', () => {

            const schema = Jade.obj({
                a: Jade.num(),
                b: {
                    c: Jade.num(),
                },
            })
                .settings({ strict: false });

            Utils.validate(schema, [
                { value: { a: 1, b: { c: 1 } } },
                {
                    value: { a: '1', b: { c: '1' } },
                    output: { a: 1, b: { c: 1 } },
                },
                {
                    value: { a: '1', b: { c: 'x' } },
                    error: {
                        code: 'number.base',
                        message: 'b.c must be a number',
                        local: { label: 'b.c' },
                    },
                },
            ]);
        });

        it('should combine with options passed via validate', () => {

            const schema = Jade.num()
                .min(2)
                .settings({ strict: false, messages: { 'number.base': '{#label} is not good enough' } });

            Utils.validate(schema,
                {
                    presence: 'required',
                    strict: true,
                    messages: { 'number.min': '{#label} is not big enough' },
                },
                [
                    { value: 2 },
                    { value: '2', output: 2 },
                    {
                        value: undefined,
                        error: {
                            code: 'any.required',
                            message: 'unknown is required',
                            local: { label: 'unknown' },
                        },
                    },
                    {
                        value: 'x',
                        error: {
                            code: 'number.base',
                            message: 'unknown is not good enough',
                            local: { label: 'unknown' },
                        },
                    },
                    {
                        value: '1',
                        error: {
                            code: 'number.min',
                            message: 'unknown is not big enough',
                            local: { limit: 2, label: 'unknown' },
                        },
                    },
                ],
            );
        });
    });

    describe('cast()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.any().cast(1)).toThrow('To must be a string or false');
        });

        it('should throw on unsupported cast', () => {

            expect(() => Jade.num().cast('set')).toThrow('Cast to set for type number is not supported');
        });

        it('should avoid cloning if called twice', () => {

            const schema = Jade.num().cast('string');

            expect(schema.cast('string')).toBe(schema);
        });

        it('should cast the value', () => {

            const schema = Jade.num().cast('string');

            Utils.validate(schema, [
                {
                    value: 1,
                    output: '1',
                },
            ]);
        });

        it('should cancel cast', () => {

            const schema = Jade.num().cast('string').cast(false);

            Utils.validate(schema, [{ value: 1 }]);
        });

        it('should not cast when validation already failed', () => {

            const schema = Jade.num().min(1).settings({ abortEarly: false }).cast('string');
            const result = schema.validate(0.5);

            expect(result.value).toBe(undefined);
            expect(result.errors.length).toBe(1);
        });
    });

    describe('presence()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.any().presence('x')).toThrow('Presence must be optional, required or forbidden');
        });

        it('should avoid cloning if called twice', () => {

            const schema = Jade.required();

            expect(schema.required()).toBe(schema);
            expect(schema.presence('required')).toBe(schema);
        });

        it('should make a value required', () => {

            const schema = Jade.required();

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: undefined,
                    error: {
                        code: 'any.required',
                        message: 'unknown is required',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should make a value forbidden', () => {

            const schema = Jade.forbidden();

            Utils.validate(schema, [
                { value: undefined },
                {
                    value: 'x',
                    error: {
                        code: 'any.forbidden',
                        message: 'unknown is forbidden',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should make a value optional', () => {

            const schema = Jade.optional();

            Utils.validate(schema, { presence: 'required' }, [{ value: undefined }, { value: 'x' }]);
            Utils.validate(schema, { presence: 'forbidden' }, [{ value: undefined }, { value: 'x' }]);
        });

        it('should override presence', () => {

            const schema = Jade.required().presence('forbidden');

            Utils.validate(schema, [
                { value: undefined },
                {
                    value: 1,
                    error: {
                        code: 'any.forbidden',
                        message: 'unknown is forbidden',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should override presence passed via options', () => {

            const schema = Jade.forbidden();

            Utils.validate(schema, { presence: 'required' }, [
                { value: undefined },
                {
                    value: 'x',
                    error: {
                        code: 'any.forbidden',
                        message: 'unknown is forbidden',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('default()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.any().default()).toThrow('Value must be provided');
            expect(() => Jade.any().default('x', { literal: true })).toThrow('Option literal only applies to function value');
        });

        it('should avoid cloning if called twice', () => {

            const schema = Jade.any().default({});

            expect(schema.default({})).toBe(schema);
        });

        it('should set the default value', () => {

            const schema = Jade.any().default('x');

            Utils.validate(schema, [{ value: undefined, output: 'x' }, { value: 1 }]);
        });

        it('should override default values', () => {

            const schema = Jade.any().default('x').default('y');

            Utils.validate(schema, [
                {
                    value: undefined,
                    output: 'y',
                },
            ]);
        });

        it('should call the default function', () => {

            const schema = Jade.obj({
                x: Jade.str(),
                y: Jade.str(),
                z: Jade.str().default((parent) => {

                    return `${parent.x} ${parent.y}`;
                }),
            });

            Utils.validate(schema, [
                {
                    value: { x: 'BotSocket', y: 'Open source' },
                    output: {
                        x: 'BotSocket',
                        y: 'Open source',
                        z: 'BotSocket Open source',
                    },
                },
                {
                    value: {
                        x: 'BotSocket',
                        y: 'Open source',
                        z: 'BotSocket xyz Open source',
                    },
                },
            ]);
        });

        it('should pass a cloned modified parent to the default function', () => {

            const schema = Jade.obj({
                a: Jade.num().convert(),
                b: Jade.any().default((parent) => {

                    parent.a++;
                    return parent.a;
                }),
            });
            const input = { a: '1' };

            Utils.validate(schema, [{ value: input, output: { a: 1, b: 2 } }]);

            expect(input.a).toBe('1');
        });

        it('should fail when the default function throws', () => {

            const error = new Error('Failed');
            const schema = Jade.any().default(() => {

                throw error;
            });

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: undefined,
                    error: {
                        code: 'any.default',
                        message: 'Default value for unknown fails to resolve due to: "Failed"',
                        local: { error, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should set the default function if literal is true', () => {

            const fn = () => { };
            const schema = Jade.any().default(fn, { literal: true });

            Utils.validate(schema, [
                {
                    value: undefined,
                    output: fn,
                },
                { value: 1 },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('a');
            const schema = Jade.obj({
                a: 'x',
                b: Jade.any().default(ref),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 1 } },
                {
                    value: { a: 'x' },
                    output: { a: 'x', b: 'x' },
                },
            ]);
        });

        it('should support templates', () => {

            const template = Jade.template('This is {a}');
            const schema = Jade.obj({
                a: 'x',
                b: Jade.any().default(template),
            });

            Utils.validate(schema, [
                {
                    value: { a: 'x' },
                    output: { a: 'x', b: 'This is x' },
                },
            ]);
        });

        it('should generate deep defaults on objects', () => {

            const schema = Jade.obj({
                a: Jade.any().default('x'),
                b: {
                    c: {
                        d: Jade.any().default('x'),
                    },
                },
                e: {
                    f: {
                        g: Jade.obj({
                            h: Jade.any().default('x'),
                        })
                            .default('someOtherDefault'),
                    },
                },
                i: Jade.obj(),
                j: Jade.obj().default(),
                k: {},
                l: {
                    m: {
                        n: Jade.num(),
                    },
                },
                o: Jade.obj({
                    p: Jade.any(),
                })
                    .default(),
                q: Jade.obj({}),
                r: Jade.obj({}).default(),
                s: Jade.obj().default(1),
            })
                .default();

            Utils.validate(schema, [
                {
                    value: {},
                    output: {
                        a: 'x',
                        b: {
                            c: { d: 'x' },
                        },
                        e: {
                            f: {
                                g: 'someOtherDefault',
                            },
                        },
                        j: {},
                        o: {},
                        r: {},
                        s: 1,
                    },
                },
            ]);
        });

        it('should generate deep defaults for non-native objects', () => {

            const custom = Jade.extend({ type: 'test', from: Jade.obj() });
            const schema = custom.test({
                a: custom.obj({
                    b: custom.test({
                        c: custom.any().default('x'),
                    }),
                }),
            })
                .default();

            Utils.validate(schema, [
                {
                    value: {},
                    output: {
                        a: { b: { c: 'x' } },
                    },
                },
            ]);
        });
    });

    describe('label()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.any().label(1)).toThrow('Label must be a string');
        });

        it('should avoid cloning if called twice', () => {

            const schema = Jade.any().label('x');

            expect(schema.label('x')).toBe(schema);
        });

        it('should set the label', () => {

            const schema = Jade.required().label('x');

            Utils.validate(schema, [
                {
                    value: undefined,
                    error: {
                        code: 'any.required',
                        message: 'x is required',
                        local: { label: 'x' },
                    },
                },
            ]);
        });

        it('should override labels', () => {

            const schema = Jade.required().label('x').label('y');

            Utils.validate(schema, [
                {
                    value: undefined,
                    error: {
                        code: 'any.required',
                        message: 'y is required',
                        local: { label: 'y' },
                    },
                },
            ]);
        });
    });

    describe('only()', () => {

        it('should avoid cloning if called twice', () => {

            const schema = Jade.any().only();

            expect(schema.only()).toBe(schema);
        });

        it('should behave like valid when combined with allow', () => {

            const schema = Jade.allow('x').only();

            Utils.validate(schema, [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should convert valid to allow when set to false', () => {

            const schema = Jade.num().valid('x').only(false);

            Utils.validate(schema, [{ value: 'x' }, { value: 1 }]);
        });

        it('should override flag only', () => {

            const schema = Jade.allow('x').only().only(false);

            Utils.validate(schema, [{ value: 'x' }, { value: 'y' }]);
        });
    });

    describe('allow()', () => {

        it('should set allowed values', () => {

            const schema = Jade.num().allow('x');

            Utils.validate(schema, [
                { value: undefined },
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should set duplicate allowed values', () => {

            const schema = Jade.num().allow('x', 'x');

            Utils.validate(schema, [
                { value: undefined },
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should set allowed values via multiple calls', () => {

            const schema = Jade.num().allow('x').allow('y');

            Utils.validate(schema, [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 'z',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should compare values deeply', () => {

            const schema = Jade.str().allow({ a: 1 });

            Utils.validate(schema, [
                { value: { a: 1 } },
                {
                    value: { a: 2 },
                    error: {
                        code: 'string.base',
                        message: 'unknown must be a string',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const schema = Jade.obj({
                a: 'x',
                b: Jade.num().allow(Jade.ref('a')),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'number.base',
                        message: 'b must be a number',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should set duplicate references', () => {

            const ref = Jade.ref('a');
            const schema = Jade.obj({
                a: 'x',
                b: Jade.num().allow(ref, ref),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'number.base',
                        message: 'b must be a number',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should support templates', () => {

            const template = Jade.template('This is {a}');
            const schema = Jade.obj({
                a: 'x',
                b: Jade.num().allow(template),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'This is x' } },
                {
                    value: { a: 'x', b: 'This is y' },
                    error: {
                        code: 'number.base',
                        message: 'b must be a number',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should override previous calls', () => {

            const schema = Jade.number().allow('x').allow(Jade.override, 'y');

            Utils.validate(schema, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('shoud remove all allowed values', () => {

            const schema = Jade.number().allow('x').allow(Jade.override);

            Utils.validate(schema, [
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('shoud remove all allowed values using valid', () => {

            const schema = Jade.number().allow('x').valid(Jade.override);

            Utils.validate(schema, [
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            // Validate that flag only is removed
            Utils.validate(schema.allow('x'), [{ value: 1 }, { value: 'x' }]);
        });

        it('should cancel out invalid calls', () => {

            const schema = Jade.num().allow('x', 'y').invalid('y');

            Utils.validate(schema, [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
                {
                    value: 'z',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should merge with valid calls', () => {

            const schema = Jade.allow('x').valid('y');

            Utils.validate(schema, [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 'z',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should work with complex call sequences', () => {

            const template = Jade.template('This is {a}');
            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: 'x',
                b: 'y',
                c: Jade.num().allow('a').invalid('b').allow('b').invalid(template).allow(ref).allow('c').invalid('a'),
            });

            Utils.validate(schema, [
                { value: { c: 'b' } },
                { value: { c: 'c' } },
                { value: { b: 'y', c: 'y' } },
                {
                    value: { c: 'a' },
                    error: {
                        code: 'any.invalid',
                        message: 'c must not be a, "This is {a}"',
                        local: { values: ['a', template], label: 'c' },
                    },
                },
                {
                    value: { a: 'x', c: 'This is x' },
                    error: {
                        code: 'any.invalid',
                        message: 'c must not be a, "This is {a}"',
                        local: { values: ['a', template], label: 'c' },
                    },
                },
            ]);
        });
    });

    describe('valid()', () => {

        it('should set valid values', () => {

            const schema = Jade.valid('x', 'y');

            Utils.validate(schema, [
                { value: undefined },
                { value: 'x' },
                { value: 'y' },
                {
                    value: 1,
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should set valid values via multiple calls', () => {

            const schema = Jade.valid('x').valid('y');

            Utils.validate(schema, [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 'z',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should compare values deeply', () => {

            const schema = Jade.valid({ a: 1 });

            Utils.validate(schema, [
                { value: { a: 1 } },
                {
                    value: { a: 2 },
                    error: {
                        code: 'any.only',
                        message: 'unknown must be { a: 1 }',
                        local: { values: [{ a: 1 }], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('a');
            const schema = Jade.obj({
                a: 'y',
                b: Jade.valid('x', ref),
            });

            Utils.validate(schema, [
                { value: { b: 'x' } },
                { value: { a: 'y', b: 'y' } },
                {
                    value: { a: 'y', b: 'z' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x, "a"',
                        local: { values: ['x', ref], label: 'b' },
                    },
                },
            ]);
        });

        it('should support templates', () => {

            const template = Jade.template('This is {a}');
            const schema = Jade.obj({
                a: 'x',
                b: template,
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'This is x' } },
                {
                    value: { a: 'x', b: 'This is y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be "This is {a}"',
                        local: { values: [template], label: 'b' },
                    },
                },
            ]);
        });

        it('should support templates with single expression', () => {

            const template = Jade.template('{a + 1}');
            const schema = Jade.obj({
                a: Jade.num(),
                b: template,
            });

            Utils.validate(schema, [
                { value: { a: 1, b: 2 } },
                {
                    value: { a: 1, b: 3 },
                    error: {
                        code: 'any.only',
                        message: 'b must be "{a + 1}"',
                        local: { values: [template], label: 'b' },
                    },
                },
            ]);
        });

        it('should override previous calls', () => {

            const schema = Jade.valid('x').valid(Jade.override, 'y');

            Utils.validate(schema, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should allow anything', () => {

            const schema = Jade.valid('x').valid(Jade.override);

            Utils.validate(schema, [{ value: 'x' }, { value: 'y' }, { value: 'z' }]);
            Utils.validate(schema.allow('x'), [{ value: 'x' }, { value: 'y' }]);                        // Validate that flag only is removed
        });

        it('should allow anything using allow', () => {

            const schema = Jade.valid('x').allow(Jade.override);

            Utils.validate(schema, [{ value: 'x' }, { value: 'y' }, { value: 'z' }]);
            Utils.validate(schema.allow('x'), [{ value: 'x' }, { value: 'y' }]);                        // Validate that flag only is removed
        });

        it('should compile valid values', () => {

            const ref = Jade.ref('a');
            const schema = Jade.compile({
                a: 'x',
                b: [ref, 'y'],
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                { value: { a: 'x', b: 'y' } },
                {
                    value: { a: 'x', b: 'z' },
                    error: {
                        code: 'any.only',
                        message: 'b must be y, "a"',
                        local: { values: ['y', ref], label: 'b' },
                    },
                },
            ]);
        });

        it('should override previous calls', () => {

            const schema = Jade.valid('x').valid(Jade.override, 'y');

            Utils.validate(schema, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should cancel out invalid calls', () => {

            const schema = Jade.valid('x', 'y').invalid('y');

            Utils.validate(schema, [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should merge with allow calls', () => {

            const schema = Jade.valid('x').allow('y');

            Utils.validate(schema, [
                { value: 'x' },
                { value: 'y' },
                {
                    value: 'z',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should work with complex call sequences', () => {

            const template = Jade.template('This is {a}');
            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: 'x',
                b: 'y',
                c: Jade.valid('a', 'b').invalid('b').allow('b', 'c').valid(ref, template).invalid(ref, 'a'),
            });

            Utils.validate(schema, [
                { value: { c: 'b' } },
                { value: { c: 'c' } },
                { value: { a: 'x', c: 'This is x' } },
                {
                    value: { a: 'x', c: 'This is y' },
                    error: {
                        code: 'any.only',
                        message: 'c must be b, c, "This is {a}"',
                        local: { values: ['b', 'c', template], label: 'c' },
                    },
                },
                {
                    value: { b: 'y', c: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'c must be b, c, "This is {a}"',
                        local: { values: ['b', 'c', template], label: 'c' },
                    },
                },
            ]);
        });
    });

    describe('invalid()', () => {

        it('should set invalid values', () => {

            const schema = Jade.invalid('x');

            Utils.validate(schema, [
                { value: undefined },
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should set invalid values via multiple calls', () => {

            const schema = Jade.invalid('x').invalid('y');

            Utils.validate(schema, [
                {
                    value: 'x',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
                {
                    value: 'y',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be x, y',
                        local: { values: ['x', 'y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should compare values deeply', () => {

            const schema = Jade.invalid({ a: 1 });

            Utils.validate(schema, [
                {
                    value: { a: 1 },
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be { a: 1 }',
                        local: { label: 'unknown', values: [{ a: 1 }] },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('a');
            const schema = Jade.obj({
                a: 'x',
                b: Jade.invalid(ref),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'y' } },
                {
                    value: { a: 'x', b: 'x' },
                    error: {
                        code: 'any.invalid',
                        message: 'b must not be "a"',
                        local: { values: [ref], label: 'b' },
                    },
                },
            ]);
        });

        it('should support templates', () => {

            const template = Jade.template('This is {a}');
            const schema = Jade.obj({
                a: 'x',
                b: Jade.invalid(template),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                {
                    value: { a: 'x', b: 'This is x' },
                    error: {
                        code: 'any.invalid',
                        message: 'b must not be "This is {a}"',
                        local: { values: [template], label: 'b' },
                    },
                },
            ]);
        });

        it('should support templates with single expression', () => {

            const template = Jade.template('{a + 1}');
            const schema = Jade.obj({
                a: Jade.num(),
                b: Jade.invalid(template),
            });

            Utils.validate(schema, [
                { value: { a: 1, b: 3 } },
                {
                    value: { a: 1, b: 2 },
                    error: {
                        code: 'any.invalid',
                        message: 'b must not be "{a + 1}"',
                        local: { values: [template], label: 'b' },
                    },
                },
            ]);
        });

        it('should override previous calls', () => {

            const schema = Jade.invalid('x').invalid(Jade.override, 'y');

            Utils.validate(schema, [
                { value: 'x' },
                {
                    value: 'y',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be y',
                        local: { values: ['y'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should allow anything', () => {

            const schema = Jade.invalid('x').invalid(Jade.override);

            Utils.validate(schema, [{ value: 'x' }, { value: 'y' }, { value: 'z' }]);
        });

        it('should cancel out allow and valid calls', () => {

            const schema = Jade.invalid('y').invalid('z').allow('y').valid('z');

            Utils.validate(schema, [
                { value: 'y' },
                { value: 'z' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be y, z',
                        local: { values: ['y', 'z'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should remove flag only', () => {

            const schema = Jade.valid('x').invalid('x');

            Utils.validate(schema, [
                { value: 'y' },
                {
                    value: 'x',
                    error: {
                        code: 'any.invalid',
                        message: 'unknown must not be x',
                        local: { values: ['x'], label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(schema.allow('x'), [{ value: 'x' }, { value: 'y' }]);
        });

        it('should work with complex call sequences', () => {

            const template = Jade.template('This is {a}');
            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: 'x',
                b: 'y',
                c: Jade.num().allow('a').invalid(ref, template).allow(ref),
            });

            Utils.validate(schema, [
                { value: { c: 'a' } },
                { value: { b: 'y', c: 'y' } },
                {
                    value: { a: 'x', c: 'This is x' },
                    error: {
                        code: 'any.invalid',
                        message: 'c must not be "This is {a}"',
                        local: { values: [template], label: 'c' },
                    },
                },
            ]);
        });
    });

    describe('strip()', () => {

        it('should validate and return undefined', () => {

            const schema = Jade.num().strip();

            Utils.validate(schema, [
                {
                    value: 1,
                    output: undefined,
                },
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should avoid cloning if called twice', () => {

            const schema = Jade.any().strip();

            expect(schema.strip()).toBe(schema);
        });

        it('should cancel strip', () => {

            const schema = Jade.num().strip().strip(false);

            Utils.validate(schema, [{ value: 1 }]);
        });

        it('should strip from objects', () => {

            const schema = Jade.obj({
                a: Jade.any().strip(),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 1, b: 'x' },
                    output: { b: 'x' },
                },
            ]);
        });

        it('should strip nested child', () => {

            const schema = Jade.obj({
                a: {
                    b: Jade.any().strip(),
                    c: 'x',
                },
                d: 'y',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: { b: 1, c: 'x' },
                        d: 'y',
                    },
                    output: {
                        a: { c: 'x' },
                        d: 'y',
                    },
                },
            ]);
        });

        it('should strip from arrays', () => {

            const schema = Jade.arr().ordered(Jade.valid('x').strip(), 'y');

            Utils.validate(schema, [
                {
                    value: ['x', 'y'],
                    output: ['y'],
                },
            ]);
        });
    });

    describe('raw()', () => {

        it('should validate and return the raw value', () => {

            Utils.validate(Jade.str().trim().convert().uppercase().raw(), [
                {
                    value: '  xyz  ',
                    output: '  xyz  ',
                },
            ]);

            Utils.validate(Jade.num().convert().raw(), [
                {
                    value: '1',
                    output: '1',
                },
                {
                    value: 'x',
                    error: {
                        code: 'number.base',
                        message: 'unknown must be a number',
                        local: { label: 'unknown' },
                    },
                },
            ]);

            Utils.validate(Jade.date().convert().raw(), [
                {
                    value: '01/01/2020',
                    output: '01/01/2020',
                },
                {
                    value: 'x',
                    error: {
                        code: 'date.base',
                        message: 'unknown must be a valid date',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should avoid cloning if called twice', () => {

            const schema = Jade.num().convert().raw();

            expect(schema.raw()).toBe(schema);
        });

        it('should cancel raw', () => {

            const schema = Jade.num().convert().raw().raw(false);

            Utils.validate(schema, [
                {
                    value: '1',
                    output: 1,
                },
            ]);
        });
    });

    describe('switch()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.switch('a')).toThrow('Branches must have at least 1 branch');
            expect(() => Jade.switch('a', [])).toThrow('Branches must have at least 1 branch');
        });

        it('should throw on otherwise not being on the last branch', () => {

            expect(() => {

                Jade.switch('a', [
                    { is: 'x', then: 1, otherwise: 2 },
                    { is: 1, then: 'x' },
                ]);
            }).toThrow('Option otherwise can only be provided on the last branch');
        });

        it('should validate branches', () => {

            const schema = Jade.obj({
                a: Jade.num(),
                b: Jade.switch('a', { is: 1, then: 'x' }, { is: 2, then: 'y' }),
            });

            Utils.validate(schema, [
                { value: { a: 1, b: 'x' } },
                { value: { a: 2, b: 'y' } },
                {
                    value: { a: 1, b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { a: 2, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should validate branches with no breaks', () => {

            const schema = Jade.obj({
                a: Jade.num(),
                b: Jade.switch('a',
                    { is: Jade.num().multiple(2), then: 'x', break: false },
                    { is: Jade.num().multiple(5), then: 'y', otherwise: 'z' },
                ),
            });

            Utils.validate(schema, [
                { value: { a: 2, b: 'z' } },
                { value: { a: 5, b: 'y' } },
                { value: { a: 10, b: 'y' } },
                {
                    value: { a: 2, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be z',
                        local: { values: ['z'], label: 'b' },
                    },
                },
                {
                    value: { a: 5, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should validate otherwise', () => {

            const schema = Jade.obj({
                a: Jade.num(),
                b: Jade.switch('a', { is: 1, then: 'x' }, { is: 2, then: 'y', otherwise: 'z' }),
            });

            Utils.validate(schema, [
                { value: { a: 1, b: 'x' } },
                { value: { a: 2, b: 'y' } },
                { value: { a: 3, b: 'z' } },
                {
                    value: { a: 1, b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { a: 2, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
                {
                    value: { a: 3, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be z',
                        local: { values: ['z'], label: 'b' },
                    },
                },
            ]);
        });
    });

    describe('when()', () => {

        it('should throw on invalid parameters', () => {

            expect(() => Jade.when(1)).toThrow('Subject must be a string or a valid reference');
            expect(() => Jade.when('a', { is: 'x', not: 'x' })).toThrow('Option is and not cannot be provided together');
            expect(() => Jade.when('a', {})).toThrow('Option then or otherwise must be provided');
            expect(() => Jade.when('a', { is: 'x' })).toThrow('Option then or otherwise must be provided');
        });

        it('should validate conditions', () => {

            const schema = Jade.obj({
                a: Jade.bool(),
                b: Jade.when('a', { is: true, then: Jade.forbidden(), otherwise: Jade.required() }),
            });

            Utils.validate(schema, [
                { value: { a: true } },
                {
                    value: { a: true, b: 'x' },
                    error: {
                        code: 'any.forbidden',
                        message: 'b is forbidden',
                        local: { label: 'b' },
                    },
                },
                { value: { a: false, b: 'x' } },
                {
                    value: { a: false },
                    error: {
                        code: 'any.required',
                        message: 'b is required',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should allow reference subjects', () => {

            const schema = Jade.obj({
                a: Jade.bool(),
                b: Jade.when(Jade.ref('a'), { is: true, then: 1 }),
            });

            Utils.validate(schema, [
                { value: { a: true, b: 1 } },
                {
                    value: { a: true, b: 2 },
                    error: {
                        code: 'any.only',
                        message: 'b must be 1',
                        local: { label: 'b', values: [1] },
                    },
                },
            ]);
        });

        it('should default to truthy values if no is or not is provided', () => {

            const schema = Jade.obj({
                a: Jade.any(),
                b: Jade.when('a', {
                    then: Jade.required(),
                    otherwise: Jade.forbidden(),
                }),
            });

            Utils.validate(schema, [
                { value: { a: null } },
                { value: { a: 0 } },
                { value: { a: '' } },
                { value: { a: false } },
                { value: { a: 1, b: 'x' } },
                {
                    value: { a: null, b: 'x' },
                    error: {
                        code: 'any.forbidden',
                        message: 'b is forbidden',
                        local: { label: 'b' },
                    },
                },
                {
                    value: { a: 0, b: 'x' },
                    error: {
                        code: 'any.forbidden',
                        message: 'b is forbidden',
                        local: { label: 'b' },
                    },
                },
                {
                    value: { a: '', b: 'x' },
                    error: {
                        code: 'any.forbidden',
                        message: 'b is forbidden',
                        local: { label: 'b' },
                    },
                },
                {
                    value: { a: false, b: 'x' },
                    error: {
                        code: 'any.forbidden',
                        message: 'b is forbidden',
                        local: { label: 'b' },
                    },
                },
                {
                    value: { a: 1 },
                    error: {
                        code: 'any.required',
                        message: 'b is required',
                        local: { label: 'b' },
                    },
                },
            ]);
        });

        it('should allow only otherwise to be set', () => {

            const schema = Jade.obj({
                a: Jade.bool(),
                b: Jade.num().when('a', { is: true, otherwise: 'x' }),
            });

            Utils.validate(schema, [
                { value: { a: true, b: 1 } },
                { value: { a: false, b: 'x' } },
                {
                    value: { a: false, b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
            ]);
        });

        it('should validate multiple conditions', () => {

            const schema = Jade.obj({
                a: Jade.bool(),
                b: Jade.bool(),
                c: Jade.when('a', { is: true, then: 'x' }).when('b', { is: true, then: 'y' }),
            });

            Utils.validate(schema, [
                { value: { a: false, b: true, c: 'y' } },
                { value: { a: true, b: false, c: 'x' } },
                { value: { a: true, b: true, c: 'y' } },
                {
                    value: { a: true, b: true, c: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'c must be y',
                        local: { values: ['y'], label: 'c' },
                    },
                },
                {
                    value: { a: true, b: false, c: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'c must be x',
                        local: { values: ['x'], label: 'c' },
                    },
                },
            ]);
        });

        it('should validate multiple conditions with breaks', () => {

            const schema = Jade.obj({
                a: Jade.bool(),
                b: Jade.bool(),
                c: Jade.when('a', { is: true, then: 'x', break: true }).when('b', { is: true, then: 'y' }),
            });

            Utils.validate(schema, [
                { value: { a: true, b: true, c: 'x' } },
                {
                    value: { a: true, b: true, c: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'c must be x',
                        local: { values: ['x'], label: 'c' },
                    },
                },
            ]);
        });

        it('should validate nested conditions ', () => {

            const schema = Jade.obj({
                a: Jade.any(),
                b: Jade.when('a', {
                    is: Jade.str(),
                    then: 'x',
                    otherwise: Jade.when('a', {
                        is: Jade.num(),
                        then: 'y',
                        otherwise: 'z',
                    }),
                }),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 'x' } },
                { value: { a: 1, b: 'y' } },
                { value: { a: false, b: 'z' } },
                {
                    value: { a: 'x', b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { a: 1, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
                {
                    value: { a: false, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be z',
                        local: { values: ['z'], label: 'b' },
                    },
                },
            ]);
        });

        it('should reverse branches if not is used', () => {

            const schema = Jade.obj({
                a: Jade.bool(),
                b: Jade.when('a', { not: true, then: 'x', otherwise: 'y' }),
            });

            Utils.validate(schema, [
                { value: { a: true, b: 'y' } },
                { value: { a: false, b: 'x' } },
                {
                    value: { a: false, b: 'y' },
                    error: {
                        code: 'any.only',
                        message: 'b must be x',
                        local: { values: ['x'], label: 'b' },
                    },
                },
                {
                    value: { a: true, b: 'x' },
                    error: {
                        code: 'any.only',
                        message: 'b must be y',
                        local: { values: ['y'], label: 'b' },
                    },
                },
            ]);
        });

        it('should validate conditions on object selves', () => {

            const schema = Jade.obj({ a: Jade.bool() }).when('.a', {
                is: true,
                then: Jade.obj({
                    b: Jade.required(),
                    c: Jade.required(),
                }),
                otherwise: Jade.obj({
                    b: Jade.forbidden(),
                    c: Jade.forbidden(),
                }),
            });

            Utils.validate(schema, [
                { value: { a: true, b: 'x', c: 'y' } },
                {
                    value: { a: true },
                    error: {
                        code: 'any.required',
                        message: 'b is required',
                        local: { label: 'b' },
                    },
                },
                { value: { a: false } },
                {
                    value: { a: false, b: 'x' },
                    error: {
                        code: 'any.forbidden',
                        message: 'b is forbidden',
                        local: { label: 'b' },
                    },
                },
            ]);
        });
    });

    describe('validate()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.num().validate('x', { presence: 'x' })).toThrow('Option presence must be optional, required or forbidden');
            expect(() => Jade.num().validate('x', { label: 'x' })).toThrow('Option label must be path or key');
        });

        it('should collect multiple rule errors', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().min(ref).max(10).multiple(5),
                b: 'x',
            });

            Utils.validate(schema, { abortEarly: false }, [
                {
                    value: { a: 14, b: 'x' },
                    error: [
                        {
                            code: 'any.ref',
                            message: 'Rule "min" references "b" which must be a number',
                            local: { label: 'a', name: 'min', ref, message: 'must be a number' },
                        },
                        {
                            code: 'number.max',
                            message: 'a must be less than or equal to 10',
                            local: { label: 'a', limit: 10 },
                        },
                        {
                            code: 'number.multiple',
                            message: 'a must be a multiple of 5',
                            local: { label: 'a', factor: 5 },
                        },
                    ],
                },
            ]);
        });
    });

    describe('attempt()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.any().attempt(1, { abortEarly: false })).toThrow('Option abortEarly only applies to validate()');
        });

        it('should throw when validation fails', () => {

            const schema = Jade.num().min(1);

            expect(() => schema.attempt('x')).toThrow('unknown must be a number');
            expect(() => schema.attempt(0)).toThrow('unknown must be greater than or equal to 1');
        });

        it('should return value when validation passes', () => {

            const schema = Jade.num().min(1);

            expect(schema.attempt(1)).toBe(1);
            expect(schema.convert().attempt('1')).toBe(1);
        });
    });

    describe('rule()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.rule(1)).toThrow('Method must be a function');
            expect(() => Jade.rule(() => { }, 1)).toThrow('Description must be a string');
        });

        it('should throw when custom rules throw', () => {

            const error = new Error('test');
            const schema = Jade.rule(() => {

                throw error;
            });

            Utils.validate(schema, [
                {
                    value: 'x',
                    error: {
                        code: 'any.rule',
                        message: 'unknown fails validation due to test',
                        local: { error, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate rules', () => {

            const error = new Error('invalid');
            const schema = Jade.rule((value) => {

                if (value === 'test') {
                    return value;
                }

                throw error;
            });

            Utils.validate(schema, [
                { value: 'test' },
                {
                    value: 'x',
                    error: {
                        code: 'any.rule',
                        message: 'unknown fails validation due to invalid',
                        local: { error, label: 'unknown' },
                    },
                },
            ]);
        });

        it('should compile rules', () => {

            const error = new Error('Not valid');
            const schema = Jade.compile({
                a: (value) => {

                    if (value === 'x') {
                        return value;
                    }

                    throw error;
                },
            });

            Utils.validate(schema, [
                { value: { a: 'x' } },
                {
                    value: { a: 'y' },
                    error: {
                        code: 'any.rule',
                        message: 'a fails validation due to Not valid',
                        local: { error, label: 'a' },
                    },
                },
            ]);
        });

        it('should throw existing messages', () => {

            const schema = Jade.rule((value, { error }) => {

                if (value === 'test') {
                    return value;
                }

                return error('any.only', { values: ['test'] });
            });

            Utils.validate(schema, [
                { value: 'test' },
                {
                    value: 'x',
                    error: {
                        code: 'any.only',
                        message: 'unknown must be test',
                        local: { values: ['test'], label: 'unknown' },
                    },
                },
            ]);
        });

        it('should define new messages and return them', () => {

            const schema = Jade.any()
                .rule((value, { error }) => {

                    if (value === 'special') {
                        return value;
                    }

                    return error('custom.special');
                })
                .messages({
                    'custom.special': 'Not special enough!',
                });

            Utils.validate(schema, [
                { value: 'special' },
                {
                    value: 'x',
                    error: {
                        code: 'custom.special',
                        message: 'Not special enough!',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should modify value', () => {

            const schema = Jade.rule((value) => {

                if (typeof value === 'number') {
                    return value + 1;
                }

                return value;
            });

            Utils.validate(schema, [
                { value: 'x' },
                {
                    value: 1,
                    output: 2,
                },
            ]);
        });
    });

    describe('annotate()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.any().annotate()).toThrow('Notes must contain at least one note');
            expect(() => Jade.any().annotate('x', 1)).toThrow('Notes must contain only strings');
        });
    });
});
