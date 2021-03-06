'use strict';

const Jade = require('../src');
const Utils = require('./utils');

describe('template()', () => {

    it('should support reference options', () => {

        const template = Jade.template('This is {#a}', { prefix: false });
        const schema = Jade.obj({
            '#a': 'x',
            b: template,
        });

        Utils.validate(schema, [
            { value: { '#a': 'x', b: 'This is x' } },
            {
                value: { '#a': 'x', b: 'This is y' },
                error: {
                    code: 'any.only',
                    message: 'b must be "This is {#a}"',
                    local: { values: [template], label: 'b' },
                },
            },
        ]);
    });
});
