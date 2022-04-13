import { I18n, isNil } from '../../../../common'
import type { RouteAuth, RouteHandlerOptions } from '../../../helpers/route'
import type Mail from 'nodemailer/lib/mailer'
import type { MessageBird } from 'messagebird/types'
import type { RedisClientType } from 'redis'
import { RouteHandler } from '../../../helpers/route'
import type { SqlDatabase } from '../../../helpers/sql'
import type { Struct } from '../../../../common'
import type { User } from '../../../entities'

interface AuthHandlerOptions extends Partial<RouteHandlerOptions> {
  auth: RouteAuth
  from: string
  i18n: I18n
  originator: string
  px: number
  sms: MessageBird
  smtp: Mail
}

export abstract class AuthHandler extends RouteHandler {
  public static options?: Partial<AuthHandlerOptions>

  public auth: RouteAuth

  public database: SqlDatabase

  public from?: string

  public i18n = new I18n()

  public originator?: string

  public px: number

  public sms?: MessageBird

  public smtp?: Mail

  public store: RedisClientType

  public constructor (options?: Partial<AuthHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.auth === undefined) {
      throw new Error('Option "auth" is undefined')
    }

    if (handlerOptions.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (handlerOptions.store === undefined) {
      throw new Error('Option "store" is undefined')
    }

    super(handlerOptions)
    this.auth = handlerOptions.auth
    this.from = handlerOptions.from
    this.i18n = handlerOptions.i18n ?? new I18n()
    this.originator = handlerOptions.originator
    this.px = handlerOptions.px ?? 60 * 1000
    this.sms = handlerOptions.sms
    this.smtp = handlerOptions.smtp
  }

  protected async prepareAuth (): Promise<void> {}

  protected async sendEmail (user: Partial<User>, code: string, data: Struct): Promise<void> {
    if (this.from === undefined) {
      throw new Error('From is undefined')
    }

    if (this.smtp === undefined) {
      throw new Error('SMTP is undefined')
    }

    await this.smtp.sendMail({
      from: this.from,
      subject: this.i18n.format(`${code}_subject`, data, user.locale ?? undefined),
      text: this.i18n.format(`${code}_text`, data, user.locale ?? undefined),
      to: this.i18n.formatMailName(user)
    })
  }

  protected async sendSms (user: Partial<User>, code: string, data: Struct): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (this.originator === undefined) {
        throw new Error('Originator is undefined')
      }

      if (this.sms === undefined) {
        throw new Error('Sms is undefined')
      }

      if (isNil(user.tel)) {
        throw new Error('Tel is undefined')
      }

      this.sms.messages.create({
        body: this.i18n.format(`${code}_body`, data, user.locale ?? undefined),
        originator: this.originator,
        recipients: [user.tel]
      }, (error) => {
        if (error === null) {
          resolve()
        } else {
          reject(error)
        }
      })
    })
  }
}
