export function sql (strings: TemplateStringsArray, ...values: Array<unknown | undefined>): string {
  let string = ''

  for (let it = 0; it < strings.length; it += 1) {
    string += `${strings[it]}${String(values[it] ?? '')}`
  }

  return string
}
