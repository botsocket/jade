# Documentation

## Introduction

Lyra is a robust and powerful data validator. It uses a human-readable language heavily inspired by `@hapi/joi` to compose complex and reusable schemas.

## Installation

Lyra is available on npm:

```bash
npm install @botbind/lyra
```

## Usage

```js
const Lyra = require('@botbind/lyra');

const schema = Lyra.object({
    username: Lyra.string().alphanum().min(5).max(30).required(),
    email: Lyra.string().email().required(),
    dob: Lyra.date().max('now').required(),
    password: Lyra.string()
        .pattern(/^[a-zA-Z0-9@]{5,30}$/)
        .required(),
    repeatPassword: Lyra.ref('password'),
})
    .xor('username', 'email')
    .required();

schema.validate({
    username: 'BotBind',
    email: 'example@botbind.com',
    dob: '01/01/2020',
    password: 'BotBindIsAwesome',
    repeatPassword: 'BotBindIsAwesome',
});
```

A schema must be constructed prior to validation. The one in the above example defines the following constraints:

-   `username`:
    -   Must be a required alphanumeric string.
    -   Must have at least 5 characters.
    -   Must have at most 30 characters.
    -   Cannot be provided with `email`.
-   `email`:
    -   Must be a required email.
-   `dob`:
    -   Must be a required date.
    -   Must be before "now" (the current timestamp).
-   `password`:
    -   Must be a required string.
    -   Must match the custom regular expression.
-   `repeatPassword`:
    -   Must equal to `password`.

Note that Lyra's schemas are immutable and will be cloned whenever additional rules are specified:

```js
const schema = Lyra.number();
const schema2 = schema.min(1);

schema === schema2; // false
```

Lyra returns an object representing the result of a validation once it finishes where:

-   `value`: The modified value. Not provided if validation fails.
-   `errors`: An array of validation errors. Not provided if validation succeeds.

```js
const schema = Lyra.string().uppercase();
let result = schema.validate('a', { strict: false });

result; // { value: 'A' }

result = schema.validate('a');

result; // { errors: [ ValidationError: unknown must only contain uppercase characters ] }
```

## API

-   [`template()`](#templatesource-options)
-   [`ref()`](#refpath-options)
-   [`in()`](#inpath-options)
-   [`isSchema()`](#isSchemavalue)
-   [`isRef()`](#isRefvalue)
-   [`isTemplate()`](#isTemplatevalue)
-   [`isResolvable()`](#isResolvable)
-   [`compile()`](#compilevalue)
-   [`construct()`](#constructblueprint)
-   [`extend()`](#extendextensions)
-   [`override`](#override)
-   [Shorcuts](#shortcuts)
-   [`any()`](#any)
    -   [`any.type`](#anytype)
    -   [`any.clone()`](#anyclone)
    -   [`any.merge()`](#anymergesource)
    -   [`any.describe()`](#anydescribe)
    -   [`any.settings()`](#anysettingsoptions)
    -   [`any.cast()`](#anycastto)
    -   [`any.convert()`](#anyconvertenabled)
    -   [`any.messages()`](#anymessagesmessages)
    -   [`any.annotate()`](#anyannotatenotes)
    -   [`any.rule()`](#anyrulemethod-description)
    -   [`any.presence()`](#anypresencepresence)
    -   [`any.optional()`](#anyoptional)
    -   [`any.required()`](#anyrequired)
    -   [`any.forbidden()`](#anyforbidden)
    -   [`any.default()`](#anydefaultvalue-options)
    -   [`any.label()`](#anylabellabel)
    -   [`any.only()`](#anyonlyenabled)
    -   [`any.allow()`](#anyallowvalues)
    -   [`any.valid()`](#anyvalidvalues)
    -   [`any.invalid()`](#anyinvalidvalues)
    -   [`any.strip()`](#anystripenabled)
    -   [`any.raw()`](#anyrawenabled)
    -   [`any.switch()`](#anyswitchsubject-branches)
    -   [`any.when()`](#anywhensubject-options)
    -   [`any.validate()`](#anyvalidatevalue-options)
    -   [`any.attempt()`](#anyattemptvalue-options)
-   [`boolean()`](#boolean)
    -   [`boolean.insensitive()`](#booleaninsensitiveenabled)
    -   [`boolean.truthy()`](#booleantruthyvalues)
    -   [`boolean.falsy()`](#booleanfalsyvalues)
-   [`string()`](#string)
    -   [`string.length()`](#stringlengthlimit)
    -   [`string.min()`](#stringminlimit)
    -   [`string.max()`](#stringmaxlimit)
    -   [`string.insensitive()`](#stringinsensitiveenabled)
    -   [`string.dataUri()`](#stringdataurioptions)
    -   [`string.base64()`](#stringbase64options)
    -   [`string.creditCard()`](#stringcreditcard)
    -   [`string.pattern()`](#stringpatternregex-name)
    -   [`string.email()`](#stringemail)
    -   [`string.url()`](#stringurl)
    -   [`string.alphanum()`](#stringalphanum)
    -   [`string.numeric()`](#stringnumeric)
    -   [`string.case()`](#stringcasedir)
    -   [`string.uppercase()`](#stringuppercase)
    -   [`string.lowercase()`](#stringlowercase)
    -   [`string.trim()`](#stringtrimenabled)
    -   [`string.replace()`](#stringreplacepattern-replacement)
-   [`number()`](#number)
    -   [`number.unsafe()`](#numberunsafeenabled)
    -   [`number.integer()`](#numberinteger)
    -   [`number.min()`](#numberminlimit)
    -   [`number.max()`](#numbermaxlimit)
    -   [`number.greater()`](#numbergreaterlimit)
    -   [`number.less()`](#numberlesslimit)
    -   [`number.multiple()`](#numbermultiplefactor)
    -   [`number.even()`](#numbereven)
    -   [`number.divide()`](#numberdividedividend)
-   [`date()`](#date)
    -   [`date.min()`](#dateminlimit)
    -   [`date.max()`](#datemaxlimit)
    -   [`date.greater()`](#dategreaterlimit)
    -   [`date.less()`](#datelesslimit)
-   [`function()`](#function)
    -   [`function.inherit()`](#functioninheritctor)
-   [`array()`](#array)
    -   [`array.items()`](#arrayitemsitems)
    -   [`array.ordered()`](#arrayordereditems)
    -   [`array.single()`](#arraysingleenabled)
    -   [`array.sparse()`](#arraysparseenabled)
    -   [`array.length()`](#arraylengthlimit)
    -   [`array.max()`](#arraymaxlimit)
    -   [`array.min()`](#arrayminlimit)
    -   [`array.unique()`](#arrayuniquecomparator)
-   [`object()`](#object)
    -   [`object.unknown()`](#objectunknownenabled)
    -   [`object.extract()`](#objectextractpath)
    -   [`object.keys()`](#objectkeyskeys)
    -   [`object.pattern()`](#objectpatternkey-value)
    -   [`object.length()`](#objectlengthlimit)
    -   [`object.max()`](#objectmaxlimit)
    -   [`object.min()`](#objectminlimit)
    -   [`object.instance()`](#objectinstancector)
    -   [`object.regex()`](#objectregex)
    -   [`object.schema()`](#objectschematype-options)
    -   [`object.ref()`](#objectref)
    -   [`object.template()`](#objecttemplate)
    -   [`object.and()`](#objectandpeers)
    -   [`object.nand()`](#objectnandpeers)
    -   [`object.or()`](#objectorpeers)
    -   [`object.xor()`](#objectxorpeers)
    -   [`object.oxor()`](#objectoxorpeers)
-   [`alternatives()`](#alternatives)
    -   [`alternatives.try()`](#alternativestryitems)
    -   [`alternatives.mode()`](#alternativesmodemode)

### `template(source, [options])`

Creates a new template where:

-   `source`: The source of the template.
-   `options`: Optional options passed to [references](#refpath-options).

Templates perform complex evaluation of references at validation-time. The syntax is documented [here](#https://github.com/botbind/template/blob/master/Documentation.md#parsesource-options).

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.valid(Lyra.template('This is {a}')),
});

schema.validate({
    a: 'x',
    b: 'This is x',
}); // Pass

schema.validate({
    a: 'This is y',
    b: 'x',
}); // a must be "This is {a}"
```

With expressions:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.valid(Lyra.template('{a + 1}')),
});

schema.validate({
    a: 1,
    b: 2
}); // Pass

schema.validate({
    a: 1,
    b: 3
}); // b must be "{a + 1}"
```

[Back to top](#api)

### `ref(path, [options])`

Creates a new reference where:

-   `path`: The path to the value.
-   `options`: Optional options where:
    -   `prefix`: Whether prefixes are taken into consideration. If set to `false`, the path will be treated as if there was no prefix. Defaults to `true`.
    -   `ancestor`: An optional number indicating the relative starting point. Note that this cannot be combined with the ancestor notation. Defaults to `1` if the notation is not used.
    -   `in`: Whether the reference is an [`in` reference](#inpath-options).

By default, a reference is relative to its parent:

```js
const schema = Lyra.object({
    a: Lyra.ref('b'),
    b: 'x',
});

schema.validate({
    a: 'x',
    b: 'x',
}); // Pass

schema.validate({
    a: 'y',
    b: 'x',
}); // a must be "b"
```

To reference uncle nodes, use the ancestor notation:

```js
const schema = Lyra.object({
    a: 'x',
    b: {
        c: Lyra.ref('...a'),
    },
});

schema.validate({
    a: 'x',
    b: {
        c: 'x'
    }
}); // Pass

schema.validate({
    a: 'x',
    b: {
        c: 'y'
    }
}); // b.c must be "...a"
```

The notation is interpreted as follows:

-   `.`: self.
-   `..`: parent (Same as not using the notation at all).
-   `...`: grandparent.
-   `....`: great grandparent.
-   etc.

The `ancestor` option can also be used:

```js
const schema = Lyra.object({
    a: 'x',
    b: {
        c: Lyra.ref('a', { ancestor: 2 }),
    },
});

schema.validate({
    a: 'x',
    b: {
        c: 'x'
    }
}); // Pass

schema.validate({
    a: 'x',
    b: {
        c: 'y'
    }
}); // b.c must be "...a"
```

`ancestor` is interpreted as follows:

-   `0`: self.
-   `1`: parent (Same as not using the option at all).
-   `2`: grandparent.
-   `3`: great grandparent.

In addition to referencing values, you can also reference global context provided via [`any.validate()`](#anyvalidationvalue-options) and local context (only in error messages).

```js
const schema = Lyra.object({
    a: Lyra.ref('$a.b'),
});

schema.validate({ a: 'x' }, {
    context: {
        a: { b: 'x' },
    },
}); // Pass

schema.validate({ a: 'y' }, {
    context: {
        a: { b: 'x' },
    },
}); // a must be "global:a.b"
```

[Back to top](#api)

### `in(path, [options])`

Creates an in reference that resolves to array items and object keys where:

-   `path`: The path to the value.
-   `options`: Optional options passed to [references](#refpath-options) (without `in`).

Note that if the created reference does not point to an array or object, it will behave like a normal reference.

```js
const schema = Lyra.object({
    a: Lyra.in('b'),
    b: Lyra.array(Lyra.string()),
});

schema.validate({
    a: 'x',
    b: ['x', 'y'],
}); // Pass

schema.validate({
    a: 'y',
    b: ['x', 'y'],
}); // Pass

schema.validate({
    a: 'z',
    b: ['x', 'y'],
}); // a must be "b"
```

Example using [`object.pattern()`](#objectpatternkey-value):

```js
const schema = Lyra.object({
    a: Lyra.array(Lyra.string()),
    b: Lyra.object().pattern(Lyra.in('a'), Lyra.string()),
});

schema.validate({
    a: ['a', 'b'],
    b: {
        a: 'x',
        b: 'y',
    },
}); // Pass

schema.validate({
    a: ['a', 'b'],
    b: {
        a: 'x',
        b: 1,
    },
}); // b.b must be a string

schema.validate({
    a: ['a', 'b'],
    b: {
        a: 'x',
        c: 'z',
    },
}); // b.c is not allowed
```

Deep in reference:

```js
const schema = Lyra.object({
    a: Lyra.in('b.*.a'),
    b: Lyra.array().items({ a: Lyra.string() }),
});

schema.validate({
    a: 'x',
    b: [{ a: 'x' }],
}); // Pass

schema.validate({
    a: 'z',
    b: [{ a: 'x' }, { a: 'y' }],
}); // a must be "b.*.a"

schema.validate({
    a: 'x',
    b: [{}],
}); // a must be "b.*.a"
```

[Back to top](#api)

### `isSchema(value)`

Checks if a value is a valid Lyra's schema where:

-   `value`: The value to check.

```js
Lyra.isSchema(Lyra.number()); // true
Lyra.isSchema(null); // false
```

[Back to top](#api)

### `isRef(value)`

Checks if a value is a valid Lyra's reference where:

-   `value`: The value to check.

```js
Lyra.isRef(Lyra.ref('x')); // true
Lyra.isRef(null); // false
```

[Back to top](#api)

### `isTemplate(value)`

Checks if a value is valid Lyra's template where:

-   `value`: The value to check.

```js
Lyra.isTemplate(Lyra.template('x')); // true
Lyra.isTemplate(null); // false
```

[Back to top](#api)

### `isResolvable(value)`

Checks if a value is a valid Lyra's reference or [template](#templatesource-options) where:

-   `value`: The value to check.

Equivalent to `Lyra.isRef(value) || Lyra.isTemplate(value)`.

```js
Lyra.isResolvable(Lyra.ref('x')); // true
Lyra.isResolvable(Lyra.template('x')); // true
Lyra.isResolvable(null); // false
```

[Back to top](#api)

### `compile(value)`

Compiles a literal to a schema where:

-   `value`: The value to compile.

```js
const validateFn = function (value) {
    if (value === 'someValue') {
        return value;
    }

    throw new Error('Invalid');
};

const schema = Lyra.compile({
    a: 'x',
    b: [Lyra.ref('a'), 1],
    c: /^abc$/,
    d: validateFn,
    e: {
        f: 1,
    },
});

// Is equivalent to

const schema2 = Lyra.object({
    a: Lyra.any().valid(Lyra.override, 'x'),
    b: Lyra.any().valid(Lyra.override, ref, 1),
    c: Lyra.string().pattern(/^abc$/),
    d: Lyra.any().rule(validateFn),
    e: Lyra.object({
        f: Lyra.any().valid(Lyra.override, 1),
    }),
});
```

[Back to top](#api)

### `construct(blueprint)`

Constructs a schema from its blueprint (generated by [`any.describe()`](#anydescribe)) where:

-   `blueprint`: The blueprint to construct from.

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.string(),
});

const constructed = Lyra.construct(schema.describe());

constructed.validate({
    a: 1,
    b: 2,
}); // b must be a string
```

[Back to top](#api)

### `extend(...extensions)`

**Note:** Due to the complexity of the extension system, only a few options are documented. Please open an issue if you need help extending your schemas.

Extends the default Lyra instance to include new types where:

-   `extensions`: An array of extension objects or factory functions of signature `function (root) {}` generating extension objects where:
    -   `type`: The type of the extension. Can be a string, an array of strings or a regular expression matching the desired types.
    -   `alias`: Optional aliases to the extension. Can be a string or an array of strings.
    -   `from`: An optional base schema to extend from. If `type` is an array with more than 1 item or a regular expression, this key is forbidden and multiple bases are used.
    -   `flags`: An optional hash of flag names and their default values.
    -   `messages`: An optional hash of error codes and their messages (can be [templates](#templatesource-options) or raw strings).
    -   `args`: An optional function of signature `function (schema, ...args)` that processes constructor arguments. Must return a schema.
    -   `rebuild`: An optional function of signature `function (schema) {}` that customizes how the schema is rebuilt. Must return the modified schema.
    -   `coerce`: An optional function of signature `function (value, helpers) {}` that coerces the input value if it does not match the desired type. Only executed when the `strict` option passed via [`any.validate()`](#anyvalidatevalue-options) or [`any.settings()`](#anysettingsoptions) is set to `false`. Must return an error or the modified value.
    -   `validate`: An optional function of signature `function (value, helpers) {}` that performs base validation on the input value. Must return an error or the validated value.
    -   `rules`: An optional hash of rule names and their configurations where:
        -   `method`: The method that is attached to the type. Can be a function, `false` or `undefined`. If set to `false`, the rule is private. If not provided, the rule is added to the rule queue implicitly.
        -   `alias`: The aliases to the rule. Can be a string or an array of strings. Note that if `method` is not provided, this key is forbidden.
        -   `validate`: An optional function of signature `function (value, helpers, args, rule) {}` that validates the input value. Note that is `method` is set to `false` or not provided, this key is required.
        -   `single`: Whether the rule only supports single invocation. Defaults to `true`. Note that if `validate` is not provided, this key is forbidden.
        -   `convert`: Whether the rule is dual (converts or validates a value). Defaults to `false`. Note that if `validate` is not provided, this key is forbidden.
        -   `args`: An array of argument names or hash of each individual argument and its configurations where:
            -   `ref`: Whether [references](#refpath-options) are allowed. Default to `false`.
            -   `assert`: A function of signature `function (arg)` that returns a boolean indicating the validity of the argument or a schema.
            -   `message`: A "partial" reason explaining why the assertion failed. Note that if `assert` is a schema, this key is forbidden. For example, `'must be a number'` or `'must be greater than 10'`.
    -   `overrides`: An optional hash of methods and their new implementations.
    -   `casts`: An optional hash of destination types and coercions.

`helpers` is an object with the following keys:

-   `schema`: The current schema.
-   `state`: The current validation state.
-   `setting`: The processed validation options passed via [`any.validate()`](#anyvalidatevalue-options) and [`any.settings()`](#anysettingsoptions)
-   `original`: The original unmodified value.
-   `error`: A function of signature `function (code, [local], [state]) {}` that acts as a shortcut to `$createError()` with `value` and `options` implicitly passed. Generates a validation error that is recognized as a valid return value from `coerce()` or `validate()`.

Schema supports the following extension methods:

-   `$isType`: A function of signature `function (type) {}` that checks if the schema is extended from the specified type.

```js
Lyra.object().$isType('any'); // true
Lyra.object().type === 'any'; // false
```

-   `$compile`: A function of signature `function (value) {}` that compiles a literal to a schema. Similar to (but not exactly the same) [`compile()`](#compilevalue).
-   `$getFlag`: A function of signature `function (name) {}` that retrieves a flag (and returns its default value if no value has been set) where:
    -   `name`: The name of the flag.
-   `$setFlag`: A function of signature `function (name, value, [options]) {}` that sets a flag where:
    -   `name`: The name of the flag.
    -   `value`: The value to set to.
    -   `options`: Optional options where:
        -   `clone`: Whether the schema is cloned. Defaults to `true`.
-   `$rebuild`: A function that resets and re-registers any references stored in the current schema.
-   `$references`: A function that collects all the root references of the current schema (including its children).
-   `$addRule`: A function of signature `function (options) {}` that adds a rule to the rule queue where:

    -   `options`: Rule configurations where:
        -   `name`: The name of the rule.
        -   `method`: The name of the private rule if the current rule depends on one.
        -   `args`: An hash of argument names and their values. Note that it must satisfy the constraints provided via `args` (in the extension rule config).
        -   `clone`: Whether the schema is cloned. Defaults to `true`.
        -   Any additional keys provided will be passed as is to the `validate` method as the `rule` argument.

-   `$createError`: A function of signature `function (value, code, settings, state, [local]) {}` that creates a validation error where:
    -   `value`: The current value being validated.
    -   `code`: The error code.
    -   `settings`: The processed validation options.
    -   `state`: The current validation state.
    -   `local`: Additional context passed to the error templates for interpolation.
-   `$validate`: A function of signature `function (value, settings, state, [overrides]) {}`. Same as [`any.validate()`](#anyvalidate), but supports providing custom state and validation errors. Also supports `overrides` options where:
    -   `presence`: The override presence. Can be `optional`, `required`, `forbidden` or `ignore`.

If you need to deal with references, you can resolve them by calling `resolve(value, settings, state)` where:

-   `value`: The current value being validated.
-   `settings`: The proccessed validation options.
-   `state`: The current validation state.

The following example demonstrates how the string schema can be extended to validate semantic versions using the `semver` module:

```js
const Lyra = require('@botbind/lyra');
const Semver = require('semver');

const custom = Lyra.extend((root) => ({
    type: 'semver',
    from: root.string(),
    flags: {
        clean: false, // Define the default value for clean
    },
    messages: {
        'semver.base': '{#label} must have valid semver format',
        'semver.condition': '{#label} does not satisfy condition "{#condition}"',
        'semver.gt': '{#label} must be greater than {#limit}',
        'semver.gte': '{#label} must be greater than or equal to {#limit}',
        'semver.lt': '{#label} must be less than {#limit}',
        'semver.lte': '{#label} must be less than or equal to {#limit}',
    },

    coerce: (value, { schema }) => {
        const coerced = Semver.coerce(value);

        if (!coerced) { // Coerce failed
            return value; // Return the raw value, which will fail in validate()
        }

        // Clean, if specified

        value = coerced.version;
        if (schema.$getFlag('clean')) {
            value = Semver.clean(value);
        }

        return value;
    },

    validate: (value, { error, schema }) => {
        if (!Semver.valid(value)) {
            return error('semver.base');
        }

        // Validate condition, if any

        const condition = schema.$getFlag('condition');
        if (condition &&
            !Semver.satisfies(value, condition)) {

            return error('semver.condition', { condition });
        }

        return value;
    },

    rules: {
        clean: {
            method(enabled = true) {
                // Set the flag for later use
                return this.$setFlag('clean', enabled);
            },
        },

        condition: {
            method(condition) {
                if (typeof condition !== 'string') {
                    throw new Error('Condition must be a string');
                }

                return this.$setFlag('condition', condition);
            },
        },

        cmp: {
            args: {
                limit: {
                    ref: true,
                    assert: root.str().rule((limit) => {
                        // Validate the argument

                        if (Semver.valid(limit)) {
                            return limit;
                        }

                        // Failed

                        throw new Error('Invalid limit');
                    }),
                },
            },

            method: false, // Private rule
            validate: (value, { error }, { limit }, { args, name, operator }) => {
                if (!Semver.cmp(value, operator, limit)) {
                    return error(`semver.${name}`, { limit: args.limit });
                }

                return value;
            },
        },

        lt: {
            method(limit) {
                // Invoke the private rule, passing the arguments and the custom key operator

                return this.$addRule({ name: 'lt', method: 'cmp', args: { limit }, operator: '<' });
            },
        },

        lte: {
            method(limit) {
                return this.$addRule({ name: 'lte', method: 'cmp', args: { limit }, operator: '<=' });
            },
        },

        gt: {
            method(limit) {
                return this.$addRule({ name: 'gt', method: 'cmp', args: { limit }, operator: '>' });
            },
        },

        gte: {
            method(limit) {
                return this.$addRule({ name: 'gte', method: 'cmp', args: { limit }, operator: '>=' });
            },
        },
    },
}));

const a = custom.semver();
const b = custom.semver().convert(); // Triggers coerce
const c = custom.semver().clean().convert(); // Triggers cleaning
const d = custom.semver().condition('1.x || >=2.5.0 || 5.0.0 - 7.2.3'); // Custom condition before performing rules
const e = custom.semver().lt('2.0.0'); // Lt rule
const ref = custom.ref('b');
const f = custom.obj({
    a: custom.semver().gt(ref),
    b: custom.semver().convert(),
}); // Passing reference as semvers
```

Extensions can also be utilized to reduce repetition of the same rules:

```js
const custom = Lyra.extend({
    type: 'myComplexArray',
    from: Lyra.array().items(Lyra.string().required()),
});

const schema = custom.myComplexArray();

schema.validate(['x', 'y']); // Pass
schema.validate([]); // unknown does not have 1 required value
```

Note that extending from a complex base will cause [`construct()`](#constructblueprint) to fail (this is a known limitation). If you do not need this functionality, you can do safely extend from a complex base.

[Back to top](#api)

### `override`

Signifies [`any.valid()`](#anyvalidvalues), [`any.allow()`](#anyallowvalues), [`any.invalid()`](#anyinvalidvalues), [`boolean.truthy()`](#booleantruthyvalues) and [`boolean.falsy()`](#booleanfalsyvalues) to override any previously registered values.

```js
const schema = Lyra.valid('x').valid(Lyra.override, 'y');

schema.validate('x'); // unknown must be y
schema.validate('y'); // Pass
```

Note that `Lyra.override` must be provided as the first value.

[Back to top](#api)

### Shortcuts

Lyra offers a few shortcuts for [`any()`](#any) methods to increase readability when building complex schemas:

```js
Lyra.allow(); // Equivalent to Lyra.any().allow()

Lyra.rule(); // Equivalent to Lyra.any().rule()
Lyra.custom(); // Alias of Lyra.rule()

Lyra.invalid(); // Equivalent to Lyra.any().invalid()
Lyra.disallow(); // Alias of Lyra.invalid()
Lyra.deny(); // Alias of Lyra.invalid()
Lyra.not(); // Alias of Lyra.invalid()

Lyra.valid(); // Equivalent to Lyra.any().valid()
Lyra.equal(); // Alias of Lyra.valid()
Lyra.is(); // Alias of Lyra.valid()

Lyra.required(); // Equivalent to Lyra.any().required()
Lyra.exists(); // Alias of Lyra.required()
Lyra.present(); // Alias of Lyra.present()

Lyra.forbidden(); // Equivalent to Lyra.any().forbidden()
Lyra.absent(); // Alias of Lyra.forbidden()

Lyra.optional(); // Equivalent to Lyra.any().optional()

Lyra.only(); // Equivalent to Lyra.any().only()

Lyra.settings(); // Equivalent to Lyra.any().settings()
Lyra.options(); // Alias of Lyra.settings()

Lyra.strip(); // Equivalent to Lyra.any().strip()

Lyra.switch(); // Equivalent to Lyra.any().switch()

Lyra.when(); // Equivalent to Lyra.any().when()
```

[Back to top](#api)

### `any()`

Generates a schema that matches any data type.

```js
const schema = Lyra.any();
```

[Back to top](#api)

#### `any.type`

Returns the type of the current schema.

```js
const schema = Lyra.number();
schema.type; // number
```

[Back to top](#api)

#### `any.clone()`

Clones the current schema.

```js
const schema = Lyra.any();
const schema2 = schema.clone();

schema === schema2; // false
```

[Back to top](#api)

#### `any.merge(source)`

Merges two schemas and return a schema that is the result of adding the rules together where:

-   `source`: The source schema to merge to the current schema.

```js
const a = Lyra.number().multiple(2);
const b = Lyra.number().multiple(5);
const c = a.merge(b);

c.validate(10); // Pass
c.validate(5); // unknown must be a multiple of 2
c.validate(2); // unknown must be a multiple of 5
```

[Back to top](#api)

#### `any.describe()`

Generates a blueprint for the current schema. Useful for exposing internal configurations to other systems.

```js
const schema = Lyra.object({
    a: Lyra.number().max(10),
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

require('assert').deepEqual(schema.describe(), blueprint);
```

[Back to top](#api)

#### `any.settings(options)`

**Alias:** `any.options()`

Overrides the validation options for the current schema and its children (if apply) where:

-   `options`: Optional options passed to [`any.validate()`](#anyvalidatevalue-options) (without `context`).

```js
const schema = Lyra.number().settings({ strict: false });

schema.validate('1').value; // 1
```

[Back to top](#api)

#### `any.cast(to)`

Casts a validated value to a specified type where:

-   `to`: The type to cast the value to. Set to `false` to perform no casting.

Each schema type supports its own set of destination types:

-   `array` supports casting to `Set`.
-   `boolean` supports casting to `number` (1 if true and 0 if false) and `string` (`true` or `false`).
-   `date` supports casting to `number` (milliseconds since epoch) and `string` (standard JavaScript `Date.toString`).
-   `number` supports casting to `string`.
-   `object` supports casting to `Map`.

```js
const schema = Lyra.object().cast('map');

schema.validate({ a: 1 }).value; // Map(1) { a => 1 }
```

[Back to top](#api)

#### `any.convert([enabled])`

Same as [`any.settings({ strict: false })`](#anysettingsoptions).

Disables strict mode for the current schema and its children (if apply) where:

-   `enabled`: Whether to enable the behavior. Defaults to `true`.

```js
const schema = Lyra.number().convert();

schema.validate('1').value; // 1
```

[Back to top](#api)

#### `any.messages(messages)`

Same as [`any.settings({ messages: {} })`](#anysettingsoptions).

Extends or overrides error messages for the current schema where:

-   `messages`: A hash of error codes and their messages (can be templates or raw strings).

```js
const schema = Lyra.number()
    .min(1)
    .messages({ 'number.base': '{#label} is not good enough' })
    .messages({ 'number.min': '{#label} is not big enough' });

schema.validate('x'); // unknown is not good enough
schema.validate(0); // unknown is not big enough
```

[Back to top](#api)

#### `any.annotate(...notes)`

**Alias:** `any.notes()`, `any.description()`

Annotates the current schema with a set of explanation notes where:

-   `notes`: A list of notes.

```js
const schema = Lyra.number().max(10).annotate('Must be a number', 'Must be greater than 10');
```

[Back to top](#api)

#### `any.rule(method, [description])`

**Alias:** `any.custom()`

Defines a custom validation rule on the current schema where:

-   `method`: A function of signature `function (value, helpers) {}` that validates the incoming value.
-   `description`: Optional description explanation what the rule is doing.

```js
const schema = Lyra.rule((value) => {
    if (value === 'test') {
        return value;
    }

    throw new Error('invalid');
});

schema.validate('test'); // Pass
schema.validate('x'); // unknown fails validation due to invalid!
```

You can also define a custom error message and return it:

```js
const schema = Lyra.any()
    .rule((value, { error }) => {
        if (value === 'special') {
            return value;
        }

        return error('custom.special');
    })
    .messages({
        'custom.special': 'Not special enough!',
    });

schema.validate('x'); // Not special enough!
```

[Back to top](#api)

#### `any.presence(presence)`

Sets the presence mode for a schema where:

-   presence: The mode to set. Can be one of `optional`, `required` or `forbidden`.

Lyra by default allows `undefined` (due to the mode being `optional`). To reject `undefined`, call `any.presence('required')` or `any.required()`. To reject anything but `undefined`, call `any.presence('forbidden')` or `any.forbidden()`.

```js
const schema = Lyra.object({
    a: Lyra.number().required(),
});

schema.validate({}); // a is required
schema.validate({ a: 1 }); // Pass
```

To override the global presence mode:

```js
const schema = Lyra.object({
    a: Lyra.number(),
});

schema.validate({}, { presence: 'required' }); // a is required
```

[Back to top](#api)

#### `any.optional()`

Same as [`any.presence('optional')`](#anypresencepresence)

[Back to top](#api)

#### `any.required()`

**Alias**: `any.exists()`, `any.present()`

Same as [`any.presence('required')`](#anypresencepresence)

[Back to top](#api)

#### `any.forbidden()`

**Alias**: `any.absent()`

Same as [`any.presence('forbidden')`](#anypresencepresence)

[Back to top](#api)

#### `any.default(value, [options])`

Sets a default value to fallback to when the provided value is `undefined` where:

-   `value`: The default value. Can be a reference, a literal, or a function of signature `function (parent, helpers) {}` that generates the default value.
-   `options`: Optional options where:
    -   `literal`: Only applies to function `value`s. Whether to treat them as literals instead of generators. Default to `false`.

Note that no further validation is performed on the default value.

```js
const schema = Lyra.object({
    a: Lyra.number().default(1);
});

schema.validate({}).value; // { a: 1 }
```

With reference:

```js
const schema = Lyra.obj({
    a: 'x',
    b: Lyra.any().default(Lyra.ref('a')),
});

schema.validate({ a: 'x' }).value; // { a: 'x', b: 'x' }
```

To generate the default value of a key based on its peers:

```js
const schema = Lyra.obj({
    x: Lyra.str(),
    y: Lyra.str(),
    z: Lyra.str().default((parent) => {
        return `${parent.x} ${parent.y}`;
    }),
});

schema.validate({
    x: 'Bot Bind',
    y: 'Open source',
}).value.z;  // Bot Bind Open source
```

To default to a function:

```js
const fn = () => { };
const schema = Lyra.any().default(fn, { literal: true });

schema.validate(undefined).value; // fn
```

To generate deep defaults for an object:

```js
const schema = Lyra.obj({
    a: Lyra.any().default('x'),
    b: {
        c: Lyra.any().default('x'),
        d: {
            e: Lyra.any().default('x'),
            f: Lyra.any().default('x'),
        },
    },
}).default();

const default = {
    a: 'x',
    b: {
        c: 'x',
        d: {
            e: 'x',
            f: 'x',
        },
    },
};

require('assert').deepEqual(schema.validate(undefined).value, default); // true
```

[Back to top](#api)

#### `any.label(label)`

Sets the label for the schema to be displayed in error messages where:

-   `label`: The label to set.

```js
const schema = Lyra.number().label('myAwesomeLabel');

schema.validate('x'); // myAwesomeLabel must be a number
```

[Back to top](#api)

#### `any.only([enabled])`

Marks the values registered via [`any.allow()`](anyallowvalues) to be the only accepted values where:

-   `enabled`: Whether to enable this flag. Defaults to `true`.

```js
const schema = Lyra.allow('x').only(); // Equivalent to Lyra.any().valid('x')

schema.validate('x'); // Pass
schema.validate('y'); // unknown must be x
```

Note that the flag will be disabled implicitly when all registered valid values are removed:

```js
const schema = Lyra.any().valid('x').valid(Lyra.override);

// Or

const schema = Lyra.any().valid('x').invalid('x');
```

[Back to top](#api)

#### `any.allow(...values)`

Allows a set of values in addition to the permitted values where:

-   `values`: A list of allowed values.

```js
const schema = Lyra.boolean().allow(1, 0);

schema.validate(true); // Pass
schema.validate(1); // Pass
```

Multiple calls:

```js
const schema = Lyra.boolean().allow(1).allow(0);
```

Note that invoking this rule after [`any.valid()`](#anyvalidvalues) will retain the flag [`only`](#anyonlyenabled) and concatenate the values:

```js
const schema = Lyra.number().valid('x');

schema.validate('x'); // Pass
schema.validate(1); // unknown must be x
schema.allow('y').validate(1); // unknown must be x, y
```

Override previous allowed values:

```js
const schema = Lyra.number().allow('x').allow(Lyra.override, 'y');

schema.validate('y'); // Pass
schema.validate('x'); // unknown must be a number
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.string().allow(Lyra.ref('a')),
});

schema.validate({
    a: 1,
    b: 1,
}); // Pass

schema.validate({
    a: 1,
    b: 'x',
}); // Pass

schema.validate({
    a: 1,
    b: 2,
}); // b must be a string
```

With in reference:

```js
const schema = Lyra.object({
    a: Lyra.array(Lyra.number()),
    b: Lyra.string().allow(Lyra.in('a')),
});

schema.validate({
    a: [1, 2],
    b: 1,
}); // Pass

schema.validate({
    a: [1, 2],
    b: 2,
}); // Pass

schema.validate({
    a: [1, 2],
    b: 3,
}); // b must be a string
```

[Back to top](#api)

#### `any.valid(...values)`

**Alias:** `any.equal()`, `any.is()`

Restricts the input value to only a set of values where:

-   `values`: A list of valid values.

```js
const schema = Lyra.boolean().valid(1, 0);

schema.validate(true); // unknown must be 1, 0
schema.validate(1); // Pass
```

Multiple calls:

```js
const schema = Lyra.valid(1).valid(0);
```

Override previous valid values:

```js
const schema = Lyra.valid('x').valid(Lyra.override, 'y');

schema.validate('y'); // Pass
schema.validate('x'); // unknown must be y
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.valid(Lyra.ref('a')),
});

schema.validate({
    a: 1,
    b: 1,
}); // Pass

schema.validate({
    a: 1,
    b: 'x',
}); // b must be "a"
```

or shorter:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.ref('a'),
});

schema.validate({
    a: 1,
    b: 1,
}); // Pass

schema.validate({
    a: 1,
    b: 'x',
}); // b must be "a"
```

With in reference:

```js
const schema = Lyra.object({
    a: Lyra.array(Lyra.number()),
    b: Lyra.in('a');
});

schema.validate({
    a: [1, 2],
    b: 1
}); // Pass

schema.validate({
    a: [1, 2],
    b: 2
}); // Pass

schema.validate({
    a: [1, 2],
    b: 3
}); // b must be "a"
```

[Back to top](#api)

#### `any.invalid(...values)`

**Alias:** `any.deny()`, `any.disallow()`, `any.not()`

Defines a set of invalid values where:

-   `values`: A list of disallowed values.

```js
const schema = Lyra.number().even().invalid(4);

schema.validate(2); // Pass
schema.validate(4); // unknown must not be 4
```

Multiple calls:

```js
const schema = Lyra.number().even().invalid(2).invalid(4);
```

Override previous invalid values:

```js
const schema = Lyra.number().even().invalid(4).invalid(Lyra.override, 8);

schema.validate(4); // Pass
schema.validate(8); // unknown must not be 8
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.number().invalid(Lyra.ref('a')),
});

schema.validate({
    a: 1,
    b: 2,
}); // Pass

schema.validate({
    a: 1,
    b: 1,
}); // b must not be "a"
```

With in reference:

```js
const schema = Lyra.object({
    a: Lyra.array(Lyra.number()),
    b: Lyra.number().invalid(Lyra.in('a')),
});

schema.validate({
    a: [1, 2],
    b: 3,
}); // Pass

schema.validate({
    a: [1, 2],
    b: 1,
}); // b must not be "a"
```

[Back to top](#api)

#### `any.strip([enabled])`

Signifies a schema to return `undefined` after validation or to be stripped from its parent schema (if apply) where:

-   `enabled`: Whether to enable the behavior. Defaults to `true`.

```js
const schema = Lyra.object({
    a: Lyra.number().strip(),
});

schema.validate({ a: 1 }).value; // {}
```

With arrays:

```js
const schema = Lyra.array(Lyra.string().strip());

schema.validate(['x', 'y']).value; // []
```

[Back to top](#api)

#### `any.raw([enabled])`

Signifies a schema to return the raw unmodified value after validation where:

-   `enabled`: Whether to enable the behavior. Defaults to `true`.

```js
const schema = Lyra.number().raw().convert();

schema.validate('5').value; // '5'
```

[Back to top](#api)

#### `any.switch(subject, ...branches)`

Provides a set of conditions and modifies the current schema accordingly at validation time where:

-   `subject`: Same as the first argument passed to [`any.when()`](#anywhensubject-options)
-   `branches`: An array of options or single options passed via multiple arguments. Same as the ones passed to [`any.when()`](#anywhensubject-options) (with the exception of `otherwise` can only be in the last branch).

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.any().switch('a',
        { is: Lyra.number().multiple(2), then: 'x' },
        { is: Lyra.number().multiple(5), then: 'y', otherwise: 'z' },
    ),
});

schema.validate({
    a: 2,
    b: 'x',
}); // Pass

schema.validate({
    a: 5,
    b: 'y',
}); // Pass

schema.validate({
    a: 10,
    b: 'x',
}); // Pass

schema.validate({
    a: 10,
    b: 'y',
}); // unknown must be x (because the first branch matches first)

schema.validate({
    a: 1,
    b: 'z',
}); // Pass
```

[Back to top](#api)

#### `any.when(subject, options)`

Specifies a condition and modifies the current schema accordingly at validation time where:

-   `subject`: The subject of the condition. Can be a reference or a string.
-   `options`: Options where:
    -   `is`: A literal or a schema that is matched against the resolved subject. Omitting the option is equivalent to `Lyra.any().invalid(null, 0, '', NaN)` (disallowing falsy values).
    -   `not`: The opposite of `is`. If `is` is provided, this key is forbidden and vice versa.
    -   `then`: The schema to apply if the condition matches.
    -   `otherwise`: The schema to apply if the condition fails to match. If `then` is not provided, this key is required and vice versa.
    -   `break`: Whether to stop processing other conditions if either `then` or `otherwise` is matched.

Conditional rules:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.any().when('a', {
        is: Lyra.number().greater(20),
        then: Lyra.number().greater(10),
        otherwise: Lyra.number().less(10)
    });
})
```

Conditional presence:

```js
const schema = Lyra.object({
    a: Lyra.any(),
    b: Lyra.any().when('a', {
        is: Lyra.present(),
        then: Lyra.forbidden(),
        otherwise: Lyra.required(),
    }),
});
```

Multiple conditions with `break`:

```js
const schema = Lyra.object({
    a: Lyra.boolean(),
    b: Lyra.boolean(),
    c: Lyra.any()
        .when('a', {
            is: true,
            then: 1,
            break: true,
        })
        .when('b', {
            is: true,
            then: 2,
        }),
});

schema.validate({
    a: true,
    b: false,
    c: 1,
}); // Pass

schema.validate({
    a: false,
    b: true,
    c: 2,
}); // Pass

schema.validate({
    a: true,
    b: true,
    c: 1,
}); // Pass

schema.validate({
    a: true,
    b: true,
    c: 2,
}); // c must be 1 (because the first condition matches first)
```

Condition on multiple object keys:

```js
const schema = Lyra.object({
    a: Lyra.any(),
    b: Lyra.any(),
    c: Lyra.any(),
}).when('.a', {
    is: Lyra.present(),
    then: {
        b: Lyra.required(),
        c: Lyra.required(),
    },
});
```

Nested conditions:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.any().when('a', {
        is: Lyra.number().max(10),
        then: 1,
        otherwise: Lyra.any().when('a', {
            is: Lyra.number().max(5),
            then: 2,
            otherwise: 3,
        }),
    }),
});
```

[Back to top](#api)

#### `any.validate(value, [options])`

Validates a value against the current schema where:

-   `value`: The value to validate.
-   `options`: Optional options where:
    -   `strict`: Whether strict mode is enabled (coercion is not allowed). Defaults to `true`.
    -   `abortEarly`: Whether to stop the validation on the first error found. Defaults to `true`.
    -   `allowUnknown`: Whether unknown keys are allowed inside object schemas. If set to `false`, all generated errors are collected and returned. Defaults to `false`.
    -   `stripUnknown`: Whether unknown keys are stripped from array and object schemas. Defaults to `false`.
    -   `label`: The mode to use when displaying labels. Can be one of `path` or `key`. If set to `path`, the full path of the value is printed. If set to `key`, only the key is displayed.
    -   `presence`: The default presence. Can be `optional`, `required` or `forbidden`.
    -   `messages`: An optional hash of error codes and their messages (can be templates or raw strings).
    -   `context`: An optional context object used for validation.

Note that options will be overridden by the ones passed via [`any.settings()`](#anysettingsoptions).

```js
const schema = Lyra.number().max(10).multiple(2);

schema.validate(11, { abortEarly: false }); // [ unknown must be less than or equal to 10, unknown must be a multiple of 2 ]
```

#### `any.attempt(value, [options])`

Validates and returns the modified value if validation passes instead of the result object and throws when validation fails where:

-   `value`: The value to validate.
-   `options`: Optional options passed to [`any.validate()`](#anyvalidationvalue-options)

```js
const schema = Lyra.number();

schema.attempt('x'); // Throws 'unknown must be a number'
schema.attempt(1); // 1
```

[Back to top](#api)

### `boolean()`

**Alias:** `bool()`

Generates a schema that matches the boolean type.
Supports the same methods as [`any()`](#any)

```js
const schema = Lyra.boolean();

schema.validate(true); // Pass
schema.validate(1); // unknown must be a boolean
```

[Back to top](#api)

#### `boolean.insensitive([enabled])`

Allows string values provided via [`boolean.truthy()`](#booleantruthyvalues) and [`boolean.falsy()`](#booleanfalsyvalues) to be matched insensitively for coercion where:

-   `enabled`: Whether to enable this behavior. Defaults to `true`.

Note that strict mode has to be disabled for this behavior.

```js
const schema = Lyra.boolean().insensitive().truthy('yes').convert();

schema.validate('YeS').value; // true
```

[Back to top](#api)

#### `boolean.truthy(...values)`

Adds additional values to coerce to `true` where:

-   `values`: The values to coerce.

Note that strict mode has to be disabled for this behavior.

```js
const schema = Lyra.boolean().truthy('yes').convert();

schema.validate('yes').value; // true
```

Multiple calls:

```js
const schema = Lyra.boolean().truthy('yes').truthy('yup').convert();
```

Override previous truthy values:

```js
const schema = Lyra.boolean().truthy('yes').truthy(Lyra.override, 'yup').convert();

schema.validate('yup').value; // true
schema.validate('yes'); // unknown must be a boolean
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.boolean().truthy(Lyra.ref('a')).convert(),
});

schema.validate({
    a: 'yes',
    b: 'yes',
}).value; // { a: yes, b: true }
```

With in reference:

```js
const schema = Lyra.object({
    a: Lyra.array(Lyra.string()),
    b: Lyra.boolean().truthy(Lyra.in('a')).convert(),
});

schema.validate({
    a: ['yes', 'yup'],
    b: 'yes',
}).value; // { a: [ yes, yup ], b: true }

schema.validate({
    a: ['yes', 'yup'],
    b: 'yup',
}).value; // { a: [ yes, yup ], b: true }
```

Remove an existing truthy values by [`boolean.falsy()`](#booleanfalsyvalues):

```js
const schema = Lyra.boolean().truthy('hmmTrueOrFalse').falsy('hmmTruOrFalse').convert();

schema.validate('hmmTrueOrFalse').value; // false
```

[Back to top](#api)

#### `boolean.falsy(...values)`

Adds additional values to coerce to `false` where:

-   `values`: The values to coerce.

Note that strict mode has to be disabled for this behavior.

```js
const schema = Lyra.boolean().falsy('no').convert();

schema.validate('no').value; // false
```

Multiple calls:

```js
const schema = Lyra.boolean().falsy('no').falsy('nope').convert();
```

Override previous falsy values:

```js
const schema = Lyra.boolean().falsy('no').falsy(Lyra.override, 'nope').convert();

schema.validate('nope').value; // false
schema.validate('no'); // unknown must be a boolean
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.boolean().falsy(Lyra.ref('a')).convert(),
});

schema.validate({
    a: 'no',
    b: 'no',
}).value; // { a: yes, b: false }
```

With in reference:

```js
const schema = Lyra.object({
    a: Lyra.array(Lyra.string()),
    b: Lyra.boolean().falsy(Lyra.in('a')).convert(),
});

schema.validate({
    a: ['no', 'nope'],
    b: 'no',
}).value; // { a: [ no, nope ], b: false }

schema.validate({
    a: ['no', 'nope'],
    b: 'no',
}).value; // { a: [ no, nope ], b: false }
```

Remove an existing truthy values by [`boolean.truthy()`](#booleantruthyvalues):

```js
const schema = Lyra.boolean().falsy('hmmTrueOrFalse').truthy('hmmTruOrFalse').convert();

schema.validate('hmmTrueOrFalse').value; // true
```

[Back to top](#api)

### `string()`

**Alias:** `str()`

Generates a schema that matches the string type. Empty strings (`''`) are ignored by default. Supports the same methods as [`any()`](#any)

```js
const schema = Lyra.string();

schema.validate('x'); // Pass
schema.validate(''); // unknown must not be an empty string
schema.validate(1); // unknown must be a string
```

[Back to top](#api)

#### `string.length(limit)`

Specifies the exact number of characters the input string must have where:

-   `limit`: The number of characters required.

```js
const schema = Lyra.string().length(3);

schema.validate('xyz'); // Pass
schema.validate('xy'); // unknown must have 3 characters
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.string().length(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: 'xy',
}); // Pass

schema.validate({
    a: 2,
    b: 'x',
}); // b must have "a" characters
```

[Back to top](#api)

##### `string.min(limit)`

Specifies the minimum number of characters the input string must have where:

-   `limit`: The minimum number of characters required.

```js
const schema = Lyra.string().min(3);

schema.validate('xyz'); // Pass
schema.validate('xyzt'); // Pass
schema.validate('xy'); // unknown must have at least 3 characters
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.string().min(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: 'xy',
}); // Pass

schema.validate({
    a: 2,
    b: 'x',
}); // b must have at least "a" characters
```

[Back to top](#api)

#### `string.max(limit)`

Specifies the maximum number of characters the input string can have where:

-   `limit`: The maximum number of characters required.

```js
const schema = Lyra.string().max(3);

schema.validate('xyz'); // Pass
schema.validate('xy'); // Pass
schema.validate('xyzt'); // unknown must have at most 3  characters
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.string().max(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: 'xy',
}); // Pass

schema.validate({
    a: 2,
    b: 'xyz',
}); // b must have at most "a" characters
```

[Back to top](#api)

#### `string.insensitive([enabled])`

Allows string values provided via [`any.allow()`](#anyallowvalues), [`any.valid()`](#anyvalidvalues) or [`any.invalid()`](#anyinvalidvalues) to be matched insensitvely where:

-   `enabled`: Whether to enable this behavior. Defaults to `true`.

```js
const schema = Lyra.string().valid('someValidString').insensitive();

schema.validate('someValidString'); // Pass
schema.validate('sOmEvAlIdStRiNg'); // Pass
```

[Back to top](#api)

#### `string.dataUri([options])`

Requires the input string to be a valid data uri where:

-   `options`: Optional base64 options passed to [`string.base64()`](#stringbase64options)

```js
const schema = Lyra.string().dataUri();

schema.validate('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='); // Pass
schema.validate('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='); // unknown must be a data uri
```

Without padding:

```js
const schema = Lyra.string().dataUri({ paddingRequired: false });

schema.validate('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw'); // Pass
```

[Back to top](#api)

#### `string.base64([options])`

Requires the input string to be a valid base64 string where:

-   `options`: Optional options where:
    -   `paddingRequired`: Requires the base64 portion of the string to have padding. Defaults to `true`.
    -   `urlSafe`: Requires the bas64 portion of the string to be URL safe. Defaults to `true`.

```js
const schema = Lyra.string().base64();

schema.validate('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='); // Pass

schema.validate('someRandomString'); // unknown must be a base64 string
```

Without padding:

```js
const schema = Lyra.string().base64({ paddingRequired: false });

schema.validate('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw'); // Pass
```

Non URL safe:

```js
const schema = Lyra.string().base64({ urlSafe: false });

schema.validate('R0lGODlhAQABAAAAACH5BAEKAA+/LAAAAAABAAEAAAICTAEAOw=='); // Pass

schema.validate('R0lGODlhAQABAAAAACH5BAEKAA-_LAAAAAABAAEAAAICTAEAOw=='); // unknown must be a base64 string
```

[Back to top](#api)

#### `string.creditCard()`

Requires the input string to be a credit card number.

```js
const schema = Lyra.string().creditCard();

schema.validate('378282246310005'); // Pass
schema.validate('111111111111112'); // unknown must be a credit card number
```

[Back to top](#api)

#### `string.pattern(regex, [name])`

**Alias:** `string.regex()`

Specifies a regular expression the input string must match where:

-   `regex`: The regular expression to match. Must not have global or sticky flags.
-   `name`: Optional name for the pattern. Defaults to `unknown`.

```js
const schema = Lyra.string().regex(/^abc/, 'myPattern');

schema.validate('abc'); // Pass
schema.validate('xabc'); // unknown must have pattern myPattern
```

[Back to top](#api)

#### `string.email()`

Requires the input string to be an email.

```js
const schema = Lyra.string().email();

schema.validate('someone@example.com'); // Pass
schema.validate('someRandomString'); // unknown must be an email
```

[Back to top](#api)

#### `string.url()`

Requires the input string to be a valid URL.

```js
const schema = Lyra.string().url();

schema.validate('https://botbind.com'); // Pass
schema.validate('https://'); // unknown must be an email
```

[Back to top](#api)

#### `string.alphanum()`

Requires the input string to contain only alphanumeric characters.

```js
const schema = Lyra.string().alphanum();

schema.validate('Abc123'); // Pass
schema.validate('Abc 123'); // unknown must only contain alphanumeric characters
```

[Back to top](#api)

#### `string.numeric()`

Requires the input string to contain only numeric characters.

```js
const schema = Lyra.string().numeric();

schema.validate('123456789'); // Pass
schema.validate('12345b789'); // unknown must only contain numeric characters
```

[Back to top](#api)

#### `string.case(dir)`

Validates or sets the input string case where:

-   `dir`: The casing direction. Can be `lower` or `upper`.

```js
const schema = Lyra.string().case('upper');

schema.validate('abc'); // unknown must only contain uppercase characters.
```

With strict mode disabled:

```js
const schema = Lyra.string().case('upper').convert();

schema.validate('abc').value; // ABC
```

[Back to top](#api)

#### `string.uppercase()`

Same as [`string.case('upper')`](#stringcasedir)

[Back to top](#api)

#### `string.lowercase()`

Same as [`string.case('lower')`](#stringcasedir)

[Back to top](#api)

#### `string.trim([enabled])`

Trims the input string or validates the presence of leading and trailing whitespaces where:

-   `enabled`: Whether to enable this behavior. Defaults to `true`.

```js
const schema = Lyra.string().trim();

schema.validate('xy'); // Pass
schema.validate(' xy '); // unknown must not contain leading and trailing whitespaces
```

With strict mode disabled:

```js
const schema = Lyra.string().trim();

schema.validate('xy'); // Pass
schema.validate(' xy ').value; // xy
```

[Back to top](#api)

#### `string.replace(pattern, replacement)`

Replaces some or all characters where:

-   `pattern`: The pattern to match. Can be a string or a regular expression.
-   `replacement`: The string to replace matching characters.

Note that strict mode has to be disabled for this behavior.

```js
const schema = Lyra.string().replace(/^abc/, 'xyz').convert();

schema.validate('abcxyz').value; // xyzxyz
```

[Back to top](#api)

### `number()`

**Alias:** `num()`

Generates a schema that matches the number type. Rejects `Infinity`, `-Infinity` and other unsafe numbers by default. Supports the same methods as [`any()`](#any)

```js
const schema = Lyra.number();

schema.validate(1); // Pass
schema.validate(Infinity); // unknown must not be infinity
schema.validate(-Infinity); // unknown must not be infinity
schema.validate(Number.MAX_SAFE_INTEGER + 1); // unknown must be a safe number
schema.validate('x'); // unknown must be a number
```

To allow `Infinity` and `-Infinity`:

```js
const schema = Lyra.number().allow(Infinity, -Infinity);

schema.validate(Infinity); // Pass
```

[Back to top](#api)

#### `number.unsafe([enabled])`

Allows unsafe numbers where:

-   `enabled`: Whether to enable this behavior. Defaults to `true`.

Use it at your own risk.

```js
const schema = Lyra.number().unsafe();

schema.validate(Number.MAX_SAFE_INTEGER + 1); // Pass
```

[Back to top](#api)

#### `number.integer()`

Requires the input number to be an integer.

```js
const schema = Lyra.number().integer();

schema.validate(1); // Pass
schema.validate(1.2); // unknown must be an integer
```

[Back to top](#api)

#### `number.min(limit)`

Specifies the minimum value where:

-   `limit`: The minimum value.

```js
const schema = Lyra.number().min(2);

schema.validate(2); // Pass
schema.validate(1); // unknown must be greater than or equal to 2
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.number().min(Lyra.ref('a')),
});

schema.validate({
    a: 1,
    b: 2,
}); // Pass

schema.validate({
    a: 2,
    b: 1,
}); // b must be greater than or equal to "a"
```

[Back to top](#api)

#### `number.max(limit)`

Specifies the maximum value where:

-   `limit`: The maximum value.

```js
const schema = Lyra.number().max(2);

schema.validate(2); // Pass
schema.validate(3); // unknown must be less than or equal to 2
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.number().max(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: 1,
}); // Pass

schema.validate({
    a: 2,
    b: 3,
}); // b must be less than or equal to "a"
```

[Back to top](#api)

#### `number.greater(limit)`

Requires the input number to be greater than a provided value where:

-   `limit`: The value to check.

```js
const schema = Lyra.number().greater(2);

schema.validate(3); // Pass
schema.validate(1); // unknown must be greater than 2
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.number().greater(Lyra.ref('a')),
});

schema.validate({
    a: 1,
    b: 2,
}); // Pass

schema.validate({
    a: 2,
    b: 1,
}); // b must be greater than "a"
```

#### `number.less(limit)`

Requires the input number to be less than a provided value where:

-   `limit`: The value to check.

```js
const schema = Lyra.number().less(2);

schema.validate(1); // Pass
schema.validate(3); // unknown must be less than 2
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.number().less(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: 1,
}); // Pass

schema.validate({
    a: 1,
    b: 2,
}); // b must be less than "a"
```

#### `number.multiple(factor)`

Requires the input number to be a multiple of a provided value where:

-   `factor`: The value to check.

```js
const schema = Lyra.number().multiple(2);

schema.validate(2); // Pass
schema.validate(3); // unknown must be a multiple of 2
```

Multiple factors:

```js
const schema = Lyra.number().multiple(2).multiple(3);

schema.validate(6); // Pass
schema.validate(2); // unknown must be a multiple of 3
schema.validate(3); // unknown must be a multiple of 2
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.number().multiple(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: 4,
}); // Pass

schema.validate({
    a: 2,
    b: 3,
}); // b must be a multiple of "a"
```

[Back to top](#api)

#### `number.even()`

Same as [`number.multiple(2)`](#numbermultiplefactor)

[Back to top](#api)

#### `number.divide(dividend)`

Requires the input number to divde another where:

-   `dividend`: The value to check.

```js
const schema = Lyra.number().divide(4);

schema.validate(2); // Pass
schema.validate(3); // unknown must divide 4
```

Multiple dividends:

```js
const schema = Lyra.number().divide(16).divide(24);

schema.validate(4); // Pass
schema.validate(16); // unknown must divide 24
schema.validate(3); // unknown must divide 16
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.number().divide(Lyra.ref('a')),
});

schema.validate({
    a: 4,
    b: 2,
}); // Pass

schema.validate({
    a: 4,
    b: 3,
}); // b must divide "a"
```

[Back to top](#api)

### `date()`

Generates a schema that matches Javascript `Date`. Supports the same methods as [`any()`](#any).

```js
const schema = Lyra.date();

schema.validate(new Date('01/01/2020')); // Pass
schema.validate('01/01/2020'); // unknown must be a valid date
```

To enable parsing date strings:

```js
const schema = Lyra.date().convert();

schema.validate('01/01/2020'); // Pass
```

[Back to top](#api)

#### `date.min(limit)`

Specifies the minimum date where:

-   `limit`: The minimum date. Can be a JavaScript `Date` object, a date string or `now`.

```js
const schema = Lyra.date().min('01/01/2020').convert();

schema.validate('01/02/2020'); // Pass
schema.validate('12/31/2019'); // unknown must be greater than or equal to Wed Jan 01 2020 00:00:00 GMT+0000 (Greenwich Mean Time)
```

To compare to the current timestamp:

```js
const schema = Lyra.date().min('now').convert();

schema.validate('someTimeInThePast'); // unknown must be greater than or equal to now
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.date().min(Lyra.ref('a')).convert(),
});

schema.validate({
    a: '01/01/2020',
    b: '01/02/2020',
}); // Pass

schema.validate({
    a: '01/02/2020',
    b: '01/01/2020',
}); // b must be greater than or equal to "a"
```

[Back to top](#api)

#### `date.max(limit)`

Specifies the maximum date where:

-   `limit`: The maximum date. Can be a JavaScript `Date` object, a date string or `now`.

```js
const schema = Lyra.date().max('01/01/2020').convert();

schema.validate('12/31/2019'); // Pass
schema.validate('01/02/2020'); // unknown must be less than or equal to Wed Jan 01 2020 00:00:00 GMT+0000 (Greenwich Mean Time)
```

To compare to the current timestamp:

```js
const schema = Lyra.date().max('now').convert();

schema.validate('someTimeInTheFuture'); // unknown must be less than or equal to now
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.date().max(Lyra.ref('a')).convert(),
});

schema.validate({
    a: '01/01/2020',
    b: '12/31/2019',
}); // Pass

schema.validate({
    a: '01/01/2020',
    b: '01/02/2020',
}); // b must be less than or equal to "a"
```

[Back to top](#api)

#### `date.greater(limit)`

Requires the input date to be greater than a specified value where:

-   `limit`: The date to compare to. Can be a JavaScript `Date` object, a date string or `now`.

```js
const schema = Lyra.date().greater('01/01/2020').convert();

schema.validate('01/02/2020'); // Pass
schema.validate('12/31/2019'); // unknown must be greater than Wed Jan 01 2020 00:00:00 GMT+0000 (Greenwich Mean Time)
```

To compare to the current timestamp:

```js
const schema = Lyra.date().greater('now').convert();

schema.validate('someTimeInThePast'); // unknown must be greater than now
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.date().greater(Lyra.ref('a')).convert(),
});

schema.validate({
    a: '01/01/2020',
    b: '01/02/2020',
}); // Pass

schema.validate({
    a: '01/01/2020',
    b: '12/31/2019',
}); // b must be greater than "a"
```

[Back to top](#api)

#### `date.less(limit)`

Requires the input date to be less than a specified value where:

-   `limit`: The date to compare to. Can be a JavaScript `Date` object, a date string or `now`.

```js
const schema = Lyra.date().less('01/01/2020').convert();

schema.validate('12/31/2019'); // Pass
schema.validate('01/02/2020'); // unknown must be less than Wed Jan 01 2020 00:00:00 GMT+0000 (Greenwich Mean Time)
```

To compare to the current timestamp:

```js
const schema = Lyra.date().less('now').convert();

schema.validate('someTimeInThePast'); // unknown must be less than now
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.date().less(Lyra.ref('a')).convert(),
});

schema.validate({
    a: '01/01/2020',
    b: '12/31/2019',
}); // Pass

schema.validate({
    a: '01/01/2020',
    b: '01/02/2020',
}); // b must be less than "a"
```

[Back to top](#api)

#### `function()`

**Alias:** `fn()`

Generates a schema that matches the function type. Supports the same methods as [`any()`](#any).

```js
const schema = Lyra.function();

schema.validate(() => {}); // Pass
schema.validate('x'); // unknown must be a function
```

[Back to top](#api)

#### `function.inherit(ctor)`

Requires the input function to inherit a provided constructor where:

-   `ctor`: The constructor to inherit.

```js
class X {}
class Y extends X {}

const schema = Lyra.function().inherit(X);

schema.validate(Y); // Pass
schema.validate(() => {}); // unknown must inherit X
```

[Back to top](#api)

### `array()`

**Alias:** `arr()`

Generates a schema that matches the array type. Supports the same methods as [`any()`](#any)

```js
const schema = Lyra.array();

schema.validate([]); // Pass
schema.validate({}); // unknown must be an array
```

[Back to top](#api)

#### `array.items(...items)`

**Alias:** `array.of()`

Specifies the allowed types that the input items must match where:

-   `items`: A list of schemas describing the constraints.

Note that if the schema is `.required()`, there must be at least a matching item in the array. If the schema is `.forbidden()`, there must not be a matching item in the array. Required items can be added multiple items to signify that multiple matching items must be found.

To allow only strings:

```js
const schema = Lyra.array().items(Lyra.string());

schema.validate(['x']); // Pass
schema.validate([]); // Pass
schema.validate([1]); // 0 must be a string
```

Or shorter:

```js
const schema = Lyra.array(Lyra.string());

schema.validate(['x']); // Pass
schema.validate([]); // Pass
schema.validate([1]); // 0 must be a string
```

To allow multiple item types:

```js
const schema = Lyra.array().items(Lyra.string(), Lyra.number());

schema.validate(['x']); // Pass
schema.validate([1]); // Pass
schema.validate(['x', 1]); // Pass
schema.validate([true]); // 0 is not allowed
```

To require at least a string and a number:

```js
const schema = Lyra.array().items(Lyra.string().required().label('Some label'), Lyra.number().required());

schema.validate(['x', 1]); // Pass
schema.validate(['x', 1, 1]); // Pass
schema.validate(['x', 'x', 1]); // Pass
schema.validate(['x']); // unknown does not have 1 required value(s)
schema.validate([1]); // unknown does not have Some label
schema.validate([]); // unknown does not have Some label and 1 other required value(s)
```

Note that the first matching schema is processed:

```js
const schema = Lyra.array().items(Lyra.number().convert(), Lyra.string());

schema.validate(['1']).value; // [1] (number.convert() is matched first)
```

To require multiple matching items:

```js
const item = Lyra.string().min(2).required();
const schema = Lyra.array().items(item, item, Lyra.number());

schema.validate(['xy', 'xx']); // Pass
schema.validate(['xx', 'xy', 1]); // Pass
schema.validate(['xx', 1]); // unknown does not have 1 required value(s)
schema.validate([1]); // unknown does not have 2 required value(s)
```

To allow only strings, but none with 4 characters and at least one with 3 characters:

```js
const schema = Lyra.array().items(
    Lyra.string(),
    Lyra.string().length(4).forbidden()
    Lyra.string().length(3).required().label('Some label')
);

schema.validate(['xyz', 'x']); // Pass
schema.validate(['xyz']); // Pass
schema.validate([]); // unknown does not have Some label
schema.validate(['xyz', 'xyzt']); // 1 is forbidden
```

Nested objects:

```js
const schema = Lyra.array().items({ a: Lyra.string() });

schema.validate([{ a: 'x' }]); // Pass
schema.validate([{ a: 1 }]); // 0.a must be a string
```

[Back to top](#api)

#### `array.ordered(...items)`

Same as [`array.items()`](#arrayitemsitems) but requires the items to be in order where:

-   `items`: A list of schemas in order.

To require a number followed by a string:

```js
const schema = Lyra.array().ordered(Lyra.number(), Lyra.string());

schema.validate([1, 'x']); // Pass
schema.validate([1]); // Pass
schema.validate([]); // Pass
schema.validate(['x']); // 0 must be a number
schema.validate([1, 'x', 2]); // unknown must have at most 2 item(s)
```

To require a number followed by a required string:

```js
const schema = Lyra.array().ordered(Lyra.number(), Lyra.string().required());

schema.validate([1]); // unknown does not have 1 required value(s)
```

To require a number followed by a string and subsequent items to be objects of defined shape:

```js
const schema = Lyra.array().ordered(Lyra.number(), Lyra.string()).items({ a: Lyra.string() });

schema.validate([1, 'x']); // Pass
schema.validate([1]); // Pass
schema.validate([1, 'x', { a: 'x' }]); // Pass
schema.validate([1, 'x', 'x']); // 2 is not allowed
```

[Back to top](#api)

#### `array.single([enabled])`

Allows single values to be validated against the provided constraints as if it was provided as an array where:

-   `enabled`: Whether to enable this behavior. Defaults to `true`.

Note that the provided value will be returned as an array regardless of the `strict` option.

```js
const schema = Lyra.array().items(Lyra.string()).single();

schema.validate('x').value; // [ x ]
schema.validate(1); // 0 must be a string
```

Lyra will throw an error if it detects array items:

```js
Lyra.array().items(Lyra.array()).single(); // Throws

Lyra.array().items(Lyra.alternatives(Lyra.array(), Lyra.string())).single(); // Throws
```

[Back to top](#api)

#### `array.sparse([enabled])`

Allows sparse array items where:

-   `enabled`: Whether to enable this behavior. Defaults to `true`.

```js
const schema = Lyra.array().sparse();

schema.validate([undefined]); // Pass
schema.validate([1, undefined, 3]); // Pass
```

[Back to top](#api)

#### `array.length(limit)`

Requires the input array to have a specific length where:

-   `limit`: The length required.

```js
const schema = Lyra.array().length(2);

schema.validate([1, 2]); // Pass
schema.validate([]); // unknown must have 2 item(s)
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.array().length(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: [1, 2],
}); // Pass

schema.validate({
    a: 1,
    b: [1, 2],
}); // b must have "a" item(s)
```

[Back to top](#api)

#### `array.max(limit)`

Specifies the maximum length the input array can have where:

-   `limit`: The maximum length required.

```js
const schema = Lyra.array().max(2);

schema.validate([1, 2]); // Pass
schema.validate([1, 2, 3]); // unknown must have at most 2 item(s)
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.array().max(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: [1, 2],
}); // Pass

schema.validate({
    a: 2,
    b: [1, 2, 3],
}); // b must have at most "a" item(s)
```

[Back to top](#api)

#### `array.min(limit)`

Specifies the minimum length the input array must have where:

-   `limit`: The minimum length required.

```js
const schema = Lyra.array().min(2);

schema.validate([1, 2]); // Pass
schema.validate([]); // unknown must have at least 2 item(s)
```

With reference:

```js
const schema = Lyra.object({
    a: Lyra.number(),
    b: Lyra.array().min(Lyra.ref('a')),
});

schema.validate({
    a: 2,
    b: [1, 2],
}); // Pass

schema.validate({
    a: 2,
    b: [],
}); // b must have at least "a" item(s)
```

[Back to top](#api)

#### `array.unique([comparator])`

Requires the input array to have unique items where:

-   `comparator`: Optional comparator that determines whether two items are the same. Can be a function of signature `function (first, second) {}` or a path if the item is nested.

```js
const schema = Lyra.array().unique();

schema.validate([1, 2]); // Pass
schema.validate([1, 2, 1]); // unknown must not have duplicate items at 0 and 2
schema.validate([{ a: 1 }, { a: 1 }]); // unknown must not have duplicate items at 0 and 1
```

To compare nested keys:

```js
const schema = Lyra.array().items({ id: Lyra.string() }).unique('id');

schema.validate([{ id: 'x' }, { id: 'y' }]); // Pass
schema.validate([{ id: 'x' }, { id: 'x' }]); // unknown must not have duplicate items at 0 and 1
```

To compare using a function:

```js
const schema = Lyra.array()
    .items({ id: Lyra.string() })
    .unique((first, second) => first.id === second.id);

schema.validate([{ id: 'x' }, { id: 'y' }]); // Pass
schema.validate([{ id: 'x' }, { id: 'x' }]); // unknown must not have duplicate items at 0 and 1
```

[Back to top](#api)

### `object()`

**Alias:** `obj()`

Generates a schema that matches the object type. Rejects arrays. Supports the same methods as [`any()`](#any)

```js
const schema = Lyra.object();

schema.validate({}); // Pass
schema.validate({ someRandomKey: 1 }); // Pass
schema.validate(new Date()); // Pass
schema.validate([]); // unknown must be an object
```

[Back to top](#api)

#### `object.unknown([enabled])`

Allows unknown keys only on the current schema not its children where:

-   `enabled`: Whether to enable this behavior. Defaults to `true`.

To allow unknown keys deeply, use the [`allowUnknown` option](#anyvalidatevalue-options)

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: {
        c: Lyra.string(),
    },
}).unknown();

schema.validate({
    a: 'x',
    b: {
        c: 'x',
    },
    d: 'x',
}); // Pass

schema.validate({
    a: 'x',
    b: {
        c: 'x',
        e: 'x',
    },
    d: 'x',
}); // b.e is not allowed
```

[Back to top](#api)

#### `object.extract(path)`

**Alias:** `object.get()`, `object.reach()`

Extracts a child schema given its path where:

-   `path`: The path to the schema. Can be a string of dot-separated keys or an array of individual keys.

```js
const schema = Lyra.object({
    a: {
        b: Lyra.string(),
    },
});

schema.extract('a.b'); // return Lyra.string()
schema.extract('a.b.c'); // undefined
schema.extract('b'); // undefined
```

[Back to top](#api)

#### `object.keys([keys])`

**Alias:** `object.entries()`, `object.of()`, `object.shape()`

Specifies the shape of the object where:

-   `keys`: An optional hash of key names and their schemas.

If no keys is provided, the schema will allow any keys. If an empty hash is passed without any additional rules, the schema will allow no keys.

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.number().required(),
});

schema.validate({
    b: 1,
}); // Pass

schema.validate({
    a: 'x',
    b: 1,
}); // Pass

schema.validate({}); // b is required

schema.validate({
    a: 1,
    b: 1,
}); // a must be a string

schema.validate({
    a: 'x',
    b: 1,
    c: 'y',
}); // c is not allowed (c is unknown)
```

To override and extend defined keys:

```js
const schema = Lyra.object({
    a: Lyra.string(),
});

const myNewSchema = schema.keys({
    a: Lyra.number(),
    b: Lyra.string(),
});

myNewSchema.validate({
    a: 1,
    b: 'x',
}); // Pass
```

To allow no keys:

```js
const schema = Lyra.object({});

schema.validate({}); // Pass
schema.validate({ a: 1 }); // a is not allowed
```

[Back to top](#api)

#### `object.pattern(key, [value])`

Specifies patterns for unknown keys where:

-   `key`: The schema tested against the key names. Can be a literal or a schema.
-   `value`: Optional schema tested against the key values. Can be a literal or a schema.

```js
const schema = Lyra.object().pattern(/abc/, Lyra.string());

schema.validate({
    abc: 'x',
    defabc: 'y',
}); // Pass

schema.validate({
    abc: 1,
}); // abc must be a string

schema.validate({
    a: 'x',
}); // a is not allowed
```

[Back to top](#api)

#### `object.length(limit)`

Specifies an exact number of entries the input object must have where:

-   `limit`: The required number of entries.

```js
const schema = Lyra.object().length(2);

schema.validate({ a: 1, b: 1 }); // Pass
schema.validate({ a: 1 }); // unknown must have 2 entries
```

[Back to top](#api)

#### `object.max(limit)`

Specifies a maximum number of entries the input object can have where:

-   `limit`: The maximum number of entries.

```js
const schema = Lyra.object().max(2);

schema.validate({ a: 1, b: 1 }); // Pass
schema.validate({ a: 1, b: 2, c: 3 }); // unknown must have at most 2 entries
```

[Back to top](#api)

#### `object.min(limit)`

Specifies a minimum number of entries the input object must have where:

-   `limit`: The minimum number of entries.

```js
const schema = Lyra.object().min(2);

schema.validate({ a: 1, b: 1 }); // Pass
schema.validate({ a: 1 }); // unknown must have at least 2 entries
```

[Back to top](#api)

#### `object.instance(ctor)`

Requires the input object to be an instance of a provided constructor where:

-   `ctor`: The constructor to check.

```js
const schema = Lyra.object().instance(Date);

schema.validate(new Date()); // Pass
schema.validate({}); // unknown must be an instance of Date
```

[Back to top](#api)

#### `object.regex()`

Same as [`object.instance(RegExp)`](#objectinstancector)

[Back to top](#api)

#### `object.schema([type], [options])`

Requires the input object to be a valid Lyra's schema where:

-   `type`: The type of the schema to match. Defaults to `any`.
-   `options`: Optional options where:
    -   `allowBase`: Whether to check if the schema is extended from the given type.

```js
const schema = Lyra.object().schema();

schema.validate(Lyra.any()); // Pass
schema.validate({}); // unknown must be a valid schema of type any
```

To match a specific type:

```js
const schema = Lyra.object().schema('array');

schema.validate(Lyra.array()); // Pass
schema.validate(Lyra.any()); // unknown must be a valid schema of type array
```

To check the schema's base:

```js
const custom = Lyra.extend({
    type: 'myCustomType',
    from: Lyra.array(),
});

const schema = custom.object().schema('array', { allowBase: true });

schema.validate(custom.myCustomType()); // Pass
```

[Back to top](#api)

#### `object.ref()`

Requires an object to be a valid reference.

```js
const schema = Lyra.object().ref();

schema.validate(Lyra.ref('a')); // Pass
schema.validate({}); // unknown must be a valid reference
```

[Back to top](#api)

#### `object.template()`

Requires an object to be a valid template.

```js
const schema = Lyra.object().template();

schema.validate(Lyra.template('This is {a}')); // Pass
schema.validate({}); // unknown must be a valid template
```

[Back to top](#api)

#### `object.and(...peers)`

Establishes a dependency between the provided peers in which all the peers must be present where:

-   `peers`: The paths to the peers.

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.string(),
}).and('a', 'b');

schema.validate({}); // Pass
schema.validate({ a: 'x', b: 'y' }); // Pass
schema.validate({ a: 'x' }); // unknown must contain a with b
schema.validate({ b: 'y' }); // unknown must contain b with a
```

[Back to top](#api)

#### `object.or(...peers)`

Establishes a dependency between the provided peers in which at least one of the peers must be present where:

-   `peers`: The paths to the peers.

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.string(),
}).or('a', 'b');

schema.validate({ a: 'x' }); // Pass
schema.validate({ b: 'y' }); // Pass
schema.validate({ a: 'x', b: 'y' }); // Pass
schema.validate({}); // unknown must contain at least one of a, b
```

[Back to top](#api)

#### `object.xor(...peers)`

Establishes a dependency between the provided peers in which exactly one of the peers must be present where:

-   `peers`: The paths to the peers.

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.string(),
}).xor('a', 'b');

schema.validate({ a: 'x' }); // Pass
schema.validate({ b: 'y' }); // Pass
schema.validate({ a: 'x', b: 'y' }); // unknown must contain exactly one of a, b
schema.validate({}); // unknown must contain exactly one of a, b
```

[Back to top](#api)

#### `object.oxor(...peers)`

Establishes a dependency between the provided peers in which none or one of the peers must be present where:

-   `peers`: The paths to the peers.

```js
const schema = Lyra.object({
    a: Lyra.string(),
    b: Lyra.string(),
}).oxor('a', 'b');

schema.validate({ a: 'x' }); // Pass
schema.validate({ b: 'y' }); // Pass
schema.validate({}); // Pass
schema.validate({ a: 'x', b: 'y' }); // unknown must contain exactly one of a, b
```

[Back to top](#api)

### `alternatives()`

**Alias:** `alt()`

Generates a schema that matches multiple data types. Attempts to match any of the provided schemas by default. Supports the same methods as [`any()`](#any).

```js
const schema = Lyra.alternatives(Lyra.string(), Lyra.number());

schema.validate('x'); // Pass
schema.validate(1); // Pass
schema.validate({}); // unknown must match at least one of the provided schema
```

[Back to top](#api)

#### `alternatives.try(...items)`

Adds schemas to match where:

-   `items`: The schemas to match.

```js
const schema = Lyra.alternatives().try(Lyra.string(), Lyra.number());

schema.validate('x'); // Pass
schema.validate(1); // Pass
schema.validate({}); // unknown must match at least one of the provided schema
```

Or shorter:

```js
const schema = Lyra.alternatives(Lyra.string(), Lyra.number());

schema.validate('x'); // Pass
schema.validate(1); // Pass
```

[Back to top](#api)

#### `alternatives.mode(mode)`

**Alias:** `alternatives.match()`

Specifies the mode for [`alternatives.try()`](#alternativestryitems) where:

-   `mode`: The mode to match. Can be `one`, `any` or `all`.

To match exactly one schema:

```js
const schema = Lyra.alternatives().try(Lyra.number().multiple(2), Lyra.number().multiple(5)).match('one');

schema.validate(2); // Pass
schema.validate(5); // Pass
schema.validate('x'); // unknown does not match at least one of the provided schemas
schema.validate(10); // unknown must not match more than one of the provided schemas
```

To match all schemas:

```js
const schema = Lyra.alternatives().try(Lyra.number().convert(), Lyra.string()).match('all');

schema.validate('2'); // Pass
schema.validate(2); // unknown must match all of the provided schemas
schema.validate('x'); // unknown must match all of the provided schemas
schema.validate({}); // unknown must match at least one of the provided schemas
```

[Back to top](#api)
