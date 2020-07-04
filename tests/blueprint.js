'use strict';

const Dust = require('@botbind/dust');

const Lyra = require('../src');

describe('construct()', () => {
    it('should construct example schema', () => {
        const schema = Lyra.obj({
            a: Lyra.num(),
            b: Lyra.str(),
        });

        const constructed = Lyra.construct(schema.describe());
        const result = constructed.validate({ a: 1, b: 2 });

        expect(result.errors[0].message).toBe('b must be a string');
    });
});

describe('generate()', () => {
    it('should describe example schema', () => {
        const schema = Lyra.obj({
            a: Lyra.num().max(10),
        });

        const blueprint = {
            type: 'object',
            keys: {
                a: {
                    schema: {
                        type: 'number',
                        rules: [
                            {
                                name: 'max',
                                args: { limit: { value: 10 } },
                            },
                        ],
                    },
                },
            },
        };

        expect(Dust.equal(schema.describe(), blueprint)).toBe(true);
    });
});
