import { RequestResource } from './request-resource'

export class GetObject extends RequestResource {
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
        `GET ${resource}`
      )
      .indicator(
        hb.selector('.progress')
      )
      .act(
        ...this._args
      )
      .err(
        hb.selector('.message')
      )
  }
}
