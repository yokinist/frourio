/* eslint-disable */
import { AspidaClient, BasicHeaders } from 'aspida'
import { Methods as Methods0 } from '.'
import { Methods as Methods1 } from './empty/noEmpty'
import { Methods as Methods2 } from './multiForm'
import { Methods as Methods3 } from './texts'
import { Methods as Methods4 } from './texts/sample'
import { Methods as Methods5 } from './users'

const GET = 'GET'
const POST = 'POST'
const PUT = 'PUT'
const PATH0 = '/empty/noEmpty'
const PATH1 = '/multiForm'
const PATH2 = '/texts'
const PATH3 = '/texts/sample'
const PATH4 = '/users'
const api = <T>({ baseURL, fetch }: AspidaClient<T>) => {
  const prefix = (baseURL === undefined ? '' : baseURL).replace(/\/$/, '')

  return {
    empty: {
      noEmpty: {
        get: (option?: { config?: T }) =>
          fetch<Methods1['get']['resBody']>(prefix, PATH0, GET, option).text(),
        $get: (option?: { config?: T }) =>
          fetch<Methods1['get']['resBody']>(prefix, PATH0, GET, option).text().then(r => r.body)
      }
    },
    multiForm: {
      post: (option: { body: Methods2['post']['reqBody'], config?: T }) =>
        fetch<Methods2['post']['resBody']>(prefix, PATH1, POST, option, 'FormData').json(),
      $post: (option: { body: Methods2['post']['reqBody'], config?: T }) =>
        fetch<Methods2['post']['resBody']>(prefix, PATH1, POST, option, 'FormData').json().then(r => r.body)
    },
    texts: {
      sample: {
        put: (option: { body: Methods4['put']['reqBody'], config?: T }) =>
          fetch<Methods4['put']['resBody']>(prefix, PATH3, PUT, option).json(),
        $put: (option: { body: Methods4['put']['reqBody'], config?: T }) =>
          fetch<Methods4['put']['resBody']>(prefix, PATH3, PUT, option).json().then(r => r.body)
      },
      get: (option: { query: Methods3['get']['query'], config?: T }) =>
        fetch<Methods3['get']['resBody']>(prefix, PATH2, GET, option).text(),
      $get: (option: { query: Methods3['get']['query'], config?: T }) =>
        fetch<Methods3['get']['resBody']>(prefix, PATH2, GET, option).text().then(r => r.body),
      put: (option?: { config?: T }) =>
        fetch<void>(prefix, PATH2, PUT, option).send(),
      $put: (option?: { config?: T }) =>
        fetch<void>(prefix, PATH2, PUT, option).send().then(r => r.body)
    },
    users: {
      get: (option?: { config?: T }) =>
        fetch<Methods5['get']['resBody']>(prefix, PATH4, GET, option).json(),
      $get: (option?: { config?: T }) =>
        fetch<Methods5['get']['resBody']>(prefix, PATH4, GET, option).json().then(r => r.body),
      post: (option: { body: Methods5['post']['reqBody'], config?: T }) =>
        fetch<void>(prefix, PATH4, POST, option).send(),
      $post: (option: { body: Methods5['post']['reqBody'], config?: T }) =>
        fetch<void>(prefix, PATH4, POST, option).send().then(r => r.body)
    },
    get: (option?: { query?: Methods0['get']['query'], config?: T }) =>
      fetch<Methods0['get']['resBody'], BasicHeaders, Methods0['get']['status']>(prefix, '', GET, option).json(),
    $get: (option?: { query?: Methods0['get']['query'], config?: T }) =>
      fetch<Methods0['get']['resBody'], BasicHeaders, Methods0['get']['status']>(prefix, '', GET, option).json().then(r => r.body),
    post: (option: { body: Methods0['post']['reqBody'], query: Methods0['post']['query'], config?: T }) =>
      fetch<Methods0['post']['resBody'], BasicHeaders, Methods0['post']['status']>(prefix, '', POST, option, 'FormData').json(),
    $post: (option: { body: Methods0['post']['reqBody'], query: Methods0['post']['query'], config?: T }) =>
      fetch<Methods0['post']['resBody'], BasicHeaders, Methods0['post']['status']>(prefix, '', POST, option, 'FormData').json().then(r => r.body)
  }
}

export type ApiInstance = ReturnType<typeof api>
export default api
