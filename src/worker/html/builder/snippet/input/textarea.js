import { Input } from '../input'

export class Textarea extends Input {
  constructor (options = {}) {
    super(options)

    this._grow = null
    this.setGrow(options.grow)

    this.name('textarea')
  }

  getOptions () {
    return {
      ...super.getOptions(),
      grow: this._grow
    }
  }

  getGrow () {
    return this._grow
  }

  setGrow (value = true) {
    this._grow = value
    return this
  }

  grow (value) {
    return this.setGrow(value)
  }

  cleanAfter (box, data, name, value) {
    this.setValue(data, name, String(value).trim())
  }

  removeBefore () {
    this._node.on('.scola-textarea', null)
    this.removeOuter()
  }

  resolveAfter () {
    if (this._grow === true) {
      this.resolveGrow()
    }

    return this._node
  }

  resolveGrow () {
    const wrapper = this
      .wrapNode('div')
      .classed('input textarea', true)

    const pre = wrapper.append('pre')
    const span = pre.append('span')

    pre.append('br')

    const style = window
      .getComputedStyle(this._node.node())

    wrapper
      .style('display', 'flex')

    pre
      .style('border', '1px solid black')
      .style('box-sizing', 'content-box')
      .style('position', 'absolute')
      .style('top', '-100%')
      .style('visibility', 'hidden')
      .style('white-space', 'pre-wrap')
      .style('word-wrap', 'break-word')

    this._node
      .style('box-sizing', 'content-box')
      .style('height', '100%')
      .style('margin', 0)
      .style('overflow', 'hidden')
      .style('resize', 'none')
      .style('width', '100%');

    [
      'border-bottom-width',
      'border-left-width',
      'border-right-width',
      'border-top-width',
      'min-height',
      'padding',
      'padding-bottom',
      'padding-left',
      'padding-right',
      'padding-top',
      'width'
    ].forEach((name) => {
      pre.style(name, style[name])
    })

    this._node.on('input.scola-textarea', () => {
      span.text(this._node.property('value'))
      this._node.style('height', pre.style('height'))
    })
  }
}
