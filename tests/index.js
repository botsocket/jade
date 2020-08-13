'use strict';

const Lyra = require('../src');

describe('Lyra', () => {

    describe('isRef()', () => {

        it('should detect references', () => {

            expect(Lyra.isRef(Lyra.ref('x'))).toBe(true);
            expect(Lyra.isRef(null)).toBe(false);
        });
    });

    describe('isTemplate()', () => {

        it('should detect templates', () => {

            expect(Lyra.isTemplate(Lyra.template('x'))).toBe(true);
            expect(Lyra.isTemplate(null)).toBe(false);
        });
    });

    describe('isValues()', () => {

        it('should detect values', () => {

            expect(Lyra.isValues(Lyra.values())).toBe(true);
            expect(Lyra.isValues(null)).toBe(false);
        });
    });

    describe('isSchema()', () => {

        it('should detect schemas', () => {

            expect(Lyra.isSchema(Lyra.num())).toBe(true);
            expect(Lyra.isSchema(null)).toBe(false);
        });
    });

    describe('isResolvable()', () => {

        it('should detect references and templates', () => {

            expect(Lyra.isResolvable(Lyra.ref('x'))).toBe(true);
            expect(Lyra.isResolvable(Lyra.template('x'))).toBe(true);
            expect(Lyra.isResolvable(null)).toBe(false);
        });
    });
});
