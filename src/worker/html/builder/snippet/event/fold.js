import { select } from 'd3-selection'
import { Event } from '../event'

export class Fold extends Event {
  constructor (options = {}) {
    super(options)
    this.name('click')
  }

  attach (item, isImmediate) {
    item.style('width')

    if (isImmediate === true) {
      item.style('transition-duration', '0s')
    }

    item
      .classed('out', false)
      .on('transitionend.scola-fold', () => {
        item
          .style('height', null)
          .style('transition-duration', null)
          .on('.scola-fold', null)
      })

    const duration = parseFloat(item.style('transition-duration'))

    if (duration === 0) {
      item.dispatch('transitionend')
    }
  }

  detach (item, isImmediate) {
    const { height } = item.node().getBoundingClientRect()

    item.style('height', `${height} px`)
    item.style('width')

    if (isImmediate === true) {
      item.style('transition-duration', '0s')
    }

    item
      .classed('out', true)
      .on('transitionend.scola-fold', () => {
        item
          .style('transition-duration', null)
          .on('transitionend.scola-fold', null)
          .remove()
      })

    const duration = parseFloat(item.style('transition-duration'))

    if (height === 0 || duration === 0) {
      item.dispatch('transitionend')
    }
  }

  fold (box, data, snippet, isImmediate = false) {
    const group = snippet.node()
    const isFolded = group.classed('folded')

    const snippets = this._filter === null
      ? snippet.find((s) => s.node && s.node().classed('item'))
      : this._filter(snippet)

    group.classed('folded', isFolded === false)

    if (isFolded === true) {
      this.show(snippets, isImmediate)
    } else {
      this.hide(snippets, isImmediate)
    }
  }

  handle (box, data, snippet, event) {
    const handle = event.target.closest('.title')

    if (handle === null) {
      return
    }

    const mustFold = select(handle)
      .classed('fold handle')

    if (mustFold === true) {
      this.fold(box, data, snippet)
      this.save(box, data, snippet)
    }
  }

  hide (snippets, isImmediate) {
    let item = null

    for (let i = 0; i < snippets.length; i += 1) {
      item = snippets[i].node()

      item.next = item.node().nextSibling
      item.parent = item.node().parentNode

      this.detach(item, isImmediate)
    }
  }

  load (box, data, snippet) {
    const isFolded = Boolean(Number(
      this._storage.getItem(`fold-${this._id}`)
    ))

    snippet
      .node()
      .classed('folded', isFolded === false)
  }

  resolveAfter (box, data) {
    const result = []
    let snippet = null

    for (let i = 0; i < this._args.length; i += 1) {
      snippet = this._args[i]

      this.load(box, data, snippet)
      this.fold(box, data, snippet, true)

      result.push(snippet.node())
    }

    return result
  }

  save (box, data, snippet) {
    const isFolded = snippet
      .node()
      .classed('folded')

    this._storage.setItem(`fold-${this._id}`, Number(isFolded))
  }

  show (snippets, isImmediate) {
    let item = null

    for (let i = snippets.length - 1; i >= 0; i -= 1) {
      item = snippets[i].node()

      if (item.parent !== undefined) {
        if (item.next === undefined) {
          item.parent.appendChild(item.node())
        } else {
          item.parent.insertBefore(item.node(), item.next)
        }
      }

      this.attach(item, isImmediate)
    }
  }
}
