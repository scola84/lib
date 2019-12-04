import { RequestResource } from './request-resource'

export class PutObject extends RequestResource {
  build (hb) {
    const qualifier = this._name.map((name) => {
      return `/${name}/%(${name}_id)s`
    }).join('')

    let resource = [
      `/${this._prefix}`,
      `/${this._version}`,
      `/${this._level}`,
      qualifier
    ]

    resource = resource
      .filter((v) => v !== '/')
      .join('')

    return hb
      .request()
      .resource(
        `PUT ${resource}`
      )
      .indicator(
        hb.selector('.progress')
      )
      .act(
        hb.route()
          .view('@self:clr'),
        hb.route()
          .view('@main:his')
      )
      .err(
        hb.selector('.message'),
        hb.selector('.body .hint')
      )
  }
}
