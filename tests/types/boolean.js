'use strict';

const Lyra = require('../../src');
const Utils = require('../utils');

describe('boolean()', () => {
    it('should validate booleans', () => {
        const schema = Lyra.bool();

        Utils.validate(schema, [
            { value: true },
            { value: false },
            {
                value: new Boolean(true),
                error: {
                    code: 'boolean.base',
                    message: 'unknown must be a boolean',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 'x',
                error: {
                    code: 'boolean.base',
                    message: 'unknown must be a boolean',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should coerce to booleans', () => {
        const schema = Lyra.bool().convert();

        Utils.validate(schema, [
            { value: true },
            { value: false },
            {
                value: 'false',
                output: false,
            },
            {
                value: 'true',
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
            {
                value: '',
                error: {
                    code: 'boolean.base',
                    message: 'unknown must be a boolean',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 'x',
                error: {
                    code: 'boolean.base',
                    message: 'unknown must be a boolean',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 'tRUe',
                error: {
                    code: 'boolean.base',
                    message: 'unknown must be a boolean',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should cast to strings', () => {
        const schema = Lyra.bool().cast('string');

        Utils.validate(schema, [
            {
                value: true,
                output: 'true',
            },
            {
                value: false,
                output: 'false',
            },
        ]);
    });

    it('should cast to numbers', () => {
        const schema = Lyra.bool().cast('number');

        Utils.validate(schema, [
            {
                value: true,
                output: 1,
            },
            {
                value: false,
                output: 0,
            },
        ]);
    });

    describe('insenstive()', () => {
        it('should avoid cloning if called twice', () => {
            const schema = Lyra.bool().insensitive();

            expect(schema.insensitive()).toBe(schema);
        });

        it('should convert strings insensitively', () => {
            const schema = Lyra.bool().insensitive().convert();

            Utils.validate(schema, [
                {
                    value: 'tRUe',
                    output: true,
                },
                {
                    value: 'FaLsE',
                    output: false,
                },
                {
                    value: 'x',
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should look up truthy and falsy values insensitively', () => {
            const schema = Lyra.bool().truthy('truthy').falsy('falsy').insensitive().convert();

            Utils.validate(schema, [
                {
                    value: 'tRUthy',
                    output: true,
                },
                {
                    value: 'falSY',
                    output: false,
                },
            ]);
        });

        it('should cancel insensitive conversion', () => {
            const schema = Lyra.bool().insensitive().insensitive(false);

            Utils.validate(schema, [
                {
                    value: 'tRUe',
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('truthy()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.bool().truthy()).toThrow('Values must have at least a value');
        });

        it('should support references', () => {
            const schema = Lyra.obj({
                a: Lyra.bool().truthy(Lyra.ref('b')).convert(),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 'x',
                        b: 'x',
                    },
                    output: {
                        a: true,
                        b: 'x',
                    },
                },
            ]);
        });

        it('should support templates', () => {
            const template = Lyra.template('This is {b}');
            const schema = Lyra.obj({
                a: Lyra.bool().truthy(template).insensitive().convert(),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 'This is x',
                        b: 'x',
                    },
                    output: {
                        a: true,
                        b: 'x',
                    },
                },
            ]);
        });

        it('should override truthy values', () => {
            const schema = Lyra.bool().truthy('x').truthy(Lyra.override, 'y').convert();

            Utils.validate(schema, [
                {
                    value: 'y',
                    output: true,
                },
                {
                    value: 'x',
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should cancel out falsy calls', () => {
            const schema = Lyra.bool().falsy('x').truthy('x').convert();

            Utils.validate(schema, [
                {
                    value: 'x',
                    output: true,
                },
            ]);
        });
    });

    describe('falsy()', () => {
        it('should throw on incorrect parameters', () => {
            expect(() => Lyra.bool().falsy()).toThrow('Values must have at least a value');
        });

        it('should support references', () => {
            const schema = Lyra.obj({
                a: Lyra.bool().falsy(Lyra.ref('b')).convert(),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 'x',
                        b: 'x',
                    },
                    output: {
                        a: false,
                        b: 'x',
                    },
                },
            ]);
        });

        it('should support templates', () => {
            const template = Lyra.template('This is {b}');
            const schema = Lyra.obj({
                a: Lyra.bool().falsy(template).insensitive().convert(),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: 'This is x',
                        b: 'x',
                    },
                    output: {
                        a: false,
                        b: 'x',
                    },
                },
            ]);
        });

        it('should override truthy values', () => {
            const schema = Lyra.bool().falsy('x').falsy(Lyra.override, 'y').convert();

            Utils.validate(schema, [
                {
                    value: 'y',
                    output: false,
                },
                {
                    value: 'x',
                    error: {
                        code: 'boolean.base',
                        message: 'unknown must be a boolean',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });

        it('should cancel out truthy calls', () => {
            const schema = Lyra.bool().truthy('x').falsy('x').convert();

            Utils.validate(schema, [
                {
                    value: 'x',
                    output: false,
                },
            ]);
        });
    });
});
