import type { Sms, SmsSendOptions, SmsSendResult } from './sms'
import { I18n } from '../../../common'
import type { Twilio } from 'twilio'
import type { User } from '../../entities'
import twilio from 'twilio'

export interface TwilioSmsOptions {
  accountSid: string
  authToken: string
  from?: string
  i18n?: I18n
}

export class TwilioSms implements Sms {
  public client: Twilio

  public from: string

  public i18n: I18n

  public constructor (options: TwilioSmsOptions) {
    this.client = twilio(options.accountSid, options.authToken)
    this.from = options.from ?? ''
    this.i18n = options.i18n ?? new I18n()
  }

  public async create (code: string, data: unknown, user: User): Promise<SmsSendOptions> {
    if (user.tel === null) {
      throw new Error('Tel is null')
    }

    return Promise.resolve({
      from: this.from,
      text: this.i18n.format(`${code}_text`, data, user.preferences.locale ?? undefined),
      to: user.tel
    })
  }

  public async send (options: SmsSendOptions): Promise<SmsSendResult> {
    const result = await this.client.messages.create({
      body: options.text,
      from: options.from,
      to: options.to
    })

    return {
      id: result.sid
    }
  }
}
