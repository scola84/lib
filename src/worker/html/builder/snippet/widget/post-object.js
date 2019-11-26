import { RequestResource } from './request-resource'

export class PostObject extends RequestResource {
  buildWidget () {
    const b = this._builder

    const [
      object,
      link
    ] = this._name

    let resource = [
      `/${this._prefix}`,
      `/${this._version}`,
      `/${this._level}`,
      `/${object}`
    ]

    resource = resource
      .filter((v) => v !== '/')
      .join('')

    let view = `view-${object}:{${object}_id}@main:clr`

    if (link !== undefined) {
      resource += `/%(${object}_id)s/${link}`
      view = '@main:his'
    }

    return b
      .request()
      .resource(
        `POST ${resource}`
      )
      .indicator(
        b.selector('.progress')
      )
      .act(
        b.route().view('@self:clr'),
        b.route().view(view)
      )
      .err(
        b.selector('.message'),
        b.selector('.body .hint')
      )
  }
}
