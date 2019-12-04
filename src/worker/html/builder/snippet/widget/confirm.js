import { Alert } from './alert'

export class Confirm extends Alert {
  build (hb) {
    return hb
      .modal()
      .class('transition')
      .append(
        hb.submit(
          hb.form()
            .class('dialog')
            .append(
              hb.header(
                hb.title()
                  .text(
                    this._title
                  )
              ),
              hb.body(
                hb.div()
                  .html(
                    this._message
                  )
              ),
              hb.footer(
                hb.click(
                  hb.button()
                    .text(
                      hb.print()
                        .format('button.cancel')
                    )
                ).act((box, data) => {
                  box.confirm = false
                  this.remove()
                  this.pass(box, data)
                }),
                hb.click(
                  hb.button()
                    .text(
                      hb.print()
                        .format('button.ok')
                    )
                ).act((box, data) => {
                  box.confirm = true
                  this.remove()
                  this.pass(box, data)
                })
              )
            )
        )
      )
  }
}
