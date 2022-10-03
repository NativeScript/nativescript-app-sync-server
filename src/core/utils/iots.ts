import * as t from 'io-ts'

function nullable<A, O>(
    codec: t.Type<A, O, unknown>,
    name: string = `${codec.name} | null`
): t.Type<A | null, O | null, unknown> {
    return new t.Type(
        name,
        (u: unknown): u is A | null => u === null || codec.is(u),
        (u, c) => (u === null ? t.success(u) : codec.validate(u, c)),
        a => (a === null ? a as null : codec.encode(a))
    ) //                   ^ Smelly code right here again
}

function optional<A, O>(
    codec: t.Type<A, O, unknown>,
    name: string = `${codec.name} | undefined`
): t.Type<A | undefined, O | undefined, unknown> {
    return new t.Type(
        name,
        (u: unknown): u is A | undefined => u === undefined || codec.is(u),
        (u, c) => (u === undefined ? t.success(u) : codec.validate(u, c)),
        a => (a === undefined ? a as undefined : codec.encode(a))
    ) //                        ^ Smelly code right here
}

const newTs = {
    optional,
    nullable,
    ...t
}

export = newTs