import { RequestResource } from './request-resource'

export class DeleteObject extends RequestResource {
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
      `/${object}/%(${object}_id)s`
    ]

    resource = resource
      .filter((v) => v !== '/')
      .join('')

    let view = 'select@main:clr'

    if (link !== undefined) {
      resource += `/${link}/%(${link}_id)s`
      view = '@main:his'
    }

    return b
      .request()
      .resource(
        `DELETE ${resource}`
      )
      .indicator(
        b.selector('.progress')
      )
      .act(
        b.route().view('@self:clr'),
        b.route().view(view)
      )
      .err(
        b.selector('.message')
      )
  }
}
