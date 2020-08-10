import { UserInfo } from '../../types'

export type Methods = {
  get: {
    resBody: UserInfo[]
  }

  post: {
    reqBody: UserInfo
  }
}
