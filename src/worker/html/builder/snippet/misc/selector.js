import isFunction from 'lodash/isFunction.js'
import { HtmlSnippet } from '../snippet.js'

export class Selector extends HtmlSnippet {
  find (compare) {
    const snippets = this.resolve(null)
    let result = []

    for (let i = 0; i < snippets.length; i += 1) {
      result = result.concat(snippets[i].find(compare))
    }

    return result
  }

  resolveAfter (box, data) {
    const [query] = this._args

    if (isFunction(query) === true) {
      return this.resolveFunction(box, data, query)
    }

    return this.resolveString(box, data, query)
  }

  resolveFunction (box, data, query) {
    const result = []

    const snippets = this._origin
      .getView()
      .find(query)

    for (let i = 0; i < snippets.length; i += 1) {
      result.push(
        box === null
          ? snippets[i]
          : this.resolveValue(box, data, snippets[i])
      )
    }

    return result
  }

  resolveString (box, data, query) {
    const result = []

    this._origin
      .getView()
      .node()
      .selectAll(query)
      .each((datum, index, nodes) => {
        result.push(
          box === null
            ? nodes[index].snippet
            : this.resolveValue(box, data, nodes[index].snippet)
        )
      })

    return result
  }
}
