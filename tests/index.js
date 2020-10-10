'use strict';

const Jade = require('../src');

describe('Jade', () => {

    describe('isRef()', () => {

        it('should detect references', () => {

            expect(Jade.isRef(Jade.ref('x'))).toBe(true);
            expect(Jade.isRef(null)).toBe(false);
        });
    });

    describe('isTemplate()', () => {

        it('should detect templates', () => {

            expect(Jade.isTemplate(Jade.template('x'))).toBe(true);
            expect(Jade.isTemplate(null)).toBe(false);
        });
    });

    describe('isValues()', () => {

        it('should detect values', () => {

            expect(Jade.isValues(Jade.values())).toBe(true);
            expect(Jade.isValues(null)).toBe(false);
        });
    });

    describe('isSchema()', () => {

        it('should detect schemas', () => {

            expect(Jade.isSchema(Jade.num())).toBe(true);
            expect(Jade.isSchema(null)).toBe(false);
        });
    });

    describe('isResolvable()', () => {

        it('should detect references and templates', () => {

            expect(Jade.isResolvable(Jade.ref('x'))).toBe(true);
            expect(Jade.isResolvable(Jade.template('x'))).toBe(true);
            expect(Jade.isResolvable(null)).toBe(false);
        });
    });
});
