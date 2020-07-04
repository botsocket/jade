'use strict';

const Dust = require('@botbind/dust');

const Lyra = require('../src');
const Utils = require('./utils');

describe('compile()', () => {
    it('should compile example object', () => {
        const error = new Error('Invalid');
        const validateFn = function (value) {
            if (value === 'someValue') {
                return value;
            }

            throw error;
        };

        const ref = Lyra.ref('a');
        const schema = Lyra.compile({
            a: 'x',
            b: [ref, 1],
            c: /^abc$/,
            d: validateFn,
            e: {
                f: 1,
            },
        });

        Utils.validate(schema, [
            { value: {} },
            { value: { a: 'x' } },
            {
                value: { a: 'y' },
                error: {
                    code: 'any.only',
                    message: 'a must be x',
                    local: { values: ['x'], label: 'a' },
                },
            },
            { value: { b: 1 } },
            { value: { a: 'x', b: 'x' } },
            {
                value: { a: 'x', b: 'y' },
                error: {
                    code: 'any.only',
                    message: 'b must be 1, "a"',
                    local: { values: [1, ref], label: 'b' },
                },
            },
            { value: { c: 'abc' } },
            {
                value: { c: 1 },
                error: {
                    code: 'string.base',
                    message: 'c must be a string',
                    local: { label: 'c' },
                },
            },
            {
                value: { c: 'abcd' },
                error: {
                    code: 'string.pattern',
                    message: 'c must have pattern unknown',
                    local: { label: 'c', name: 'unknown', regex: /^abc$/ },
                },
            },
            { value: { d: 'someValue' } },
            {
                value: { d: 'someOtherValue' },
                error: {
                    code: 'any.rule',
                    message: 'd fails validation due to Invalid',
                    local: { error, label: 'd' },
                },
            },
            { value: { e: { f: 1 } } },
            {
                value: { e: { f: 2 } },
                error: {
                    code: 'any.only',
                    message: 'e.f must be 1',
                    local: { values: [1], label: 'e.f' },
                },
            },
        ]);

        const schema2 = Lyra.obj({
            a: Lyra.valid(Lyra.override, 'x'),
            b: Lyra.valid(Lyra.override, ref, 1),
            c: Lyra.str().pattern(/^abc$/),
            d: Lyra.any().rule(validateFn),
            e: Lyra.obj({
                f: Lyra.valid(Lyra.override, 1),
            }),
        });

        expect(Dust.equal(schema, schema2, { deepFunction: true })).toBe(true);
    });
});
