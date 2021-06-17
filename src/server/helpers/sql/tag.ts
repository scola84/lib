/**
 * Formats a query. Can be used as a template tag to enable syntax highlighting of queries in IDEs.
 *
 * Note: use placeholders like `$(name)` to escape values safely.
 *
 * @param strings - The strings
 * @param values - The values
 * @returns The query
 */
export function sql (strings: TemplateStringsArray, ...values: Array<unknown | undefined>): string {
  let string = ''

  for (let it = 0; it < strings.length; it += 1) {
    string += `${strings[it]}${String(values[it] ?? '')}`
  }

  return string
}
