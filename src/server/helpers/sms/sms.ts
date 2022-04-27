import type { User } from '../../../common'

export interface SmsSendOptions {
  from: string
  text: string
  to: string
}

export interface SmsSendResult {
  id: string
}

export interface Sms {
  create: (code: string, data: unknown, user: Pick<User, 'preferences' | 'tel'>) => Promise<SmsSendOptions>
  send: (options: SmsSendOptions) => Promise<SmsSendResult>
}
