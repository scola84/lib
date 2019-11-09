import { Widget } from '../widget'

export class DeleteObject extends Widget {
  buildWidget () {
    const b = this._builder

    const [
      object,
      link
    ] = this._name

    let resource = `/api/${object}/%(${object}_id)s`
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
