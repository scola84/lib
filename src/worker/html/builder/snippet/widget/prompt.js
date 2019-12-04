import { Alert } from './alert'

export class Prompt extends Alert {
  constructor (options = {}) {
    super(options)

    this._input = null
    this.setInput(options.input)
  }

  getInput () {
    return this._input
  }

  setInput (value = null) {
    this._input = value
    return this
  }

  input (value) {
    return this.setInput(value)
  }

  build (hb) {
    let input = this._input

    if (input === null) {
      input = hb
        .text()
        .class('prompt')
    }

    const modal = hb
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
                  ),
                input
              ),
              hb.footer(
                hb.click(
                  hb.button()
                    .text(
                      hb.print()
                        .format('button.cancel')
                    )
                ).act(() => {
                  this.remove()
                }),
                hb.button()
                  .attributes({
                    type: 'submit'
                  })
                  .text(
                    hb.print()
                      .format('button.ok')
                  )
              )
            )
        ).act((box, data) => {
          box.prompt = modal
            .node()
            .select('input.prompt')
            .property('value')

          this.remove()
          this.pass(box, data)
        })
      )

    return modal
  }
}
