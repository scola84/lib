import type { Sms, SmsSendOptions, SmsSendResult } from './sms'
import { I18n } from '../../../common'
import type { MessageBird } from 'messagebird/types'
import type { User } from '../../entities'
import messagebird from 'messagebird'

export interface MessageBirdSmsOptions {
  accessKey: string
  i18n?: I18n
  originator?: string
}

export class MessagebirdSms implements Sms {
  public client: MessageBird

  public i18n: I18n

  public originator: string

  public constructor (options: MessageBirdSmsOptions) {
    this.client = messagebird(options.accessKey)
    this.i18n = options.i18n ?? new I18n()
    this.originator = options.originator ?? ''
  }

  public async create (code: string, data: unknown, user: Pick<User, 'preferences' | 'tel'>): Promise<SmsSendOptions> {
    if (user.tel === null) {
      throw new Error('Tel is null')
    }

    return Promise.resolve({
      from: this.originator,
      text: this.i18n.format(`${code}_text`, data, user.preferences.locale ?? undefined),
      to: user.tel
    })
  }

  public async send (options: SmsSendOptions): Promise<SmsSendResult> {
    return new Promise((resolve, reject) => {
      this.client.messages.create({
        body: options.text,
        originator: options.from,
        recipients: [
          options.to
        ]
      }, (error, response) => {
        if (error === null) {
          resolve({
            id: response?.id ?? ''
          })
        } else {
          reject(error)
        }
      })
    })
  }
}
