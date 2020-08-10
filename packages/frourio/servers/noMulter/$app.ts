/* eslint-disable */
import 'reflect-metadata'
import path from 'path'
import {
  LowerHttpMethod,
  AspidaMethods,
  HttpMethod,
  HttpStatusOk,
  AspidaMethodParams
} from 'aspida'
import express, { RequestHandler, Request } from 'express'
import fastify from 'fastify'
import helmet, { HelmetOptions } from 'helmet'
import cors, { CorsOptions } from 'cors'
import { createConnection, ConnectionOptions } from 'typeorm'
import { validateOrReject } from 'class-validator'

export const createMiddleware = <T extends RequestHandler | RequestHandler[]>(handler: T): T extends RequestHandler[] ? T : [T] => (Array.isArray(handler) ? handler : [handler]) as any

import { Task as Entity0 } from './entity/Task'
import { TaskSubscriber as Subscriber0 } from './subscriber/TaskSubscriber'
import * as Types from './types'
import controller0, { middleware as ctrlMiddleware0 } from './api/@controller'
import controller1 from './api/empty/noEmpty/@controller'
import controller2 from './api/texts/@controller'
import controller3 from './api/texts/sample/@controller'
import controller4, { middleware as ctrlMiddleware1 } from './api/users/@controller'
import controller5 from './api/users/_userId@number/@controller'
import middleware0 from './api/@middleware'
import middleware1 from './api/users/@middleware'

export type Config = {
  port: number
  basePath?: string
  helmet?: boolean | HelmetOptions
  cors?: boolean | CorsOptions
  typeorm?: ConnectionOptions
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

type RequestParams<T extends AspidaMethodParams> = {
  path: string
  method: HttpMethod
  query: T['query']
  body: T['reqBody']
  headers: T['reqHeaders']
}

export type ServerMethods<T extends AspidaMethods, U extends ServerValues> = {
  [K in keyof T]: (
    req: RequestParams<T[K]> & U
  ) => ServerResponse<T[K]> | Promise<ServerResponse<T[K]>>
}

const createTypedParamsHandler = (numberTypeParams: string[]): RequestHandler => (
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

const createValidateHandler = (validators: (req: Request) => (Promise<void> | null)[]): RequestHandler =>
  (req, res, next) => Promise.all(validators(req)).then(() => next()).catch(() => res.sendStatus(400))

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

export const controllers = (): {
  path: string
  methods: {
    name: LowerHttpMethod
    handlers: RequestHandler[]
  }[]
}[] => {
  return [
    {
      path: '/',
      methods: [
        {
          name: 'get',
          handlers: [
            createValidateHandler(req => [
              Object.keys(req.query).length ? validateOrReject(Object.assign(new Types.ValidQuery(), req.query)) : null
            ]),
            ...middleware0,
            ...ctrlMiddleware0,
            methodsToHandler(controller0.get)
          ]
        },
        {
          name: 'post',
          handlers: [
            createValidateHandler(req => [
              validateOrReject(Object.assign(new Types.ValidQuery(), req.query)),
              validateOrReject(Object.assign(new Types.ValidBody(), req.body))
            ]),
            ...middleware0,
            ...ctrlMiddleware0,
            methodsToHandler(controller0.post)
          ]
        }
      ]
    },
    {
      path: '/empty/noEmpty',
      methods: [
        {
          name: 'get',
          handlers: [
            ...middleware0,
            methodsToHandler(controller1.get)
          ]
        }
      ]
    },
    {
      path: '/texts',
      methods: [
        {
          name: 'get',
          handlers: [
            ...middleware0,
            methodsToHandler(controller2.get)
          ]
        },
        {
          name: 'put',
          handlers: [
            ...middleware0,
            methodsToHandler(controller2.put)
          ]
        }
      ]
    },
    {
      path: '/texts/sample',
      methods: [
        {
          name: 'put',
          handlers: [
            ...middleware0,
            methodsToHandler(controller3.put)
          ]
        }
      ]
    },
    {
      path: '/users',
      methods: [
        {
          name: 'get',
          handlers: [
            ...middleware0,
            ...middleware1,
            ...ctrlMiddleware1,
            methodsToHandler(controller4.get)
          ]
        },
        {
          name: 'post',
          handlers: [
            createValidateHandler(req => [
              validateOrReject(Object.assign(new Types.ValidUserInfo(), req.body))
            ]),
            ...middleware0,
            ...middleware1,
            ...ctrlMiddleware1,
            methodsToHandler(controller4.post)
          ]
        }
      ]
    },
    {
      path: '/users/:userId',
      methods: [
        {
          name: 'get',
          handlers: [
            createTypedParamsHandler(['userId']),
            ...middleware0,
            ...middleware1,
            methodsToHandler(controller5.get)
          ]
        }
      ]
    }
  ]
}

export const entities = [Entity0]
export const migrations = []
export const subscribers = [Subscriber0]

export const run = async (config: Config) => {
  const typeormPromise = config.typeorm ? createConnection({
    entities,
    migrations,
    subscribers,
    ...config.typeorm
  }) : null
  const app = fastify()
  await app.register(require('fastify-express'))

  if (config.helmet) app.use(helmet(config.helmet === true ? {} : config.helmet))
  if (config.cors) app.use(cors(config.cors === true ? {} : config.cors))

  const router = express.Router()
  const basePath = config.basePath ? `/${config.basePath}`.replace('//', '/') : ''
  const ctrls = controllers()

  for (const ctrl of ctrls) {
    for (const method of ctrl.methods) {
      router[method.name](`${basePath}${ctrl.path}`, method.handlers)
    }
  }

  app.use(router)
  app.use(basePath, express.static(path.join(__dirname, 'public')))

  const [connection] = await Promise.all([
    typeormPromise,
    app.listen(config.port)
  ])

  console.log(`Frourio is running on http://localhost:${config.port}`)
  return { app, connection }
}
