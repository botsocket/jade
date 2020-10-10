'use strict';

const Assert = require('@botsocket/bone/src/assert');

const Any = require('./any');
const Extend = require('../extend');

module.exports = Extend.schema(Any, {
    type: 'alternatives',
    flags: {
        mode: 'any',
    },
    terms: {
        items: { default: [], register: 0 },
    },
    messages: {
        'alternatives.any': '{#label} must match at least one of the provided schemas',
        'alternatives.one': '{#label} must not match more than one of the provided schemas',
        'alternatives.all': '{#label} must match all of the provided schemas',
    },

    args: (schema, ...schemas) => {

        return schema.try(...schemas);
    },

    rebuild: (schema) => {

        const items = schema.$terms.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.$isType('array')) {
                schema.$setFlag('_hasArrayItems', true, { clone: false });
            }

            const label = schema.$getFlag('label');
            if (label) {
                items[i] = item.label(label);
            }
        }
    },

    validate: (value, { schema, settings, state, error }) => {

        const mode = schema.$getFlag('mode');
        if (mode !== 'any') {
            let matches = 0;
            let matched;
            for (const item of schema.$terms.items) {
                const result = item.$validate(value, settings, state);

                if (result.errors) {
                    continue;
                }

                matches++;
                if (mode === 'one' &&
                    matches !== 1) {

                    return error('alternatives.one');
                }

                matched = result.value;
            }

            if (!matches) {
                return error('alternatives.any');
            }

            if (mode === 'all' &&
                matches !== schema.$terms.items.length) {

                return error('alternatives.all');
            }

            return matched;
        }

        const failures = [];
        for (const item of schema.$terms.items) {
            const result = item.$validate(value, settings, state);

            if (!result.errors) {
                return result.value;
            }

            failures.push(result.errors);
        }

        if (failures.length === 1) {
            return failures[0];
        }

        const context = {};
        if (failures.length) {
            context.attempts = [];
            for (const failure of failures) {
                context.attempts.push(...failure);
            }
        }

        return error('alternatives.any', context);
    },

    rules: {
        try: {
            method(...items) {

                Assert(items.length, 'Items must have at least one item');

                const target = this.clone();

                target.$terms.items.push(...items.map((item) => this.$compile(item)));
                return target.$rebuild();
            },
        },

        mode: {
            alias: 'match',
            method(mode) {

                Assert(mode === 'all' || mode === 'one' || mode === 'any', 'Mode must be all, one or any');

                return this.$setFlag('mode', mode);
            },
        },
    },

    overrides: {
        label(label) {

            const target = this.$super.label(label);
            return target.$rebuild();
        },
    },
});
