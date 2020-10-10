'use strict';

const Jade = require('.');

const internals = {
    nameRx: /^[\w-]+$/,
};

exports.extensions = Jade.arr(Jade.obj(), Jade.fn()).min(1);

internals.rule = Jade.obj({
    method: Jade.fn().allow(false),
    alias: Jade.arr(Jade.str())
        .single()
        .when('method', {
            is: Jade.absent(),
            then: Jade.forbidden(),
        }),
    validate: Jade.fn().when('method', {
        is: Jade.alt(
            false,
            Jade.absent(),
        ),
        then: Jade.required(),
    }),
    single: Jade.bool(),
    convert: Jade.bool(),
    args: Jade.alt(
        Jade.arr(Jade.str()),
        Jade.obj().pattern(internals.nameRx, {
            normalize: Jade.fn(),
            ref: Jade.bool(),
            assert: Jade.alt(
                Jade.obj().schema(),
                Jade.fn(),
            )
                .when('ref', {
                    is: true,
                    then: Jade.required(),
                }),
            message: Jade.str().when('assert', {
                is: Jade.fn().required(),
                then: Jade.required(),
                else: Jade.forbidden(),
            }),
        }),
    ),
})
    .when('.validate', {
        is: Jade.absent(),
        then: {
            single: Jade.forbidden(),
            convert: Jade.forbidden(),
            args: Jade.forbidden(),
        },
    });

exports.extension = Jade.obj({
    type: Jade.alt(
        Jade.arr(Jade.str()).single(),
        Jade.obj().regex(),
    )
        .required(),
    alias: Jade.arr(Jade.str()).single(),
    from: Jade.obj().schema(),
    flags: Jade.obj().pattern(internals.nameRx, Jade.required()),
    messages: Jade.obj().pattern(Jade.str(), Jade.alt(
        Jade.str(),
        Jade.obj().template(),
    )),
    terms: Jade.obj().pattern(internals.nameRx, {
        default: Jade.alt(
            Jade.arr(),
            Jade.obj().values(),
            null,
        )
            .required(),
        merge: Jade.fn(),
        desc: Jade.obj({
            mapped: Jade.obj({
                from: Jade.str().required(),
                to: Jade.str().required(),
            })
                .required(),
        }),
        register: Jade.num(),
    }),
    args: Jade.fn(),
    rebuild: Jade.fn(),
    coerce: Jade.fn(),
    validate: Jade.fn(),
    rules: Jade.obj().pattern(internals.nameRx, internals.rule),
    overrides: Jade.obj().pattern(internals.nameRx, Jade.fn()),
    casts: Jade.obj().pattern(internals.nameRx, Jade.fn()),
})
    .when('.type', {
        is: Jade.alt(
            Jade.arr().min(2),
            Jade.obj().regex(),
        ),
        then: {
            alias: Jade.forbidden(),
            from: Jade.forbidden(),
        },
    });
