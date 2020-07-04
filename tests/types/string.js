'use strict';

const Lyra = require('../../src');
const Utils = require('../utils');

describe('string()', () => {
    it('should validate strings', () => {
        const schema = Lyra.str();

        Utils.validate(schema, [
            { value: 'x' },
            {
                value: 1,
                error: {
                    code: 'string.base',
                    message: 'unknown must be a string',
                    local: { label: 'unknown' },
                },
            },
            {
                value: new String('x'),
                error: {
                    code: 'string.base',
                    message: 'unknown must be a string',
                    local: { label: 'unknown' },
                },
            },
            {
                value: '',
                error: {
                    code: 'string.empty',
                    message: 'unknown must not be an empty string',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should allow empty string if specified', () => {
        const schema = Lyra.str().allow('');

        Utils.validate(schema, [{ value: '' }]);
    });

    it('should coerce to strings', () => {
        const schema = Lyra.str().convert();

        Utils.validate(schema, [
            { value: 'x' },
            {
                value: 1,
                output: '1',
            },
            {
                value: /x/g,
                output: '/x/g',
            },
        ]);
    });

    describe('length()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.str().length('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.str().length(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should validate lengths', () => {
            const schema = Lyra.str().length(2);

            Utils.validate(schema, [
                { value: 'xx' },
                {
                    value: 'x',
                    error: {
                        code: 'string.length',
                        message: 'unknown must have 2 character(s)',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });

        it('should support references', () => {
            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.str().length(ref),
                b: Lyra.num(),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 1 } },
                {
                    value: { a: 'xx', b: 1 },
                    error: {
                        code: 'string.length',
                        message: 'a must have "b" character(s)',
                        local: { label: 'a', limit: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {
            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.str().length(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "length" references "b" which must be a number',
                        local: { label: 'a', name: 'length', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should override lengths', () => {
            const schema = Lyra.str().length(1).length(2);

            Utils.validate(schema, [
                { value: 'xx' },
                {
                    value: 'x',
                    error: {
                        code: 'string.length',
                        message: 'unknown must have 2 character(s)',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });
    });

    describe('max()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.str().max('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.str().max(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should validate max lengths', () => {
            const schema = Lyra.str().max(2);

            Utils.validate(schema, [
                { value: 'xx' },
                {
                    value: 'xxx',
                    error: {
                        code: 'string.max',
                        message: 'unknown must have at most 2 character(s)',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });

        it('should support references', () => {
            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.str().max(ref),
                b: Lyra.num(),
            });

            Utils.validate(schema, [
                { value: { a: 'x', b: 1 } },
                {
                    value: { a: 'xx', b: 1 },
                    error: {
                        code: 'string.max',
                        message: 'a must have at most "b" character(s)',
                        local: { label: 'a', limit: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {
            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.str().max(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "max" references "b" which must be a number',
                        local: { label: 'a', name: 'max', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should override max lengths', () => {
            const schema = Lyra.str().max(2).max(1);

            Utils.validate(schema, [
                { value: 'x' },
                {
                    value: 'xx',
                    error: {
                        code: 'string.max',
                        message: 'unknown must have at most 1 character(s)',
                        local: { label: 'unknown', limit: 1 },
                    },
                },
            ]);
        });
    });

    describe('min()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.str().min('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Lyra.str().min(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should validate min lengths', () => {
            const schema = Lyra.str().min(2);

            Utils.validate(schema, [
                { value: 'xxx' },
                {
                    value: 'x',
                    error: {
                        code: 'string.min',
                        message: 'unknown must have at least 2 character(s)',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });

        it('should support references', () => {
            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.str().min(ref),
                b: Lyra.num(),
            });

            Utils.validate(schema, [
                { value: { a: 'xxx', b: 2 } },
                {
                    value: { a: 'x', b: 2 },
                    error: {
                        code: 'string.min',
                        message: 'a must have at least "b" character(s)',
                        local: { label: 'a', limit: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {
            const ref = Lyra.ref('b');
            const schema = Lyra.obj({
                a: Lyra.str().min(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 'x', b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "min" references "b" which must be a number',
                        local: { label: 'a', name: 'min', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should override min lengths', () => {
            const schema = Lyra.str().min(1).min(2);

            Utils.validate(schema, [
                { value: 'xx' },
                {
                    value: 'x',
                    error: {
                        code: 'string.min',
                        message: 'unknown must have at least 2 character(s)',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });
    });

    describe('insensitive()', () => {
        it('should avoid cloning if called twice', () => {
            const schema = Lyra.str().insensitive();

            expect(schema.insensitive()).toBe(schema);
        });

        it('should match strings insensitively', () => {
            const a = Lyra.str().min(3).allow('xx');
            const b = a.insensitive();

            Utils.validate(a, [
                { value: 'xx' },
                {
                    value: 'Xx',
                    error: {
                        code: 'string.min',
                        message: 'unknown must have at least 3 character(s)',
                        local: { label: 'unknown', limit: 3 },
                    },
                },
                {
                    value: 'XX',
                    error: {
                        code: 'string.min',
                        message: 'unknown must have at least 3 character(s)',
                        local: { label: 'unknown', limit: 3 },
                    },
                },
            ]);

            Utils.validate(b, [{ value: 'xx' }, { value: 'Xx' }, { value: 'XX' }]);
        });

        it('should cancel insensitive match', () => {
            const schema = Lyra.str().min(3).allow('xx').insensitive().insensitive(false);

            Utils.validate(schema, [
                {
                    value: 'Xx',
                    error: {
                        code: 'string.min',
                        message: 'unknown must have at least 3 character(s)',
                        local: { label: 'unknown', limit: 3 },
                    },
                },
            ]);
        });
    });

    describe('dataUri()', () => {
        it('should validate dataUris with paddingRequired and urlSafe enabled implicitly', () => {
            const schema = Lyra.str().dataUri();

            Utils.validate(schema, [
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==' },    // urlSafe
                { value: 'data:image/gif;charset=utf-8,=R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },    // charset=... with invalid base 64
                { value: 'data:text/x-script.python;charset=utf-8,=R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==',    // non urlSafe
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,=R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==',   // urlSafe but invalid base64 format
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw',  // urlSafe but no padding
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw',  // No padding
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,=R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',   // Invalid base64 string
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'ata:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', // data: mispelled
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',   // No media type
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'base,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', // Base 64 mispelled
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', // No data:
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',  // Invalid media type
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate dataUris without paddings and urlSafe enabled implicitly', () => {
            const schema = Lyra.str().dataUri({ paddingRequired: false });

            Utils.validate(schema, [
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw' },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate non url safe dataUris and paddingRequired enabled implicitly', () => {
            const schema = Lyra.str().dataUri({ urlSafe: false });

            Utils.validate(schema, [
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==' },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate non url safe dataUris without padding', () => {
            const schema = Lyra.str().dataUri({ urlSafe: false, paddingRequired: false });

            Utils.validate(schema, [
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==' },
                { value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw' },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.dataUri',
                        message: 'unknown must be a data uri',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('base64()', () => {
        it('should validate base64 strings with paddingRequired and urlSafe enabled implicitly', () => {
            const schema = Lyra.str().base64();

            Utils.validate(schema, [
                { value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==' }, // urlSafe
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==', // non urlSafe
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: '=R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==', // urlSafe but invalid base64 format
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw', // urlSafe but no padding
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw', // No padding
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: '=R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', // Invalid base64 string
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate base64 strings without paddings and urlSafe enabled implicitly', () => {
            const schema = Lyra.str().base64({ paddingRequired: false });

            Utils.validate(schema, [
                { value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw' },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate non url safe base64 strings and paddingRequired enabled implicitly', () => {
            const schema = Lyra.str().base64({ urlSafe: false });

            Utils.validate(schema, [
                { value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==' },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate non url safe base64 strings without padding', () => {
            const schema = Lyra.str().base64({ urlSafe: false, paddingRequired: false });

            Utils.validate(schema, [
                { value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw==' },
                { value: 'R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw' },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw==',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw',
                    error: {
                        code: 'string.base64',
                        message: 'unknown must be a base64 string',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('creditCard()', () => {
        it('should validate credit card numbers', () => {
            const schema = Lyra.str().creditCard();

            Utils.validate(schema, [
                // American Express
                { value: '378282246310005' },
                { value: '371449635398431' },
                // American Express Corporate
                { value: '378734493671000' },
                // Australian BankCard
                { value: '5610591081018250' },
                // Diners club
                { value: '30569309025904' },
                { value: '38520000023237' },
                // Discover
                { value: '6011111111111117' },
                { value: '6011000990139424' },
                // JCB
                { value: '3530111333300000' },
                { value: '3566002020360505' },
                // MasterCard
                { value: '5555555555554444' },
                { value: '5105105105105100' },
                // Visa
                { value: '4111111111111111' },
                { value: '4012888888881881' },
                { value: '4222222222222' },
                // Dankort (PBS)
                { value: '5019717010103742' },
                // Switch/Solo (Paymentech)
                { value: '6331101999990016' },
                {
                    value: '4111111111111112',
                    error: {
                        code: 'string.creditCard',
                        message: 'unknown must be a credit card number',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: '411111111111111x',
                    error: {
                        code: 'string.creditCard',
                        message: 'unknown must be a credit card number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('pattern()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.str().pattern('x')).toThrow('Regex must be a valid regular expression');
            expect(() => Lyra.str().pattern(/a/g)).toThrow('Regex must not contain global and sticky flags');
            expect(() => Lyra.str().pattern(/a/y)).toThrow('Regex must not contain global and sticky flags');
            expect(() => Lyra.str().pattern(/a/, 1)).toThrow('Name must be a string');
        });

        it('should set patterns without names', () => {
            const schema = Lyra.str().pattern(/^abc/);

            Utils.validate(schema, [
                { value: 'abc' },
                {
                    value: 'xabc',
                    error: {
                        code: 'string.pattern',
                        message: 'unknown must have pattern unknown',
                        local: { label: 'unknown', name: 'unknown', regex: /^abc/ },
                    },
                },
            ]);
        });

        it('should set patterns with names', () => {
            const schema = Lyra.str().pattern(/^abc/, 'abc');

            Utils.validate(schema, [
                {
                    value: 'xabc',
                    error: {
                        code: 'string.pattern',
                        message: 'unknown must have pattern abc',
                        local: { label: 'unknown', name: 'abc', regex: /^abc/ },
                    },
                },
            ]);
        });
    });

    describe('email()', () => {
        it('should validate emails', () => {
            const schema = Lyra.str().email();

            Utils.validate(schema, [
                { value: 'email@example.com' },
                { value: 'firstname.lastname@example.com' },
                { value: 'email@subdomain.example.com' },
                { value: 'firstname+lastname@example.com' },
                { value: 'email@192.0.2.123' },
                { value: 'email@[192.0.2.123]' },
                { value: '“email”@example.com' },
                { value: '1234567890@example.com' },
                { value: 'email@domain-one.example' },
                { value: '_______@example.com' },
                { value: 'email@example.name' },
                { value: 'email@example.co.jp' },
                { value: 'firstname-lastname@example.com' },
                {
                    value: 'firstname',
                    error: {
                        code: 'string.email',
                        message: 'unknown must be an email',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'firstname@',
                    error: {
                        code: 'string.email',
                        message: 'unknown must be an email',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'firstname@@example.com',
                    error: {
                        code: 'string.email',
                        message: 'unknown must be an email',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('url()', () => {
        it('should validate urls', () => {
            const schema = Lyra.str().url();

            Utils.validate(schema, [
                { value: 'http://foo.com/blah_blah' },
                { value: 'http://foo.com/blah_blah/' },
                { value: 'http://foo.com/blah_blah_(wikipedia)' },
                { value: 'http://foo.com/blah_blah_(wikipedia)_(again)' },
                { value: 'http://www.example.com/wpstyle/?p=364' },
                { value: 'https://www.example.com/foo/?bar=baz&inga=42&quux' },
                { value: 'http://✪df.ws/123' },
                { value: 'http://userid:password@example.com:8080' },
                { value: 'http://userid:password@example.com:8080/' },
                { value: 'http://userid@example.com' },
                { value: 'http://userid@example.com/' },
                { value: 'http://userid@example.com:8080' },
                { value: 'http://userid@example.com:8080/' },
                { value: 'http://userid:password@example.com' },
                { value: 'http://userid:password@example.com/' },
                { value: 'http://142.42.1.1/' },
                { value: 'http://142.42.1.1:8080/' },
                { value: 'http://➡.ws/䨹' },
                { value: 'http://⌘.ws' },
                { value: 'http://⌘.ws/' },
                { value: 'http://foo.com/blah_(wikipedia)#cite-1' },
                { value: 'http://foo.com/blah_(wikipedia)_blah#cite-1' },
                { value: 'http://foo.com/unicode_(✪)_in_parens' },
                { value: 'http://foo.com/(something)?after=parens' },
                { value: 'http://☺.damowmow.com/' },
                { value: 'http://code.google.com/events/#&product=browser' },
                { value: 'http://j.mp' },
                { value: 'ftp://foo.bar/baz' },
                { value: 'http://foo.bar/?q=Test%20URL-encoded%20stuff' },
                { value: 'http://مثال.إختبار' },
                { value: 'http://例子.测试' },
                { value: 'http://उदाहरण.परीक्षा' },
                { value: 'http://-.~_!$&\'()*+,;=:%40:80%2f::::::@example.com' },
                { value: 'http://1337.net' },
                { value: 'http://a.b-c.de' },
                { value: 'http://223.255.255.254' },
                { value: 'https://foo_bar.example.com/' },
                {
                    value: 'http://',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://.',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://..',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://../',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://?',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://??',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://??/',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://#',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://##',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://##/',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://foo.bar?q=Spaces should be encoded',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: '//',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: '//a',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: '///a',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: '///',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http:///a',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'foo.com',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'rdar://1234',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'h://test',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http:// shouldfail.com',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: ':// should fail',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'http://foo.bar/foo(bar)baz quux',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
                {
                    value: 'ftps://foo.bar/',
                    error: {
                        code: 'string.url',
                        message: 'unknown must be a URL',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('alphanum()', () => {
        it('should validate alphanumeric strings', () => {
            const schema = Lyra.str().alphanum();

            Utils.validate(schema, [
                { value: 'xYz123' },
                {
                    value: 'aBc xyz 123',
                    error: {
                        code: 'string.alphanum',
                        message: 'unknown must only contain alphanumeric characters',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('numeric()', () => {
        it('should validate numeric strings', () => {
            const schema = Lyra.str().numeric();

            Utils.validate(schema, [
                { value: '0123456789' },
                {
                    value: '012345678x',
                    error: {
                        code: 'string.numeric',
                        message: 'unknown must only contain numeric characters',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('case()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.str().case('x')).toThrow('Direction must be upper or lower');
        });

        it('should validate uppercase characters in strict mode', () => {
            const schema = Lyra.str().uppercase();

            Utils.validate(schema, [
                { value: 'ABC' },
                {
                    value: 'ABc',
                    error: {
                        code: 'string.uppercase',
                        message: 'unknown must only contain uppercase characters',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should validate lowercase characters in strict mode', () => {
            const schema = Lyra.str().lowercase();

            Utils.validate(schema, [
                { value: 'abc' },
                {
                    value: 'ABc',
                    error: {
                        code: 'string.lowercase',
                        message: 'unknown must only contain lowercase characters',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should convert to uppercase if strict mode is disabled', () => {
            const schema = Lyra.str().uppercase().convert();

            Utils.validate(schema, [
                { value: 'ABC' },
                {
                    value: 'aBc',
                    output: 'ABC',
                },
            ]);
        });

        it('should validate lowercase characters in strict mode', () => {
            const schema = Lyra.str().lowercase().convert();

            Utils.validate(schema, [
                { value: 'abc' },
                {
                    value: 'ABc',
                    output: 'abc',
                },
            ]);
        });
    });

    describe('trim()', () => {
        it('should validate trailing and leading whitespaces in strict mode', () => {
            const schema = Lyra.str().trim();

            Utils.validate(schema, [
                { value: 'xyz' },
                {
                    value: ' xyz    ',
                    error: {
                        code: 'string.trim',
                        message: 'unknown must not contain leading and trailing whitespaces',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should trim if strict mode is disabled', () => {
            const schema = Lyra.str().trim().convert();

            Utils.validate(schema, [
                { value: 'xyz' },
                {
                    value: ' xyz    ',
                    output: 'xyz',
                },
            ]);
        });

        it('should cancel trim mode', () => {
            const schema = Lyra.str().trim().trim(false);

            Utils.validate(schema, [{ value: ' xyz ' }]);
        });

        it('should cancel trim mode if strict mode is disabled', () => {
            const schema = Lyra.str().trim().trim(false).convert();

            Utils.validate(schema, [{ value: ' xyz ' }]);
        });
    });

    describe('replace()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.str().replace(1)).toThrow('Pattern must be a valid regular expression or a string');
            expect(() => Lyra.str().replace('x', 1)).toThrow('Replacement must be a string');
        });

        it('should perform single replacement', () => {
            const schema = Lyra.str().replace('x', 'a').convert();

            Utils.validate(schema, [
                { value: 'abc' },
                {
                    value: 'xabc',
                    output: 'aabc',
                },
            ]);
        });

        it('should perform multiple replacements', () => {
            const schema = Lyra.str().replace('x', 'a').replace('y', 'b').convert();

            Utils.validate(schema, [
                { value: 'abc' },
                {
                    value: 'xyz',
                    output: 'abz',
                },
            ]);
        });
    });
});
