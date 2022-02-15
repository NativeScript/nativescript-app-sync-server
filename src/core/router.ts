import * as t from "io-ts";
import { PathParams, RequestHandlerParams } from "express-serve-static-core"; // eslint-disable-line import/no-unresolved, import/extensions
import reporter from "io-ts-reporters";
import {
  Router,
  NextFunction,
  Request,
  Response,
  RequestHandler,
  RouterOptions,
} from "express";
import expressPromiseRouter from "express-promise-router";
import { IoTsValidationError } from "./app-error";

type Omit<O, K> = Pick<O, Exclude<keyof O, K>>;

enum MissingValidator { }
type MissingValidatorC = t.Type<MissingValidator>;

type AddBody<V> = V extends MissingValidator ? {} : { body: V };
type AddParams<V> = V extends MissingValidator ? {} : { params: V };
type AddQuery<V> = V extends MissingValidator ? {} : { query: V };

type ValidatedRequest<Body, Params, Query> = Omit<
  Request,
  "body" | "params" | "query"
> &
  AddBody<Body> &
  AddParams<Params> &
  AddQuery<Query>;

export type ValidatedRequestHandler<
  Body = MissingValidator,
  Params = MissingValidator,
  Query = MissingValidator
  > = (
    req: Omit<Request, 'body' | 'params' | 'query'> & ValidatedRequest<Body, Params, Query>,
    res: Response,
    next: NextFunction
  ) => any;

interface ValidationRouterMatcher {
  (path: PathParams, ...handlers: ValidatedRequestHandler[]): void;
  (path: PathParams, ...handlers: RequestHandlerParams[]): void;
  <
    B extends t.Type<any, any, any> = MissingValidatorC,
    P extends t.Type<any, any, any> = MissingValidatorC,
    Q extends t.Type<any, any, any> = MissingValidatorC
    >(
    path: PathParams,
    validation: {
      body?: B;
      params?: P;
      query?: Q;
    },
    ...handlers: ValidatedRequestHandler<
      t.TypeOf<B>,
      t.TypeOf<P>,
      t.TypeOf<Q>
    >[]
  ): void;
}

type Method = "post" | "get" | "put" | "delete" | "patch";
type ValidationRouterMethods = { [method in Method]: ValidationRouterMatcher };
type ValidationRouter = ValidationRouterMethods &
  Omit<Router, Method> &
  RequestHandler;

function validationRoute<
  B extends t.Type<any> = never,
  P extends t.Type<any> = never,
  Q extends t.Type<any> = never
>(reqType: { body?: B; params?: P; query?: Q }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (reqType.params) {
      // TODO: params are always strings, so auto convert t.number to NumberFromString
      const result = reqType.params.decode(req.params);
      if (result._tag === 'Left') {
        const report = reporter.report(result);
        throw new IoTsValidationError(report.join());
      }
      req.params = result.right;
    }
    if (reqType.query) {
      const result = reqType.query.decode(req.query);
      if (result._tag === 'Left') {
        const report = reporter.report(result);
        throw new IoTsValidationError(report.join());
      }
      req.query = result.right;
    }
    if (reqType.body) {
      const result = reqType.body.decode(req.body);
      if (result._tag === 'Left') {
        const report = reporter.report(result);
        throw new IoTsValidationError(report.join());
      }
      req.body = result.right;
    }
    next();
  };
}

function validationRouter(options?: RouterOptions): ValidationRouter {
  const router = expressPromiseRouter(options);
  const methods: Method[] = ["get", "post", "put", "delete", "patch"];
  methods.forEach((method) => {
    const orig = router[method].bind(router);
    // TODO: figure out the anys
    router[method] = (path: any, validation: any, ...handlers: any[]) => {
      // TODO: handle array without path and or validation
      if (typeof validation === "function") {
        return orig(path, validation, ...handlers);
      }
      return orig(path, validationRoute(validation), ...handlers);
    };
  });
  return router as any; // TODO: figure this out
}

export default validationRouter;