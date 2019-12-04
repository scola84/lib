import { RequestResource } from './request-resource'

export class PostObject extends RequestResource {
  build (hb) {
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

    return hb
      .request()
      .resource(
        `POST ${resource}`
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
        hb.selector('.message'),
        hb.selector('.body .hint')
      )
  }
}
