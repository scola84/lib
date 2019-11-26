import { RequestResource } from './request-resource'

export class GetObject extends RequestResource {
  buildWidget (args) {
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
        `GET ${resource}`
      )
      .indicator(
        b.selector('.progress')
      )
      .act(
        ...args
      )
      .err(
        b.selector('.message')
      )
  }
}
