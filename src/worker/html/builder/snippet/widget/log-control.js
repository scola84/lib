import merge from 'lodash-es/merge'
import { Widget } from '../widget'

export class LogControl extends Widget {
  constructor (options = {}) {
    super(options)

    this._action = null
    this._begin = null
    this._end = null
    this._mode = null

    this.setAction(options.action)
    this.setBegin(options.begin)
    this.setEnd(options.end)
    this.setMode(options.mode)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      action: this._action,
      begin: this._begin,
      end: this._end,
      mode: this._mode
    }
  }

  getAction () {
    return this._action
  }

  setAction (...action) {
    this._action = action
    return this
  }

  action (...action) {
    return this.setAction(...action)
  }

  getBegin () {
    return this._begin
  }

  setBegin (value = new Date().toISOString().slice(0, 10)) {
    this._begin = value
    return this
  }

  begin (value) {
    return this.setBegin(value)
  }

  getEnd () {
    return this._end
  }

  setEnd (value = new Date().toISOString().slice(0, 10)) {
    this._end = value
    return this
  }

  end (value) {
    return this.setEnd(value)
  }

  getMode () {
    return this._mode
  }

  setMode (...mode) {
    this._mode = mode
    return this
  }

  mode (...mode) {
    return this.setMode(...mode)
  }

  build (hb) {
    return hb
      .div()
      .class('log-control')
      .append(
        hb.row(
          hb.div()
            .class('name')
            .append(
              hb.input(
                hb.select()
                  .wrap()
                  .classed({
                    click: !(this._name.length < 2)
                  })
                  .attributes({
                    disabled: this._name.length < 2 ? 'disabled' : null,
                    name: 'name'
                  })
                  .append(
                    ...this.buildName(hb)
                  )
              ).act((box, data) => {
                this.handleInput(box, data)
              })
            ),
          hb.div()
            .class('range')
            .append(
              hb.input(
                hb.date()
                  .wrap()
                  .attributes({
                    formnovalidate: 'formnovalidate',
                    name: 'begin',
                    required: 'required'
                  })
              ).act((box, data) => {
                this.handleInput(box, data)
              }),
              hb.div()
                .class('arrow'),
              hb.input(
                hb.date()
                  .wrap()
                  .attributes({
                    formnovalidate: 'formnovalidate',
                    name: 'end',
                    required: 'required'
                  })
              ).act((box, data) => {
                this.handleInput(box, data)
              })
            )
        ),
        hb.row(
          hb.div()
            .class('action')
            .append(
              ...this._action
            ),
          hb.tab()
            .id('mode')
            .append(
              hb.div()
                .class('tab mode')
                .append(
                  ...this.buildMode(hb)
                )
            ).act((box, data) => {
              this.handleInput(box, data)
            })
        )
      )
  }

  buildMode (hb) {
    return this._mode.map((name) => {
      const selected = name.slice(-1) === '#'

      const selectedName = selected === true
        ? name.slice(0, -1)
        : name

      return hb
        .button()
        .attributes({
          value: selectedName.split('.').pop()
        })
        .classed({
          click: true,
          selected
        })
        .text(
          hb.print().format(selectedName)
        )
    })
  }

  buildName (hb) {
    return this._name.map((name) => {
      const selected = name.slice(-1) === '#'
        ? 'selected'
        : null

      const selectedName = selected === null
        ? name
        : name.slice(0, -1)

      return hb
        .option()
        .attributes({
          selected,
          value: selectedName.split('.').pop()
        })
        .text(
          hb.print().format(selectedName)
        )
    })
  }

  handleInput (box, data) {
    this.read(box, data)
    this.save(box, data)
    this.pass(box, data)
  }

  load () {
    const control = JSON.parse(
      this._storage.getItem(`control-${this._id}`) || '{}'
    )

    const [snippet] = this._args
    const node = snippet.node()

    if (control.mode !== undefined) {
      node
        .selectAll('.tab *')
        .classed('selected', false)

      node
        .select(`.tab *[value=${control.mode}]`)
        .classed('selected', true)
    }

    if (control.name !== undefined) {
      node
        .select('select')
        .property('value', control.name)
    }

    node
      .select('input[name=begin]')
      .property('value', control.begin || this._begin)
      .node()
      .snippet
      .changeValue()

    node
      .select('input[name=end]')
      .property('value', control.end || this._end)
      .node()
      .snippet
      .changeValue()
  }

  read (box) {
    const [snippet] = this._args
    const node = snippet.node()

    const mode = this._mode.length === 0 ? null : node
      .select('.tab .selected')
      .property('value')

    const name = this._name.length === 0 ? null : node
      .select('select')
      .property('value')

    const begin = node
      .select('input[name=begin]')
      .property('value')

    const end = node
      .select('input[name=end]')
      .property('value')

    merge(box, {
      control: {
        mode,
        name,
        begin,
        end
      }
    })
  }

  resolveAfter (box, data) {
    this.read(box, data)
    this.load(box, data)
  }

  save (box) {
    this._storage.setItem(
      `control-${this._id}`,
      JSON.stringify(box.control)
    )
  }
}
