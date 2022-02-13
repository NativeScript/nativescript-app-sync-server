import * as D from 'io-ts/lib/Decoder';

export const CreateAccessKey = D.struct({
    ttl: D.number,
    description: D.string,
    friendlyName: D.string
})
