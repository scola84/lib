import { RequestResource } from './request-resource'

export class PutObject extends RequestResource {
  buildWidget () {
    const b = this._builder

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

    return b
      .request()
      .resource(
        `PUT ${resource}`
      )
      .indicator(
        b.selector('.progress')
      )
      .act(
        b.route().view('@self:clr'),
        b.route().view('@main:his')
      )
      .err(
        b.selector('.message'),
        b.selector('.body .hint')
      )
  }
}
