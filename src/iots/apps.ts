import * as D from 'io-ts/lib/Decoder';

export const CreateApp = D.struct({
    name: D.string
})

export const CreateAppDec = D.struct({
    body: CreateApp
})