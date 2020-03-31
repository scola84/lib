import { HtmlSnippet } from '../snippet.js'

export class Throw extends HtmlSnippet {
  resolveAfter (box, error) {
    throw error
  }
}
