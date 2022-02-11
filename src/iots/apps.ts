import * as D from 'io-ts'

export const CreateAppDec = D.type({
    name: D.string
})

export type CreateApp = D.TypeOf<typeof CreateAppDec>;