import builtins from 'builtin-modules'

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require(`${process.cwd()}/package.json`) as Record<string, unknown>

const externals = [
  ...builtins,
  ...Object.keys(pkg.dependencies as Record<string, unknown>)
]

export function isExternal (id: string): boolean {
  return externals.some((external) => {
    return id.startsWith(external)
  })
}
