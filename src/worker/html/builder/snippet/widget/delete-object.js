import { RequestResource } from './request-resource'

export class DeleteObject extends RequestResource {
  build (hb) {
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

    return hb
      .request()
      .resource(
        `DELETE ${resource}`
      )
      .indicator(
        hb.selector('.progress')
      )
      .act(
        hb.route()
          .view('@self:clr'),
        hb.route()
          .view(view)
      )
      .err(
        hb.selector('.message')
      )
  }
}
