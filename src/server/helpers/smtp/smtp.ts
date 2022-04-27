import type { Attachment } from 'nodemailer/lib/mailer'
import type { User } from '../../../common'

export interface SmtpSendOptions {
  attachments?: Attachment[]
  from: string
  html?: string
  subject: string
  text: string
  to: string
}

export interface Smtp {
  create: (code: string, data: unknown, user: Pick<User, 'email' | 'name' | 'preferences'>) => Promise<SmtpSendOptions>
  send: (options: SmtpSendOptions) => Promise<void>
}
