'use strict';

const Lyra = require('../src');
const Utils = require('./utils');

describe('ref()', () => {
    it('should throw on incorrect parameters', () => {
        expect(() => Lyra.ref(1)).toThrow('Path must be a string');
        expect(() => Lyra.ref('x', { ancestor: 'x' })).toThrow('Option ancestor must be a number');
        expect(() => Lyra.ref('...x', { ancestor: 0 })).toThrow('Cannot use both the ancestor option with the ancestor prefix');
    });

    it('should resolve siblings', () => {
        const ref = Lyra.ref('b');
        const schema = Lyra.obj({
            a: ref,
            b: 'x',
        });

        Utils.validate(schema, [
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

    it('should resolve ancestors', () => {
        const ref = Lyra.ref('...a');
        const schema = Lyra.obj({
            a: 'x',
            b: {
                c: ref,
            },
        });

        Utils.validate(schema, [
            { value: { a: 'x', b: { c: 'x' } } },
            {
                value: { a: 'x', b: { c: 'y' } },
                error: {
                    code: 'any.only',
                    message: 'b.c must be "...a"',
                    local: { values: [ref], label: 'b.c' },
                },
            },
        ]);
    });

    it('should resolve ancestors with ancestor option', () => {
        const ref = Lyra.ref('a', { ancestor: 2 });
        const schema = Lyra.obj({
            a: 'x',
            b: {
                c: ref,
            },
        });

        Utils.validate(schema, [
            { value: { a: 'x', b: { c: 'x' } } },
            {
                value: { a: 'x', b: { c: 'y' } },
                error: {
                    code: 'any.only',
                    message: 'b.c must be "...a"',
                    local: { values: [ref], label: 'b.c' },
                },
            },
        ]);
    });

    it('should resolve global', () => {
        const ref = Lyra.ref('$a.b');
        const schema = Lyra.obj({
            a: ref,
        });

        Utils.validate(schema, { context: { a: { b: 'x' } } }, [
            { value: { a: 'x' } },
            {
                value: { a: 'y' },
                error: {
                    code: 'any.only',
                    message: 'a must be "global:a.b"',
                    local: { values: [ref], label: 'a' },
                },
            },
        ]);
    });

    it('should resolve self', () => {
        const ref = Lyra.ref('.a');
        const schema = Lyra.obj({
            a: Lyra.num(),
        })
            .min(ref)
            .unknown();

        Utils.validate(schema, [
            { value: { a: 1 } },
            {
                value: { a: 2 },
                error: {
                    code: 'object.min',
                    message: 'unknown must have at least ".a" key(s)',
                    local: { limit: ref, label: 'unknown' },
                },
            },
        ]);
    });

    it('should support in references for arrays', () => {
        const ref = Lyra.in('b');
        const schema = Lyra.obj({
            a: ref,
            b: Lyra.arr(Lyra.str()),
        });

        Utils.validate(schema, [
            {
                value: {
                    a: 'x',
                    b: ['x', 'y'],
                },
            },
            {
                value: {
                    a: 'y',
                    b: ['x', 'y'],
                },
            },
            {
                value: {
                    a: 'z',
                    b: ['x', 'y'],
                },
                error: {
                    code: 'any.only',
                    message: 'a must be "b"',
                    local: { values: [ref], label: 'a' },
                },
            },
        ]);
    });

    it('should support in reference for objects', () => {
        const ref = Lyra.in('b');
        const schema = Lyra.obj({
            a: ref,
            b: { x: 'x', y: 'y' },
        });

        Utils.validate(schema, [
            {
                value: {
                    a: 'x',
                    b: { x: 'x' },
                },
            },
            {
                value: {
                    a: 'y',
                    b: { y: 'y' },
                },
            },
            {
                value: {
                    a: 'x',
                    b: { x: 'x', y: 'y' },
                },
            },
            {
                value: {
                    a: 'x',
                    b: {},
                },
                error: {
                    code: 'any.only',
                    message: 'a must be "b"',
                    local: { values: [ref], label: 'a' },
                },
            },
            {
                value: {
                    a: 'y',
                    b: {
                        x: 'x',
                    },
                },
                error: {
                    code: 'any.only',
                    message: 'a must be "b"',
                    local: { values: [ref], label: 'a' },
                },
            },
        ]);
    });

    it('should treat in references as normal if resolved value is not an object', () => {
        const ref = Lyra.in('b');
        const schema = Lyra.obj({
            a: ref,
            b: 'x',
        });

        Utils.validate(schema, [
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

    it('should support deep in references', () => {
        const ref = Lyra.in('b.*.a');
        const schema = Lyra.obj({
            a: ref,
            b: Lyra.arr({ a: Lyra.str() }),
        });

        Utils.validate(schema, [
            {
                value: {
                    a: 'x',
                    b: [{ a: 'x' }],
                },
            },
            {
                value: {
                    a: 'x',
                    b: [{}],
                },
                error: {
                    code: 'any.only',
                    message: 'a must be "b.*.a"',
                    local: { values: [ref], label: 'a' },
                },
            },
            {
                value: {
                    a: 'z',
                    b: [{ a: 'x' }, { a: 'y' }],
                },
                error: {
                    code: 'any.only',
                    message: 'a must be "b.*.a"',
                    local: { values: [ref], label: 'a' },
                },
            },
        ]);
    });

    it('should support insensitive in references', () => {
        const ref = Lyra.in('b');
        const schema = Lyra.obj({
            a: Lyra.bool().truthy(ref).insensitive().convert(),
            b: Lyra.arr(Lyra.str()),
        });

        Utils.validate(schema, [
            {
                value: {
                    a: 'X',
                    b: ['x'],
                },
                output: {
                    a: true,
                    b: ['x'],
                },
            },
        ]);
    });

    it('should throw when ancestor is outside of schema', () => {
        const schema = Lyra.obj({
            a: Lyra.ref('...c'),
        });

        expect(() => schema.validate({ a: 1 })).toThrow('Reference to "...c" exceeds the schema root');
    });

    it('should ignore prefixes if prefix is set to false', () => {
        const ref = Lyra.ref('#a.b', { prefix: false });
        const schema = Lyra.obj({
            a: ref,
            '#a': {
                b: 'x',
            },
        });

        Utils.validate(schema, [
            { value: { a: 'x', '#a': { b: 'x' } } },
            {
                value: { a: 'y', '#a': { b: 'x' } },
                error: {
                    code: 'any.only',
                    message: 'a must be "#a.b"',
                    local: { values: [ref], label: 'a' },
                },
            },
        ]);
    });
});
