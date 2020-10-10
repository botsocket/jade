'use strict';

const Bone = require('@botsocket/bone');

const Jade = require('../src');
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

        const ref = Jade.ref('a');
        const schema = Jade.compile({
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

        const schema2 = Jade.obj({
            a: Jade.valid(Jade.override, 'x'),
            b: Jade.valid(Jade.override, ref, 1),
            c: Jade.str().pattern(/^abc$/),
            d: Jade.any().rule(validateFn),
            e: Jade.obj({
                f: Jade.valid(Jade.override, 1),
            }),
        });

        expect(Bone.equal(schema, schema2, { deepFunction: true })).toBe(true);
    });
});
