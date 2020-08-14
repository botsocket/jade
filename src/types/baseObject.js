'use strict';

const Any = require('./any');
const Extend = require('../extend');
const Utils = require('../utils');

module.exports = Extend.schema(Any, {
    type: '_baseObject',

    overrides: {
        default(value, options) {

            if (value === undefined) {
                const target = this.$super.default(Utils.symbols.deepDefault, options);
                return target.$rebuild();
            }

            return this.$super.default(value, options);
        },
    },
});
