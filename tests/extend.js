'use strict';

const Lyra = require('../src');
const Utils = require('./utils');

describe('extend()', () => {
    it('should extend an existing type and its alias implicitly', () => {
        const custom = Lyra.extend({
            type: 'string',
            from: Lyra.str(),

            rules: {
                special: {
                    validate: () => {
                        return 'special';
                    },
                },
            },
        });

        const a = custom.str().special();
        const b = custom.string().special();

        Utils.validate(a, [
            {
                value: 'x',
                output: 'special',
            },
        ]);

        Utils.validate(b, [
            {
                value: 'x',
                output: 'special',
            },
        ]);
    });

    it('should extend an existing type with aliases', () => {
        const custom = Lyra.extend({
            type: 'string',
            alias: ['str', 'x'],
            from: Lyra.str(),

            rules: {
                special: {
                    validate: () => {
                        return 'special';
                    },
                },
            },
        });

        const a = custom.str().special();
        const b = custom.x().special();

        Utils.validate(a, [
            {
                value: 'x',
                output: 'special',
            },
        ]);

        Utils.validate(b, [
            {
                value: 'x',
                output: 'special',
            },
        ]);

        // Verify that string's aliases are retained when extending further
        const custom2 = custom.extend({
            type: 'string',
            from: custom.str(),
        });

        const c = custom2.x().special();

        Utils.validate(c, [
            {
                value: 'x',
                output: 'special',
            },
        ]);
    });

    it('should throw if provide an invalid type/alias', () => {
        expect(() => Lyra.extend({ type: 'ref' })).toThrow('Invalid extension ref');
        expect(() => Lyra.extend({ type: 'x', alias: 'string' })).toThrow('Invalid alias string');
        expect(() => Lyra.extend({ type: 'x', alias: ['y', 'string'] })).toThrow('Invalid alias string');
        expect(() => Lyra.extend({ type: 'special', alias: 'special' })).toThrow('Invalid alias special');

        const custom = Lyra.extend({ type: 'x', alias: 'y' });

        expect(() => custom.extend({ type: 'z', alias: 'x' })).toThrow('Invalid alias x');
        expect(() => custom.extend({ type: 'y' })).not.toThrow();
    });

    it('should extend an alias to a different type', () => {
        const custom = Lyra.extend({
            type: 'bool',
            from: Lyra.num(),
        });

        const a = custom.bool();
        const b = custom.boolean();

        Utils.validate(a, [
            {
                value: true,
                error: {
                    code: 'number.base',
                    message: 'unknown must be a number',
                    local: { label: 'unknown' },
                },
            },
        ]);

        Utils.validate(b, [
            {
                value: 1,
                error: {
                    code: 'boolean.base',
                    message: 'unknown must be a boolean',
                    local: { label: 'unknown' },
                },
            },
        ]);

        // Verify that bool and boolean are detached
        const custom2 = custom.extend({
            type: 'boolean',
            from: custom.boolean(),
        });

        const c = custom2.bool();

        Utils.validate(c, [
            {
                value: true,
                error: {
                    code: 'number.base',
                    message: 'unknown must be a number',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should throw if from or alias is provided on multiple types', () => {
        expect(() => Lyra.extend({ type: ['string', 'number'], from: Lyra.str() })).toThrow('from is forbidden');
        expect(() => Lyra.extend({ type: ['string'], from: Lyra.str() })).not.toThrow();
        expect(() => Lyra.extend({ type: /^s/, from: Lyra.str() })).toThrow('from is forbidden');

        expect(() => Lyra.extend({ type: ['string', 'number'], alias: 'combo' })).toThrow('alias is forbidden');
        expect(() => Lyra.extend({ type: /^s/, alias: 'combo' })).toThrow('alias is forbidden');
    });

    it('should extend multiple types', () => {
        const custom = Lyra.extend({
            type: ['any', 'string', 'number'],

            rules: {
                special: {
                    validate: () => {
                        return 'special';
                    },
                },
            },
        });

        const a = custom.any().special();
        const b = custom.string().special();
        const c = custom.number().special();
        const d = custom.num().special(); // Verify that aliases are retained

        Utils.validate(a, [
            {
                value: 'x',
                output: 'special',
            },
        ]);

        Utils.validate(b, [
            {
                value: 'x',
                output: 'special',
            },
        ]);

        Utils.validate(c, [
            {
                value: 1,
                output: 'special',
            },
        ]);

        Utils.validate(d, [
            {
                value: 1,
                output: 'special',
            },
        ]);
    });

    it('should extend multiple types using regular expressions', () => {
        const custom = Lyra.extend({
            type: /^a/,

            rules: {
                special: {
                    validate: () => {
                        return 'special';
                    },
                },
            },
        });

        const a = custom.arr().special();
        const b = custom.alt(custom.str()).special();

        Utils.validate(a, [
            {
                value: [],
                output: 'special',
            },
        ]);

        Utils.validate(b, [
            {
                value: 'x',
                output: 'special',
            },
        ]);
    });

    it('should extend a complex base', () => {
        const custom = Lyra.extend({
            type: 'test',
            from: Lyra.arr(Lyra.str().required()),
        });

        const schema = custom.test();

        // Known implementation limitation
        Utils.validate(schema, [
            { value: ['x', 'y'] },
            {
                value: 'x',
                error: {
                    code: 'array.base',
                    message: 'unknown must be an array',
                    local: { label: 'unknown' },
                },
            },
            {
                value: [],
                error: {
                    code: 'array.requiredUnknowns',
                    message: 'unknown does not have 1 required value',
                    local: { unknownMisses: 1, label: 'unknown' },
                },
            },
        ]);
    });

    it('should extend coerce', () => {
        const custom = Lyra.extend({
            type: 'string',
            from: Lyra.str(),
            messages: {
                'string.coerce': 'Must not be a boolean',
            },

            coerce: (value, { error }) => {
                if (value === 'true' ||
                    value === 'false') {

                    return error('string.coerce');
                }

                return value;
            },
        });

        const schema = custom.str().convert();

        Utils.validate(schema, [
            { value: 'x' },
            {
                value: 1,
                output: '1',
            },
            {
                value: true,
                error: {
                    code: 'string.coerce',
                    message: 'Must not be a boolean',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should extend validate', () => {
        const custom = Lyra.extend({
            type: 'object',
            from: Lyra.obj(),
            messages: {
                'object.date': 'Must not be a date',
            },

            validate: (value, { error }) => {
                if (value instanceof Date) {
                    return error('object.date');
                }

                return value;
            },
        });

        const schema = custom.obj();

        Utils.validate(schema, [
            { value: {} },
            {
                value: [],
                error: {
                    code: 'object.base',
                    message: 'unknown must be an object',
                    local: { label: 'unknown' },
                },
            },
            {
                value: new Date(),
                error: {
                    code: 'object.date',
                    message: 'Must not be a date',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should extend rebuild', () => {
        const custom = Lyra.extend({
            type: 'object',
            from: Lyra.obj(),

            rebuild: (schema) => {
                if (!schema.$terms.keys) {
                    return;
                }

                for (const child of schema.$terms.keys) {
                    child.schema = child.schema.strip();
                }
            },

            rules: {
                stripAll: {
                    method() {
                        return this.clone().$rebuild();
                    },
                },
            },
        });

        const schema = custom
            .obj({
                a: Lyra.valid('x'),
                b: Lyra.num(),
            })
            .stripAll();

        Utils.validate(schema, [
            {
                value: {
                    a: 'x',
                    b: 1,
                },
                output: {},
            },
        ]);
    });

    it('should extend overrides', () => {
        const custom = Lyra.extend({
            type: 'object',
            from: Lyra.obj(),

            overrides: {
                length(limit) {
                    if (limit === undefined) {
                        limit = 100;
                    }

                    return this.$super.length(limit);
                },
            },
        });

        const schema = custom.obj().length();

        Utils.validate(schema, [
            {
                value: {},
                error: {
                    code: 'object.length',
                    message: 'unknown must have 100 key(s)',
                    local: { limit: 100, label: 'unknown' },
                },
            },
        ]);
    });

    it('should throw when overriding a missing method', () => {
        expect(() => {
            Lyra.extend({
                type: 'object',
                from: Lyra.obj(),

                overrides: {
                    someUnknownMethod() {
                        return 1;
                    },
                },
            });
        }).toThrow('Cannot override missing someUnknownMethod');
    });

    it('should extend args', () => {
        const custom = Lyra.extend({
            type: 'array',
            from: Lyra.arr(),

            args: (schema, ...items) => {
                return schema.ordered(...items);
            },
        });

        const schema = custom.arr(custom.str(), custom.num());

        Utils.validate(schema, [
            { value: ['x', 1] },
            {
                value: ['x', 'x'],
                error: {
                    code: 'number.base',
                    message: '1 must be a number',
                    local: { label: '1' },
                },
            },
        ]);
    });

    it('should override flags', () => {
        const custom = Lyra.extend({
            type: 'string',
            from: Lyra.str(),

            flags: {
                trim: true,
            },
        });

        const schema = custom.str().convert();

        Utils.validate(schema, [
            {
                value: ' a ',
                output: 'a',
            },
        ]);
    });

    it('should extend messages with templates', () => {
        const custom = Lyra.extend({
            type: 'number',
            from: Lyra.num(),
            messages: {
                'number.base': Lyra.template('{$label} is not good enough!'),
            },
        });

        const schema = custom.num();

        Utils.validate(schema, { context: { label: 'x' } }, [
            {
                value: 'x',
                error: {
                    code: 'number.base',
                    message: 'x is not good enough!',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should properly merge values terms', () => {
        const custom = Lyra.extend({
            type: 'test',
            terms: {
                x: { default: null },
            },
            messages: {
                'test.special': 'Not good enough',
            },

            validate: (value, { error, schema }) => {
                if (!schema.$terms.x) {
                    return value;
                }

                if (schema.$terms.x.has(value)) {
                    return error('test.special');
                }

                return value;
            },

            rules: {
                special: {
                    method(x) {
                        const target = this.clone();

                        target.$terms.x = target.$terms.x || Lyra.values();
                        target.$terms.x.add(x);
                        return target;
                    },
                },
            },
        });

        const a = custom.test();
        const b = custom.test().special(1);
        const c = custom.test().special(2);

        Utils.validate(a, [{ value: 1 }, { value: 2 }]);

        Utils.validate(a.merge(b), [
            { value: 2 },
            {
                value: 1,
                error: {
                    code: 'test.special',
                    message: 'Not good enough',
                    local: { label: 'unknown' },
                },
            },
        ]);

        Utils.validate(b.merge(a), [{ value: 1 }, { value: 2 }]);

        Utils.validate(b.merge(c), [
            {
                value: 1,
                error: {
                    code: 'test.special',
                    message: 'Not good enough',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 2,
                error: {
                    code: 'test.special',
                    message: 'Not good enough',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should extend complicated docs example', () => {
        const Semver = require('semver');

        const custom = Lyra.extend((root) => ({
            type: 'semver',
            from: root.str(),
            flags: {
                clean: false,
            },
            messages: {
                'semver.base': '{#label} must have valid semver format',
                'semver.condition': '{#label} does not satisfy condition "{#condition}"',
                'semver.gt': '{#label} must be greater than {#limit}',
                'semver.gte': '{#label} must be greater than or equal to {#limit}',
                'semver.lt': '{#label} must be less than {#limit}',
                'semver.lte': '{#label} must be less than or equal to {#limit}',
            },

            coerce: (value, { schema }) => {
                const coerced = Semver.coerce(value);

                if (!coerced) {
                    return value;
                }

                value = coerced.version;
                if (schema.$getFlag('clean')) {
                    value = Semver.clean(value);
                }

                return value;
            },

            validate: (value, { error, schema }) => {
                if (!Semver.valid(value)) {
                    return error('semver.base');
                }

                const condition = schema.$getFlag('condition');
                if (condition &&
                    !Semver.satisfies(value, condition)) {

                    return error('semver.condition', { condition });
                }

                return value;
            },

            rules: {
                clean: {
                    method(enabled = true) {
                        return this.$setFlag('clean', enabled);
                    },
                },

                condition: {
                    method(condition) {
                        if (typeof condition !== 'string') {
                            throw new Error('Condition must be a string');
                        }

                        return this.$setFlag('condition', condition);
                    },
                },

                cmp: {
                    args: {
                        limit: {
                            ref: true,
                            assert: root.str().custom((value) => {
                                if (Semver.valid(value)) {
                                    return value;
                                }

                                throw new Error('Invalid limit');
                            }),
                        },
                    },

                    method: false,
                    validate: (value, { error }, { limit }, { args, name, operator }) => {
                        if (!Semver.cmp(value, operator, limit)) {
                            return error(`semver.${name}`, { limit: args.limit });
                        }

                        return value;
                    },
                },

                lt: {
                    method(limit) {
                        return this.$addRule({ name: 'lt', method: 'cmp', args: { limit }, operator: '<' });
                    },
                },

                lte: {
                    method(limit) {
                        return this.$addRule({ name: 'lte', method: 'cmp', args: { limit }, operator: '<=' });
                    },
                },

                gt: {
                    method(limit) {
                        return this.$addRule({ name: 'gt', method: 'cmp', args: { limit }, operator: '>' });
                    },
                },

                gte: {
                    method(limit) {
                        return this.$addRule({ name: 'gte', method: 'cmp', args: { limit }, operator: '>=' });
                    },
                },
            },
        }));

        const a = custom.semver();
        const b = custom.semver().convert();
        const c = custom.semver().clean().convert();
        const d = custom.semver().condition('1.x || >=2.5.0 || 5.0.0 - 7.2.3');
        const e = custom.semver().lt('2.0.0');
        const ref = custom.ref('b');
        const f = custom.obj({
            a: custom.semver().gt(ref),
            b: custom.semver().convert(),
        });

        expect(() => custom.semver().condition(1)).toThrow('Condition must be a string');
        expect(() => custom.semver().lt(1)).toThrow('limit must be a string');
        expect(() => custom.semver().lt('x')).toThrow('Invalid limit');

        Utils.validate(a, [
            { value: '2.0.0' },
            {
                value: 1,
                error: {
                    code: 'string.base',
                    message: 'unknown must be a string',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 'v2',
                error: {
                    code: 'semver.base',
                    message: 'unknown must have valid semver format',
                    local: { label: 'unknown' },
                },
            },
        ]);

        Utils.validate(b, [
            {
                value: 'v2',
                output: '2.0.0',
            },
            {
                value: 'x',
                error: {
                    code: 'semver.base',
                    message: 'unknown must have valid semver format',
                    local: { label: 'unknown' },
                },
            },
        ]);

        Utils.validate(c, [
            {
                value: ' v=2.0.0 ',
                output: '2.0.0',
            },
        ]);

        Utils.validate(d, [
            { value: '1.2.3' },
            {
                value: '0.9.0',
                error: {
                    code: 'semver.condition',
                    message: 'unknown does not satisfy condition "1.x || >=2.5.0 || 5.0.0 - 7.2.3"',
                    local: { label: 'unknown', condition: '1.x || >=2.5.0 || 5.0.0 - 7.2.3' },
                },
            },
        ]);

        Utils.validate(e, [
            { value: '1.9.9' },
            {
                value: '2.0.1',
                error: {
                    code: 'semver.lt',
                    message: 'unknown must be less than 2.0.0',
                    local: { label: 'unknown', limit: '2.0.0' },
                },
            },
        ]);

        Utils.validate(f, [
            {
                value: { a: '2.0.1', b: 'v2' },
                output: { a: '2.0.1', b: '2.0.0' },
            },
            {
                value: { a: '2.0.1', b: '2.1.0' },
                error: {
                    code: 'semver.gt',
                    message: 'a must be greater than "b"',
                    local: { label: 'a', limit: ref },
                },
            },
        ]);
    });

    it('should throw on defined terms', () => {
        expect(() => {
            Lyra.extend({
                type: 'object',
                from: Lyra.obj(),

                terms: {
                    keys: { default: ['x'] },
                },
            });
        }).toThrow('Terms keys has already been defined');
    });

    it('should throw on defined rules', () => {
        expect(() => {
            Lyra.extend({
                type: 'number',
                from: Lyra.num(),

                rules: {
                    max: {
                        method() {
                            return this;
                        },
                    },
                },
            });
        }).toThrow('Rule max has already been defined');
    });

    it('should throw on unsupported data types for terms', () => {
        expect(() => {
            Lyra.extend({
                type: 'test',
                terms: {
                    value: { default: 1 },
                },
            });
        }).toThrow('terms.value.default must match at least one of the provided schemas');
    });

    it('should throw on empty rules', () => {
        expect(() => {
            Lyra.extend({
                type: 'test',
                rules: {
                    special: {},
                },
            });
        }).toThrow('rules.special.validate is required');
    });

    it('should throw on private rules missing validate method', () => {
        expect(() => {
            Lyra.extend({
                type: 'test',
                rules: {
                    special: {
                        method: false,
                    },
                },
            });
        }).toThrow('rules.special.validate is required');
    });

    it('should throw on missing error codes', () => {
        const custom = Lyra.extend({
            type: 'test',
            from: Lyra.str(),

            rules: {
                special: {
                    validate: (_, { error }) => {
                        return error('test.special');
                    },
                },
            },
        });

        const schema = custom.test().special();

        expect(() => schema.validate('x')).toThrow('Message test.special is not defined');
    });

    describe('$createError()', () => {
        it('should not allow passing custom labels', () => {
            const custom = Lyra.extend({
                type: 'string',
                from: Lyra.str(),

                rules: {
                    special: {
                        validate: (_, { error }) => {
                            return error('string.base', { label: 'x' });
                        },
                    },
                },
            });

            const schema = custom.str().special();

            expect(() => schema.validate('x')).toThrow('Cannot pass custom label as local');
        });
    });
});
