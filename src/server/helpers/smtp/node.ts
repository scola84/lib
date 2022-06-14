import { I18n, cast, set } from '../../../common'
import type { Smtp, SmtpSendOptions } from './smtp'
import type Mail from 'nodemailer/lib/mailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import { URL } from 'url'
import type { User } from '../../../common'
import { createTransport } from 'nodemailer'

export interface NodeSmtpOptions {
  dsn: string
  from?: string
  html?: string
  i18n?: I18n
  password?: string
}

export class NodeSmtp implements Smtp {
  public client: Mail

  public dsn: string

  public from: string

  public html?: string

  public i18n: I18n

  public password?: string

  public constructor (options: NodeSmtpOptions) {
    this.dsn = options.dsn
    this.from = options.from ?? ''
    this.html = options.html
    this.i18n = options.i18n ?? new I18n()
    this.password = options.password
    this.start()
  }

  public async create (code: string, data: unknown, user: Pick<User, 'i18n_locale' | 'identity_email' | 'identity_name'>): Promise<SmtpSendOptions> {
    const subject = this.i18n.formatText(`email_subject_${code}`, data, user.i18n_locale ?? undefined)
    const text = this.i18n.formatText(`email_text_${code}`, data, user.i18n_locale ?? undefined)

    let html: string | null = null

    if (this.html !== undefined) {
      html = this.i18n.formatText(this.html, {
        subject: subject,
        text: this.i18n.formatMarked(text)
      })
    }

    return Promise.resolve({
      from: this.from,
      html: html ?? undefined,
      subject: subject,
      text: text,
      to: this.i18n.formatEmailAddress(user)
    })
  }

  public async send (options: SmtpSendOptions): Promise<void> {
    await this.client.sendMail({
      attachments: options.attachments,
      from: options.from,
      html: options.html,
      subject: options.subject,
      text: options.text,
      to: options.to
    })
  }

  public start (): void {
    const options = this.parseDsn(this.dsn)

    set(options, 'auth.pass', this.password)
    this.client = createTransport(options)
  }

  protected parseDsn (dsn: string): SMTPTransport.Options {
    const url = new URL(dsn)

    const options: SMTPTransport.Options = {
      auth: {
        user: url.username
      },
      host: url.hostname,
      port: Number(url.port)
    }

    if (url.port !== '') {
      options.port = Number(url.port)
    }

    Array
      .from(url.searchParams.entries())
      .forEach(([name, value]) => {
        set(options, name, cast(value))
      })

    return options
  }
}
