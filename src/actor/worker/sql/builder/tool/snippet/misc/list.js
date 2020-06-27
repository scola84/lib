import { SqlSnippet } from '../snippet.js'

export class List extends SqlSnippet {
  setParens (value = true) {
    return super.setParens(value)
  }
}
