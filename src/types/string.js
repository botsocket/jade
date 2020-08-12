'use strict';

const Assert = require('@botbind/dust/src/assert');

const Any = require('./any');
const Extend = require('../extend');
const Utils = require('../utils');

const internals = {
    // Copied from https://stackoverflow.com/a/41437076/10598722
    emailRx: /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@[*[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+]*/,
    // Copied from https://mathiasbynens.be/demo/url-regex @stephenhay
    urlRx: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/,
    alphanumericRx: /^[a-zA-Z0-9]+$/,
    numericRx: /^[0-9]+$/,
    dataUriRx: /^data:[\w+.-]+\/[\w+.-]+;(?:(charset=[\w-]+|base64),)?(.*)$/,
    base64Rx: {
        // paddingRequired
        true: {
            // urlSafe
            true: /^(?:[\w-]{2}[\w-]{2})*(?:[\w-]{2}==|[\w-]{3}=)?$/,
            false: /^(?:[A-Za-z0-9+/]{2}[A-Za-z0-9+/]{2})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
        },
        false: {
            true: /^(?:[\w-]{2}[\w-]{2})*(?:[\w-]{2}(==)?|[\w-]{3}=?)?$/,
            false: /^(?:[A-Za-z0-9+/]{2}[A-Za-z0-9+/]{2})*(?:[A-Za-z0-9+/]{2}(==)?|[A-Za-z0-9+/]{3}=?)?$/,
        },
    },
};

module.exports = Extend.schema(Any, {
    type: 'string',
    flags: {
        trim: false,
        insensitive: false,
    },
    terms: {
        replacements: { default: [] },
    },
    messages: {
        'string.base': '{#label} must be a string',
        'string.empty': '{#label} must not be an empty string',
        'string.length': '{#label} must have {#limit} character(s)',
        'string.min': '{#label} must have at least {#limit} character(s)',
        'string.max': '{#label} must have at most {#limit} character(s)',
        'string.dataUri': '{#label} must be a data uri',
        'string.base64': '{#label} must be a base64 string',
        'string.creditCard': '{#label} must be a credit card number',
        'string.pattern': '{#label} must have pattern {#name}',
        'string.email': '{#label} must be an email',
        'string.url': '{#label} must be a URL',
        'string.alphanum': '{#label} must only contain alphanumeric characters',
        'string.numeric': '{#label} must only contain numeric characters',
        'string.uppercase': '{#label} must only contain uppercase characters',
        'string.lowercase': '{#label} must only contain lowercase characters',
        'string.trim': '{#label} must not contain leading and trailing whitespaces',
    },

    coerce: (value, { schema }) => {
        value = String(value);

        const casing = schema.$getFlag('case');
        if (casing === 'upper') {
            value = value.toLocaleUpperCase();
        }

        if (casing === 'lower') {
            value = value.toLocaleLowerCase();
        }

        if (schema.$getFlag('trim')) {
            value = value.trim();
        }

        for (const { pattern, replacement } of schema.$terms.replacements) {
            value = value.replace(pattern, replacement);
        }

        return value;
    },

    validate: (value, { error }) => {
        if (typeof value !== 'string') {
            return error('string.base');
        }

        if (value === '') {
            return error('string.empty');
        }

        return value;
    },

    rules: {
        length: {
            args: {
                limit: {
                    ref: true,
                    assert: Utils.isNumber,
                    message: 'must be a number',
                },
            },

            method(limit) {
                return this.$addRule({ name: 'length', args: { limit }, operator: '=' });
            },

            validate: (value, { error }, { limit }, { name, args, operator }) => {
                if (Utils.compare(value.length, limit, operator)) {
                    return value;
                }

                return error(`string.${name}`, { limit: args.limit });
            },
        },

        min: {
            method(limit) {
                return this.$addRule({ name: 'min', method: 'length', args: { limit }, operator: '>=' });
            },
        },

        max: {
            method(limit) {
                return this.$addRule({ name: 'max', method: 'length', args: { limit }, operator: '<=' });
            },
        },

        insensitive: {
            method(enabled = true) {
                return this.$setFlag('insensitive', enabled);
            },
        },

        dataUri: {
            args: ['options'],

            method(options = {}) {
                return this.$addRule({ name: 'dataUri', args: { options } });
            },

            validate: (value, { error }, { options }) => {
                const matches = internals.dataUriRx.exec(value);
                if (matches) {
                    if (!matches[1] ||
                        matches[1] !== 'base64') {

                        return value;
                    }

                    if (internals.validateBase64(matches[2], options)) {
                        return value;
                    }
                }

                return error('string.dataUri');
            },
        },

        base64: {
            args: ['options'],

            method(options = {}) {
                return this.$addRule({ name: 'base64', args: { options } });
            },

            validate: (value, { error }, { options }) => {
                if (internals.validateBase64(value, options)) {
                    return value;
                }

                return error('string.base64');
            },
        },

        creditCard: {
            validate: (value, { error }) => {
                let i = value.length;
                let sum = 0;
                let mul = 1;

                while (i--) {
                    const char = value.charAt(i) * mul;

                    sum += char - (char > 9) * 9;
                    mul ^= 3;
                }

                if (sum &&
                    sum % 10 === 0) {

                    return value;
                }

                return error('string.creditCard');
            },
        },

        pattern: {
            alias: 'regex',
            single: false,
            args: ['regex', 'name'],

            method(regex, name) {
                Assert(regex instanceof RegExp, 'Regex must be a valid regular expression');
                Assert(!regex.flags.includes('g') && !regex.flags.includes('y'), 'Regex must not contain global and sticky flags');
                Assert(name === undefined || typeof name === 'string', 'Name must be a string');

                return this.$addRule({ name: 'pattern', args: { regex, name } });
            },

            validate: (value, { error }, { regex, name = 'unknown' }) => {
                if (regex.test(value)) {
                    return value;
                }

                return error('string.pattern', { regex, name });
            },
        },

        email: {
            validate: (value, { error }) => {
                if (internals.emailRx.test(value)) {
                    return value;
                }

                return error('string.email');
            },
        },

        url: {
            validate: (value, { error }) => {
                if (internals.urlRx.test(value)) {
                    return value;
                }

                return error('string.url');
            },
        },

        alphanum: {
            validate: (value, { error }) => {
                if (internals.alphanumericRx.test(value)) {
                    return value;
                }

                return error('string.alphanum');
            },
        },

        numeric: {
            validate: (value, { error }) => {
                if (internals.numericRx.test(value)) {
                    return value;
                }

                return error('string.numeric');
            },
        },

        case: {
            convert: true,
            args: ['dir'],

            method(dir) {
                Assert(dir === 'upper' || dir === 'lower', 'Direction must be upper or lower');

                const target = this.$setFlag('case', dir);
                return target.$addRule({ name: 'case', args: { dir }, clone: false });
            },

            validate: (value, { error }, { dir }) => {
                if (dir === 'lower' &&
                    value.toLocaleLowerCase() === value) {

                    return value;
                }

                if (value.toLocaleUpperCase() === value) {
                    return value;
                }

                return error(`string.${dir}case`);
            },
        },

        uppercase: {
            method() {
                return this.case('upper');
            },
        },

        lowercase: {
            method() {
                return this.case('lower');
            },
        },

        trim: {
            convert: true,
            args: ['enabled'],

            method(enabled = true) {
                const target = this.$addRule({ name: 'trim', args: { enabled } });
                target.$setFlag('trim', enabled, { clone: false });
                return target;
            },

            validate: (value, { error }, { enabled }) => {
                if (!enabled ||
                    value === value.trim()) {

                    return value;
                }

                return error('string.trim');
            },
        },

        replace: {
            method(pattern, replacement) {
                Assert(pattern instanceof RegExp || typeof pattern === 'string', 'Pattern must be a valid regular expression or a string');
                Assert(typeof replacement === 'string', 'Replacement must be a string');

                const target = this.clone();

                target.$terms.replacements.push({ pattern, replacement });
                return target;
            },
        },
    },
});

internals.validateBase64 = function (value, options) {
    const paddingRequired = options.paddingRequired !== false;
    const urlSafe = options.urlSafe !== false;
    return internals.base64Rx[paddingRequired][urlSafe].test(value);
};
