import { SqlSnippet } from '../snippet.js'

export class String extends SqlSnippet {
  setInfix (value = ' ') {
    super.setInfix(value)
  }
}
