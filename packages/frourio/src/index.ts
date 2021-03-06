import {
  LowerHttpMethod,
  AspidaMethods,
  HttpMethod,
  HttpStatusOk,
  AspidaMethodParams,
  $arrayTypeKeysName
} from 'aspida'
import express, { RequestHandler, Router } from 'express'
import { validateOrReject } from 'class-validator'
import { ConnectionOptions } from 'typeorm'
import { IHelmetConfiguration } from 'helmet'
import { CorsOptions } from 'cors'
import { Options } from 'multer'

export type File = Express.Multer.File

export type Config = {
  port: number | string
  basePath?: string
  helmet?: boolean | IHelmetConfiguration
  cors?: boolean | CorsOptions
  typeorm?: ConnectionOptions
  multer?: Options
}

type HttpStatusNoOk =
  | 301
  | 302
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 409
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505

type PartiallyPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type BaseResponse<T, U, V> = {
  status: V extends number ? V : HttpStatusOk
  body: T
  headers: U
}

type ServerResponse<K extends AspidaMethodParams> =
  | (K['resBody'] extends {} | null
      ? K['resHeaders'] extends {}
        ? BaseResponse<K['resBody'], K['resHeaders'], K['status']>
        : PartiallyPartial<
            BaseResponse<
              K['resBody'],
              K['resHeaders'] extends {} | undefined ? K['resHeaders'] : undefined,
              K['status']
            >,
            'headers'
          >
      : K['resHeaders'] extends {}
      ? PartiallyPartial<
          BaseResponse<
            K['resBody'] extends {} | null | undefined ? K['resBody'] : undefined,
            K['resHeaders'],
            K['status']
          >,
          'body'
        >
      : PartiallyPartial<
          BaseResponse<
            K['resBody'] extends {} | null | undefined ? K['resBody'] : undefined,
            K['resHeaders'] extends {} | undefined ? K['resHeaders'] : undefined,
            K['status']
          >,
          'body' | 'headers'
        >)
  | PartiallyPartial<BaseResponse<any, any, HttpStatusNoOk>, 'body' | 'headers'>

type ServerValues = {
  params?: Record<string, any>
  user?: any
}

type BlobToFile<T extends AspidaMethodParams> = T['reqFormat'] extends FormData
  ? {
      [P in keyof T['reqBody']]: Required<T['reqBody']>[P] extends Blob
        ? File
        : Required<T['reqBody']>[P] extends Blob[]
        ? File[]
        : T['reqBody'][P]
    }
  : T['reqBody']

type RequestParams<T extends AspidaMethodParams> = {
  path: string
  method: HttpMethod
  query: T['query']
  body: BlobToFile<T>
  headers: T['reqHeaders']
}

export type ServerMethods<T extends AspidaMethods, U extends ServerValues> = {
  [K in keyof T]: (
    req: RequestParams<T[K]> & U
  ) => ServerResponse<T[K]> | Promise<ServerResponse<T[K]>>
}

type Validator = {
  required: boolean
  Class: any
}

type Validators = {
  query?: Validator
  body?: Validator
  headers?: Validator
}

type ControllerTree = {
  name: string
  controller?: ServerMethods<any, any>
  ctrlMiddleware?: RequestHandler | RequestHandler[]
  uploader?: string[]
  validator?: { [K in LowerHttpMethod]?: Validators }
  middleware?: RequestHandler | RequestHandler[]
  children?: {
    names?: ControllerTree[]
    value?: ControllerTree
  }
}

const createValidateHandler = (validator: Validators | undefined): RequestHandler => (
  req,
  res,
  next
) =>
  Promise.all([
    validator?.query &&
      (Object.keys(req.query).length || validator.query.required ? true : undefined) &&
      validateOrReject(Object.assign(new validator.query.Class(), req.query)),
    validator?.headers &&
      (Object.keys(req.headers).length || validator.headers.required ? true : undefined) &&
      validateOrReject(Object.assign(new validator.headers.Class(), req.headers)),
    validator?.body &&
      (Object.keys(req.body).length || validator.body.required ? true : undefined) &&
      validateOrReject(Object.assign(new validator.body.Class(), req.body))
  ])
    .then(() => next())
    .catch(() => res.sendStatus(400))

const createTypedParamsHandler = (numberTypeParams: string[]): RequestHandler => async (
  req,
  res,
  next
) => {
  const typedParams: Record<string, string | number> = { ...req.params }

  for (const key of numberTypeParams) {
    const val = Number(typedParams[key])
    if (isNaN(val)) {
      res.sendStatus(400)
      return
    }

    typedParams[key] = val
  }

  ;(req as any).typedParams = typedParams
  next()
}

const methodsToHandler = (
  methodCallback: ServerMethods<any, any>[LowerHttpMethod]
): RequestHandler => async (req, res) => {
  try {
    const result = methodCallback({
      query: req.query,
      path: req.path,
      method: req.method as HttpMethod,
      body: req.body,
      headers: req.headers,
      params: (req as any).typedParams,
      user: (req as any).user
    })

    const { status, body, headers } = result instanceof Promise ? await result : result

    for (const key in headers) {
      res.setHeader(key, headers[key])
    }

    res.status(status).send(body)
  } catch (e) {
    res.sendStatus(500)
  }
}

const formatMulterData: RequestHandler = ({ body, files }, _res, next) => {
  if (body[$arrayTypeKeysName]) {
    const arrayTypeKeys: string[] = body[$arrayTypeKeysName].split(',')

    for (const key of arrayTypeKeys) {
      if (body[key] === undefined) body[key] = []
      else if (!Array.isArray(body[key])) {
        body[key] = [body[key]]
      }
    }

    for (const file of files) {
      if (Array.isArray(body[file.fieldname])) {
        body[file.fieldname].push(file)
      } else {
        body[file.fieldname] = file
      }
    }

    delete body[$arrayTypeKeysName]
  } else {
    for (const file of files) {
      if (Array.isArray(body[file.fieldname])) {
        body[file.fieldname].push(file)
      } else {
        body[file.fieldname] =
          body[file.fieldname] === undefined ? file : [body[file.fieldname], file]
      }
    }
  }

  next()
}

export const createRouter = (
  ctrl: ControllerTree,
  uploader: RequestHandler,
  numberTypeParams: string[] = []
): Router => {
  const router = express.Router({ mergeParams: true })

  if (ctrl.middleware) {
    ;(Array.isArray(ctrl.middleware) ? ctrl.middleware : [ctrl.middleware]).forEach(handler => {
      router.use(handler)
    })
  }

  if (ctrl.controller) {
    const typedParamsHandler = createTypedParamsHandler(numberTypeParams)
    const ctrlMiddlewareList = Array.isArray(ctrl.ctrlMiddleware)
      ? ctrl.ctrlMiddleware
      : ctrl.ctrlMiddleware
      ? [ctrl.ctrlMiddleware]
      : []

    for (const method in ctrl.controller) {
      const validateHandler = createValidateHandler(ctrl.validator?.[method as LowerHttpMethod])
      const handler = methodsToHandler(ctrl.controller[method])

      ;(router.route('/') as any)[method](
        ctrl.uploader?.includes(method)
          ? [
              uploader,
              formatMulterData,
              validateHandler,
              typedParamsHandler,
              ...ctrlMiddlewareList,
              handler
            ]
          : [validateHandler, typedParamsHandler, ...ctrlMiddlewareList, handler]
      )
    }
  }

  if (ctrl.children) {
    // eslint-disable-next-line no-unused-expressions
    ctrl.children.names?.forEach(n => {
      router.use(n.name, createRouter(n, uploader, numberTypeParams))
    })

    if (ctrl.children.value) {
      const pathName = ctrl.children.value.name.replace('_', ':').split('@')
      router.use(
        pathName[0],
        createRouter(
          ctrl.children.value,
          uploader,
          pathName[1] === 'number' ? [...numberTypeParams, pathName[0].slice(2)] : numberTypeParams
        )
      )
    }
  }

  return router
}

export const createInjectableFunction = <T extends [] | [any, ...any[]], U, V>(
  cb: (deps: V, ...params: T) => U,
  deps: V
) => {
  const fn = (...args: T) => cb(deps, ...args)
  fn.inject = (d: V) => (...args: T) => cb(d, ...args)
  return fn
}
