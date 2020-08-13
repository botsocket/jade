'use strict';

const Lyra = require('../../src');
const Utils = require('../utils');

describe('function()', () => {

    it('should validate functions', () => {

        const schema = Lyra.fn();

        Utils.validate(schema, [
            { value: () => { } },
            {
                value: 'x',
                error: {
                    code: 'function.base',
                    message: 'unknown must be a function',
                    local: { label: 'unknown' },
                },
            },
        ]);
    });

    describe('inherit()', () => {

        it('should throw on incorrect parameters', () => {

            expect(() => Lyra.fn().inherit('x')).toThrow('Constructor must be a function');
        });

        it('should validate inheritance', () => {

            class X { }

            class Y extends X { }

            const schema = Lyra.fn().inherit(X);

            Utils.validate(schema, [
                { value: Y },
                {
                    value: X,
                    error: {
                        code: 'function.inherit',
                        message: 'unknown must inherit X',
                        local: { label: 'unknown', ctor: X, name: 'X' },
                    },
                },
                {
                    value: () => { },
                    error: {
                        code: 'function.inherit',
                        message: 'unknown must inherit X',
                        local: { label: 'unknown', ctor: X, name: 'X' },
                    },
                },
            ]);
        });

        it('should validate multiple inheritances', () => {

            class X { }

            class Y extends X { }

            class Z extends Y { }

            const schema = Lyra.fn().inherit(X).inherit(Y);

            Utils.validate(schema, [
                { value: Z },
                {
                    value: Y,
                    error: {
                        code: 'function.inherit',
                        message: 'unknown must inherit Y',
                        local: { label: 'unknown', ctor: Y, name: 'Y' },
                    },
                },
                {
                    value: X,
                    error: {
                        code: 'function.inherit',
                        message: 'unknown must inherit X',
                        local: { label: 'unknown', ctor: X, name: 'X' },
                    },
                },
            ]);
        });
    });
});
