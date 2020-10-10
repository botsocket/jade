'use strict';

const Jade = require('../../src');
const Utils = require('../utils');

describe('date()', () => {

    beforeEach(() => {

        const original = Date.now;

        Date.now = () => 130100000;

        Date.now.restore = () => {

            Date.now = original;
        };
    });

    afterEach(() => {

        Date.now.restore();
    });

    it('should validate dates', () => {

        const schema = Jade.date();

        Utils.validate(schema, [
            { value: new Date() },
            {
                value: 'x',
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
            {
                value: false,
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
            {
                value: new Date('01/50/2020'),
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
            {
                value: new Date(NaN),
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
            {
                value: new Date(Infinity),
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should coerce to dates', () => {

        const schema = Jade.date().convert();
        const date = new Date('01/01/2020');

        Utils.validate(schema, [
            {
                value: '01/01/2020',
                output: date,
            },
            {
                value: date.toISOString(),
                output: date,
            },
            {
                value: date.toString(),
                output: date,
            },
            {
                value: date.getTime().toString(),
                output: date,
            },
            {
                value: date.getTime(),
                output: date,
            },
            {
                value: false,
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
            {
                value: '01/50/2020',
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
            {
                value: Infinity,
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
            {
                value: -Infinity,
                error: {
                    code: 'date.base',
                    message: 'unknown must be a valid date',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    it('should cast to numbers', () => {

        const date = new Date('01/01/2020');
        const schema = Jade.date().cast('number');

        Utils.validate(schema, [
            {
                value: date,
                output: date.getTime(),
            },
        ]);
    });

    it('should cast to strings', () => {

        const date = new Date('01/01/2020');
        const schema = Jade.date().cast('string');

        Utils.validate(schema, [
            {
                value: date,
                output: date.toString(),
            },
        ]);
    });

    describe('max()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.date().max('x')).toThrow('limit must be now or a valid date or a valid reference');
            expect(() => Jade.date().max(NaN)).toThrow('limit must be now or a valid date or a valid reference');
        });

        it('should compare dates', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().max(date);

            Utils.validate(schema, [
                { value: new Date('12/31/2019') },
                { value: date },
                {
                    value: new Date('01/02/2020'),
                    error: {
                        code: 'date.max',
                        message: `unknown must be less than or equal to ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should normalize max dates passed as strings', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().max(date.toString());

            Utils.validate(schema, [
                { value: new Date('12/31/2019') },
                { value: date },
                {
                    value: new Date('01/02/2020'),
                    error: {
                        code: 'date.max',
                        message: `unknown must be less than or equal to ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should compare with now', () => {

            const schema = Jade.date().max('now');

            Utils.validate(schema, [
                { value: new Date(Date.now() - 10000) },
                { value: new Date(Date.now()) },
                {
                    value: new Date(Date.now() + 10000),
                    error: {
                        code: 'date.max',
                        message: `unknown must be less than or equal to now`,
                        local: { label: 'unknown', limit: 'now' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().max(ref),
                b: '01/01/2020',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date('12/31/2019'),
                        b: '01/01/2020',
                    },
                },
                {
                    value: {
                        a: new Date('01/02/2020'),
                        b: '01/01/2020',
                    },
                    error: {
                        code: 'date.max',
                        message: 'a must be less than or equal to "b"',
                        local: { limit: ref, label: 'a' },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().max(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date(),
                        b: 'x',
                    },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "max" references "b" which must be now or a valid date',
                        local: { name: 'max', ref, message: 'must be now or a valid date', label: 'a' },
                    },
                },
            ]);
        });

        it('should override compare dates', () => {

            const date = new Date('01/01/2020');
            const date2 = new Date('01/02/2020');
            const schema = Jade.date().max(date2.toString()).max(date.toString());

            Utils.validate(schema, [
                { value: date },
                {
                    value: date2,
                    error: {
                        code: 'date.max',
                        message: `unknown must be less than or equal to ${date.toString()}`,
                        local: { limit: date, label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('min()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.date().min('x')).toThrow('limit must be now or a valid date or a valid reference');
            expect(() => Jade.date().min(NaN)).toThrow('limit must be now or a valid date or a valid reference');
        });

        it('should compare dates', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().min(date);

            Utils.validate(schema, [
                { value: new Date('01/02/2020') },
                { value: date },
                {
                    value: new Date('12/31/2019'),
                    error: {
                        code: 'date.min',
                        message: `unknown must be greater than or equal to ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should normalize min dates passed as strings', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().min(date.toString());

            Utils.validate(schema, [
                { value: new Date('01/02/2020') },
                { value: date },
                {
                    value: new Date('12/31/2019'),
                    error: {
                        code: 'date.min',
                        message: `unknown must be greater than or equal to ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should compare with now', () => {

            const schema = Jade.date().min('now');

            Utils.validate(schema, [
                { value: new Date(Date.now() + 10000) },
                { value: new Date(Date.now()) },
                {
                    value: new Date(Date.now() - 10000),
                    error: {
                        code: 'date.min',
                        message: `unknown must be greater than or equal to now`,
                        local: { label: 'unknown', limit: 'now' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().min(ref),
                b: '01/01/2020',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date('01/02/2020'),
                        b: '01/01/2020',
                    },
                },
                {
                    value: {
                        a: new Date('12/31/2019'),
                        b: '01/01/2020',
                    },
                    error: {
                        code: 'date.min',
                        message: 'a must be greater than or equal to "b"',
                        local: { limit: ref, label: 'a' },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().min(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date(),
                        b: 'x',
                    },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "min" references "b" which must be now or a valid date',
                        local: { name: 'min', ref, message: 'must be now or a valid date', label: 'a' },
                    },
                },
            ]);
        });

        it('should override compare dates', () => {

            const date = new Date('01/01/2020');
            const date2 = new Date('01/02/2020');
            const schema = Jade.date().min(date.toString()).min(date2.toString());

            Utils.validate(schema, [
                { value: date2 },
                {
                    value: date,
                    error: {
                        code: 'date.min',
                        message: `unknown must be greater than or equal to ${date2.toString()}`,
                        local: { limit: date2, label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('greater()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.date().greater('x')).toThrow('limit must be now or a valid date or a valid reference');
            expect(() => Jade.date().greater(NaN)).toThrow('limit must be now or a valid date or a valid reference');
        });

        it('should compare dates', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().greater(date);

            Utils.validate(schema, [
                { value: new Date('01/02/2020') },
                {
                    value: date,
                    error: {
                        code: 'date.greater',
                        message: `unknown must be greater than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
                {
                    value: new Date('12/31/2019'),
                    error: {
                        code: 'date.greater',
                        message: `unknown must be greater than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should normalize greater dates passed as strings', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().greater(date.toString());

            Utils.validate(schema, [
                { value: new Date('01/02/2020') },
                {
                    value: date,
                    error: {
                        code: 'date.greater',
                        message: `unknown must be greater than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
                {
                    value: new Date('12/31/2019'),
                    error: {
                        code: 'date.greater',
                        message: `unknown must be greater than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should compare with now', () => {

            const schema = Jade.date().greater('now');

            Utils.validate(schema, [
                { value: new Date(Date.now() + 10000) },
                {
                    value: new Date(Date.now()),
                    error: {
                        code: 'date.greater',
                        message: 'unknown must be greater than now',
                        local: { label: 'unknown', limit: 'now' },
                    },
                },
                {
                    value: new Date(Date.now() - 10000),
                    error: {
                        code: 'date.greater',
                        message: `unknown must be greater than now`,
                        local: { label: 'unknown', limit: 'now' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().greater(ref),
                b: '01/01/2020',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date('01/02/2020'),
                        b: '01/01/2020',
                    },
                },
                {
                    value: {
                        a: new Date('12/31/2019'),
                        b: '01/01/2020',
                    },
                    error: {
                        code: 'date.greater',
                        message: 'a must be greater than "b"',
                        local: { limit: ref, label: 'a' },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().greater(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date(),
                        b: 'x',
                    },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "greater" references "b" which must be now or a valid date',
                        local: { name: 'greater', ref, message: 'must be now or a valid date', label: 'a' },
                    },
                },
            ]);
        });

        it('should override compare dates', () => {

            const date = new Date('01/01/2020');
            const date2 = new Date('01/02/2020');
            const schema = Jade.date().greater(date2.toString()).greater(date.toString());

            Utils.validate(schema, [
                { value: date2 },
                {
                    value: date,
                    error: {
                        code: 'date.greater',
                        message: `unknown must be greater than ${date.toString()}`,
                        local: { limit: date, label: 'unknown' },
                    },
                },
            ]);
        });
    });

    describe('less()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Jade.date().less('x')).toThrow('limit must be now or a valid date or a valid reference');
            expect(() => Jade.date().less(NaN)).toThrow('limit must be now or a valid date or a valid reference');
        });

        it('should compare dates', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().less(date);

            Utils.validate(schema, [
                { value: new Date('12/31/2019') },
                {
                    value: date,
                    error: {
                        code: 'date.less',
                        message: `unknown must be less than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
                {
                    value: new Date('01/02/2020'),
                    error: {
                        code: 'date.less',
                        message: `unknown must be less than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should normalize less dates passed as strings', () => {

            const date = new Date('01/01/2020');
            const schema = Jade.date().less(date.toString());

            Utils.validate(schema, [
                { value: new Date('12/31/2019') },
                {
                    value: date,
                    error: {
                        code: 'date.less',
                        message: `unknown must be less than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
                {
                    value: new Date('01/02/2020'),
                    error: {
                        code: 'date.less',
                        message: `unknown must be less than ${date.toString()}`,
                        local: { label: 'unknown', limit: date },
                    },
                },
            ]);
        });

        it('should compare with now', () => {

            const schema = Jade.date().less('now');

            Utils.validate(schema, [
                { value: new Date(Date.now() - 10000) },
                {
                    value: new Date(Date.now()),
                    error: {
                        code: 'date.less',
                        message: `unknown must be less than now`,
                        local: { label: 'unknown', limit: 'now' },
                    },
                },
                {
                    value: new Date(Date.now() + 10000),
                    error: {
                        code: 'date.less',
                        message: `unknown must be less than now`,
                        local: { label: 'unknown', limit: 'now' },
                    },
                },
            ]);
        });

        it('should support references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().less(ref),
                b: '01/01/2020',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date('12/31/2019'),
                        b: '01/01/2020',
                    },
                },
                {
                    value: {
                        a: new Date('01/02/2020'),
                        b: '01/01/2020',
                    },
                    error: {
                        code: 'date.less',
                        message: 'a must be less than "b"',
                        local: { limit: ref, label: 'a' },
                    },
                },
            ]);
        });

        it('should error on invalid references', () => {

            const ref = Jade.ref('b');
            const schema = Jade.obj({
                a: Jade.date().less(ref),
                b: 'x',
            });

            Utils.validate(schema, [
                {
                    value: {
                        a: new Date(),
                        b: 'x',
                    },
                    error: {
                        code: 'any.ref',
                        message: 'Rule "less" references "b" which must be now or a valid date',
                        local: { name: 'less', ref, message: 'must be now or a valid date', label: 'a' },
                    },
                },
            ]);
        });

        it('should override compare dates', () => {

            const date = new Date('01/01/2020');
            const date2 = new Date('01/02/2020');
            const schema = Jade.date().less(date.toString()).less(date2.toString());

            Utils.validate(schema, [
                { value: date },
                {
                    value: date2,
                    error: {
                        code: 'date.less',
                        message: `unknown must be less than ${date2.toString()}`,
                        local: { limit: date2, label: 'unknown' },
                    },
                },
            ]);
        });
    });
});
