import { HtmlBuilder, MsgSender, SqlBuilder } from '../../worker'

export function api () {
  HtmlBuilder.setup()
  MsgSender.setup()
  SqlBuilder.setup()
}
