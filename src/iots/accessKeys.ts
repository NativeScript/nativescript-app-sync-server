import * as t from 'io-ts'

export const CreateAccessKey = t.type({
    ttl: t.number,
    description: t.union([t.string, t.undefined]),
    friendlyName: t.string
})
