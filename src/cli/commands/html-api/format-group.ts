export function formatGroup (array: string[], space: number, braces = ['{', '}'], separator = ','): string {
  return `${braces[0]}\n${array
    .map((line) => {
      return line.padStart(line.length + space + 2, ' ')
    })
    .join(`${separator}\n`)}\n${' '.repeat(space)}${braces[1]}`
}
