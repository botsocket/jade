'use strict';

const Util = require('util');

const Assert = require('@botbind/dust/src/assert');
const Equal = require('@botbind/dust/src/equal');

const Errors = require('../src/errors');

const internals = {};

exports.validate = function (schema, options, tests) {

    if (Array.isArray(options)) {
        tests = options;
        options = {};
    }

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const result = schema.validate(test.value, options);

        if (!test.error) {
            if (result.errors) {
                Assert(false,
                    [
                        'Validation failed with value:',
                        internals.inspect(test.value),
                        `Expect ${result.errors.length} error(s):`,
                        internals.inspect(result.errors.map(internals.summarizeError)),
                    ]
                        .join('\n'),
                );
            }

            const output = Object.prototype.hasOwnProperty.call(test, 'output') ? test.output : test.value;
            Assert(Equal(result.value, output),
                [
                    'Actual value:',
                    internals.inspect(result.value),
                    'Expected value:',
                    internals.inspect(output),
                ]
                    .join('\n'),
            );

            continue;
        }

        Assert(result.errors, `Validation passed with value: ${internals.inspect(result.value)}. Expect 0 error`);

        if (Array.isArray(test.error)) {
            const expectedLength = test.error.length;
            const actualLength = result.errors.length;
            Assert(expectedLength === actualLength,
                [
                    'Invalid expected errors.',
                    `Expect ${result.errors.length} error(s)`,
                    internals.inspect(result.errors.map(internals.summarizeError)),
                ]
                    .join('\n'),
            );

            for (let j = 0; j < expectedLength; j++) {
                const expectedError = test.error[j];
                const actualError = internals.summarizeError(result.errors[j]);

                Assert(Equal(actualError, expectedError),
                    [
                        'Actual error:',
                        internals.inspect(actualError),
                        'must be equal to expected error:',
                        internals.inspect(expectedError),
                    ]
                        .join('\n'),
                );
            }

            continue;
        }

        for (const error of result.errors) {
            const actualError = internals.summarizeError(error);

            Assert(Equal(actualError, test.error),
                [
                    'Actual error:',
                    internals.inspect(actualError),
                    'must be equal to expected error:',
                    internals.inspect(test.error),
                ]
                    .join('\n'),
            );
        }
    }
};

internals.summarizeError = function (error) {

    const summary = {
        code: error.code,
        message: error.message,
        local: error.local,
    };

    // Summarize errors

    for (const key of Object.keys(summary.local)) {
        const errors = Errors.extract(summary.local[key]);

        if (!errors) {
            continue;
        }

        summary.local[key] = errors.map(internals.summarizeError);
    }

    return summary;
};

internals.inspect = function (value) {

    return Util.inspect(value, {
        colors: true,
        depth: null,
    });
};
