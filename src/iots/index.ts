import { RequestHandler } from 'express';
import * as D from 'io-ts/lib/Decoder';
import { Decoder } from 'io-ts/lib/Decoder';
import { pipe } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/lib/Either';
import { ParamsDictionary } from 'express-serve-static-core';

export * from './apps'
export * from './accessKeys'

export const validator: <T, A>(decoder: Decoder<T, A>) => RequestHandler<ParamsDictionary, any, T> = (decoder) => (req, res, next) => {
    return pipe(
        decoder.decode(req.body),
        fold(
            (errors) => res.status(400).send({ code: 'BadArgument', status: 'error', error: D.draw(errors) }),
            () => next(),
        ),
    );
};
