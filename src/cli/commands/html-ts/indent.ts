export function indent (string: string, space: number): string {
  return string
    .split('\n')
    .map((line) => {
      if (line.length === 0) {
        return line
      }

      return line.padStart(line.length + space, ' ')
    })
    .join('\n')
}
