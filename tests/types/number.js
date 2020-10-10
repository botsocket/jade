'use strict';

const Jade = require('../../src');
const Utils = require('../utils');

describe('number()', () => {

    it('should validate numbers', () => {

        const schema = Jade.num();

        Utils.validate(schema, [
            { value: 1 },
            { value: 1.2 },
            { value: Number.MAX_SAFE_INTEGER },
            { value: Number.MIN_SAFE_INTEGER },
            {
                value: Infinity,
                error: {
                    code: 'number.infinity',
                    message: 'unknown must not be infinity',
                    local: { label: 'unknown' },
                },
            },
            {
                value: -Infinity,
                error: {
                    code: 'number.infinity',
                    message: 'unknown must not be infinity',
                    local: { label: 'unknown' },
                },
            },
            {
                value: '0',
                error: {
                    code: 'number.base',
                    message: 'unknown must be a number',
                    local: { label: 'unknown' },
                },
            },
            {
                value: new Number(1),
                error: {
                    code: 'number.base',
                    message: 'unknown must be a number',
                    local: { label: 'unknown' },
                },
            },
            {
                value: Number.MAX_SAFE_INTEGER + 1,
                error: {
                    code: 'number.unsafe',
                    message: 'unknown must be a safe number',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should allow infinity if specified', () => {

        const schema = Jade.num().allow(Infinity, -Infinity);

        Utils.validate(schema, [{ value: Infinity }, { value: -Infinity }]);
    });

    it('should coerce to numbers', () => {

        const schema = Jade.num().convert();

        Utils.validate(schema, [
            { value: 1 },
            {
                value: '1',
                output: 1,
            },
            {
                value: '1.2',
                output: 1.2,
            },
            {
                value: 'x',
                error: {
                    code: 'number.base',
                    message: 'unknown must be a number',
                    local: { label: 'unknown' },
                },
            },
            {
                value: 'Infinity',
                error: {
                    code: 'number.infinity',
                    message: 'unknown must not be infinity',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should cast to strings', () => {

        const schema = Jade.num().cast('string');

        Utils.validate(schema, [{ value: 1, output: '1' }]);
    });

    describe('unsafe()', () => {

        it('should avoid cloning if called twice', () => {

            const schema = Jade.num().unsafe();

            expect(schema.unsafe()).toBe(schema);
        });

        it('should allow unsafe numbers', () => {

            const schema = Jade.num().unsafe();

            Utils.validate(schema, [{ value: Number.MAX_SAFE_INTEGER + 1 }]);
        });

        it('should cancel unsafe mode', () => {

            const schema = Jade.num().unsafe().unsafe(false);

            Utils.validate(schema, [
                {
                    value: Number.MAX_SAFE_INTEGER + 1,
                    error: {
                        code: 'number.unsafe',
                        message: 'unknown must be a safe number',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('integer()', () => {

        it('should validate integers', () => {

            const schema = Jade.num().integer();

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: 1.2,
                    error: {
                        code: 'number.integer',
                        message: 'unknown must be an integer',
                        local: { label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('max()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.num().max('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Jade.num().max(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should compare numbers', () => {

            const schema = Jade.num().max(2);

            Utils.validate(schema, [
                { value: 1 },
                { value: 1.9 },
                { value: 2 },
                {
                    value: 3,
                    error: {
                        code: 'number.max',
                        message: 'unknown must be less than or equal to 2',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().max(ref),
                b: Jade.num(),
            });

            Utils.validate(schema, [
                { value: { a: 1, b: 2 } },
                {
                    value: { a: 3, b: 2 },
                    error: {
                        code: 'number.max',
                        message: 'a must be less than or equal to "b"',
                        local: { label: 'a', limit: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().max(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 3, b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "max" references "b" which must be a number',
                        local: { label: 'a', name: 'max', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should override compare value', () => {

            const schema = Jade.num().max(2).max(1);

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: 2,
                    error: {
                        code: 'number.max',
                        message: 'unknown must be less than or equal to 1',
                        local: { label: 'unknown', limit: 1 },
                    },
                },
            ]);
        });
    });

    describe('min()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.num().min('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Jade.num().min(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should compare numbers', () => {

            const schema = Jade.num().min(2);

            Utils.validate(schema, [
                { value: 2 },
                { value: 2.1 },
                { value: 3 },
                {
                    value: 1,
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 2',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().min(ref),
                b: Jade.num(),
            });

            Utils.validate(schema, [
                { value: { a: 2, b: 2 } },
                {
                    value: { a: 1, b: 2 },
                    error: {
                        code: 'number.min',
                        message: 'a must be greater than or equal to "b"',
                        local: { label: 'a', limit: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().min(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 3, b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "min" references "b" which must be a number',
                        local: { label: 'a', name: 'min', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should override compare value', () => {

            const schema = Jade.num().min(1).min(2);

            Utils.validate(schema, [
                { value: 2 },
                {
                    value: 1,
                    error: {
                        code: 'number.min',
                        message: 'unknown must be greater than or equal to 2',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });
    });

    describe('greater()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.num().greater('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Jade.num().greater(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should compare numbers', () => {

            const schema = Jade.num().greater(2);

            Utils.validate(schema, [
                { value: 3 },
                {
                    value: 2,
                    error: {
                        code: 'number.greater',
                        message: 'unknown must be greater than 2',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().greater(ref),
                b: Jade.num(),
            });

            Utils.validate(schema, [
                { value: { a: 3, b: 2 } },
                {
                    value: { a: 1, b: 2 },
                    error: {
                        code: 'number.greater',
                        message: 'a must be greater than "b"',
                        local: { label: 'a', limit: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().greater(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 3, b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "greater" references "b" which must be a number',
                        local: { label: 'a', name: 'greater', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should override compare value', () => {

            const schema = Jade.num().greater(2).greater(1);

            Utils.validate(schema, [
                { value: 2 },
                {
                    value: 1,
                    error: {
                        code: 'number.greater',
                        message: 'unknown must be greater than 1',
                        local: { label: 'unknown', limit: 1 },
                    },
                },
            ]);
        });
    });

    describe('less()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.num().less('x')).toThrow('limit must be a number or a valid reference');
            expect(() => Jade.num().less(NaN)).toThrow('limit must be a number or a valid reference');
        });

        it('should compare numbers', () => {

            const schema = Jade.num().less(2);

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: 2,
                    error: {
                        code: 'number.less',
                        message: 'unknown must be less than 2',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().less(ref),
                b: Jade.num(),
            });

            Utils.validate(schema, [
                { value: { a: 1, b: 2 } },
                {
                    value: { a: 2, b: 2 },
                    error: {
                        code: 'number.less',
                        message: 'a must be less than "b"',
                        local: { label: 'a', limit: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().less(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 3, b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "less" references "b" which must be a number',
                        local: { label: 'a', name: 'less', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should override compare value', () => {

            const schema = Jade.num().less(1).less(2);

            Utils.validate(schema, [
                { value: 1 },
                {
                    value: 2,
                    error: {
                        code: 'number.less',
                        message: 'unknown must be less than 2',
                        local: { label: 'unknown', limit: 2 },
                    },
                },
            ]);
        });
    });

    describe('multiple()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.num().multiple('x')).toThrow('factor must be a number or a valid reference');
            expect(() => Jade.num().multiple(NaN)).toThrow('factor must be a number or a valid reference');
        });

        it('should validate factors', () => {

            const schema = Jade.num().multiple(3);

            Utils.validate(schema, [
                { value: 3 },
                {
                    value: 2,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 3',
                        local: { label: 'unknown', factor: 3 },
                    },
                },
                {
                    value: 3.1,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 3',
                        local: { label: 'unknown', factor: 3 },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().multiple(ref),
                b: Jade.num(),
            });

            Utils.validate(schema, [
                { value: { a: 4, b: 2 } },
                {
                    value: { a: 5, b: 2 },
                    error: {
                        code: 'number.multiple',
                        message: 'a must be a multiple of "b"',
                        local: { label: 'a', factor: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().multiple(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 3, b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "multiple" references "b" which must be a number',
                        local: { label: 'a', name: 'multiple', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should validate multiple factors', () => {

            const schema = Jade.num().multiple(3).multiple(5);

            Utils.validate(schema, [
                { value: 15 },
                {
                    value: 5,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 3',
                        local: { label: 'unknown', factor: 3 },
                    },
                },
                {
                    value: 3,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 5',
                        local: { label: 'unknown', factor: 5 },
                    },
                },
            ]);
        });
    });

    describe('even()', () => {

        it('should validate parity', () => {

            const schema = Jade.num().even();

            Utils.validate(schema, [
                { value: 2 },
                {
                    value: 1,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 2',
                        local: { label: 'unknown', factor: 2 },
                    },
                },
                {
                    value: 2.5,
                    error: {
                        code: 'number.multiple',
                        message: 'unknown must be a multiple of 2',
                        local: { label: 'unknown', factor: 2 },
                    },
                },
            ]);
        });
    });

    describe('divide()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.num().divide('x')).toThrow('dividend must be a number or a valid reference');
            expect(() => Jade.num().divide(NaN)).toThrow('dividend must be a number or a valid reference');
        });

        it('should validate dividends', () => {

            const schema = Jade.num().divide(10);

            Utils.validate(schema, [
                { value: 5 },
                { value: 2 },
                { value: 10 },
                {
                    value: 3,
                    error: {
                        code: 'number.divide',
                        message: 'unknown must divide 10',
                        local: { label: 'unknown', dividend: 10 },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().divide(ref),
                b: Jade.num(),
            });

            Utils.validate(schema, [
                { value: { a: 5, b: 10 } },
                {
                    value: { a: 3, b: 2 },
                    error: {
                        code: 'number.divide',
                        message: 'a must divide "b"',
                        local: { label: 'a', dividend: ref },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.num().divide(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: { a: 3, b: 'x' },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "divide" references "b" which must be a number',
                        local: { label: 'a', name: 'divide', ref, message: 'must be a number' },
                    },
                },
            ]);
        });

        it('should validate multiple dividends', () => {

            const schema = Jade.num().divide(16).divide(24);

            Utils.validate(schema, [
                { value: 8 },
                { value: 4 },
                {
                    value: 3,
                    error: {
                        code: 'number.divide',
                        message: 'unknown must divide 16',
                        local: { label: 'unknown', dividend: 16 },
                    },
                },
                {
                    value: 16,
                    error: {
                        code: 'number.divide',
                        message: 'unknown must divide 24',
                        local: { label: 'unknown', dividend: 24 },
                    },
                },
            ]);
        });
    });
});
