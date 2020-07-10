'use strict';

const Lyra = require('.');

const internals = {
    nameRx: /^[\w-]+$/,
};

exports.extensions = Lyra.arr(Lyra.obj(), Lyra.fn()).min(1);

exports.extension = Lyra.obj({
    type: Lyra.alt(
        Lyra.arr(Lyra.str()).single(),
        Lyra.obj().regex(),
    )
        .required(),

    alias: Lyra.arr(Lyra.str()).single(),

    from: Lyra.obj().schema(),

    flags: Lyra.obj().pattern(internals.nameRx, Lyra.required()),

    messages: Lyra.obj().pattern(
        Lyra.str(),
        Lyra.alt(
            Lyra.str(),
            Lyra.obj().template(),
        ),
    ),

    terms: Lyra.obj().pattern(internals.nameRx, {
        default: Lyra.alt(
            Lyra.arr(),
            Lyra.obj().values(),
            null,
        )
            .required(),

        merge: Lyra.fn(),

        blueprint: Lyra.obj({
            mapped: Lyra.obj({
                from: Lyra.str().required(),
                to: Lyra.str().required(),
            })
                .required(),
        }),

        register: Lyra.num(),
    }),

    args: Lyra.fn(),

    construct: Lyra.fn(),

    rebuild: Lyra.fn(),

    coerce: Lyra.fn(),

    validate: Lyra.fn(),

    rules: Lyra.obj().pattern(
        internals.nameRx,
        Lyra.obj({
            method: Lyra.fn().allow(false),

            alias: Lyra.arr(Lyra.str())
                .single()
                .when('method', {
                    is: Lyra.absent(),
                    then: Lyra.forbidden(),
                }),

            validate: Lyra.fn().when('method', {
                is: Lyra.alt(
                    false,
                    Lyra.absent(),
                ),
                then: Lyra.required(),
            }),

            single: Lyra.bool(),

            convert: Lyra.bool(),

            args: Lyra.alt(
                Lyra.arr(Lyra.str()),

                Lyra.obj().pattern(internals.nameRx, {
                    normalize: Lyra.fn(),

                    ref: Lyra.bool(),

                    assert: Lyra.alt(
                        Lyra.obj().schema(),
                        Lyra.fn(),
                    )
                        .when('ref', {
                            is: true,
                            then: Lyra.required(),
                        }),

                    message: Lyra.str().when('assert', {
                        is: Lyra.fn().required(),
                        then: Lyra.required(),
                        else: Lyra.forbidden(),
                    }),
                }),
            ),
        })
            .or('method', 'validate')
            .when('.validate', {
                is: Lyra.absent(),
                then: {
                    single: Lyra.forbidden(),
                    convert: Lyra.forbidden(),
                    args: Lyra.forbidden(),
                },
            }),
    ),

    overrides: Lyra.obj().pattern(internals.nameRx, Lyra.fn()),

    casts: Lyra.obj().pattern(internals.nameRx, Lyra.fn()),
})
    .when('.type', {
        is: Lyra.alt(
            Lyra.arr().min(2),
            Lyra.obj().regex(),
        ),
        then: {
            alias: Lyra.forbidden(),
            from: Lyra.forbidden(),
        },
    });
