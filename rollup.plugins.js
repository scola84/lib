const { execSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')
const { template } = require('lodash')
const minimist = require('minimist')
const babel = require('rollup-plugin-babel')
const commonjs = require('rollup-plugin-commonjs')
const json = require('rollup-plugin-json')
const license = require('rollup-plugin-license')
const builtins = require('rollup-plugin-node-builtins')
const resolve = require('rollup-plugin-node-resolve')
const css = require('rollup-plugin-postcss')
const { uglify } = require('rollup-plugin-uglify')
const pkg = require([process.cwd(), 'package.json'].join('/'))
const { w: watch } = minimist(process.argv)

const bannerTemplate = `
@license <%= pkg.name %>@<%= pkg.version %>

Copyright (c) <%= pkg.author %>

The licenses of this package and its dependencies can be found
in the LICENSE file in the root directory of this source tree.`

const licenseTemplate = `
# License of this package

MIT License

Copyright (c) <%= pkg.author %>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

# Licenses of its dependencies
<% _.forEach(dependencies, function (dependency) { %>
## <%= dependency.name %>@<%= dependency.version%>

<%= (dependency.licenseText || dependency.license || '').trim() %>
<% }) %>`

function scolaBabel () {
  if (watch) {
    return {}
  }

  return babel({
    plugins: [
      ['@babel/plugin-transform-runtime', {
        helpers: false
      }]
    ],
    presets: [
      ['@babel/preset-env']
    ]
  })
}

function scolaChangelog () {
  if (watch) {
    return {}
  }

  return {
    writeBundle: () => {
      const file = process.cwd() + '/CHANGELOG.md'
      let log = null

      try {
        log = String(readFileSync(file))
      } catch (error) {
        return
      }

      if (log.match(pkg.version)) {
        return
      }

      const add = String(
        execSync(
          'git log --pretty=format:"* %s"' +
          ' HEAD ^$(git tag --sort version:refname | tail -n 1)'
        )
      )

      if (add === '') {
        return
      }

      writeFileSync(
        file,
        `## ${pkg.version} (${new Date().toDateString()})\n\n` +
        `${add}\n\n${log}`
      )
    }
  }
}

function scolaLicense () {
  if (watch) {
    return {}
  }

  return license({
    banner: {
      content: bannerTemplate
    },
    thirdParty: {
      output: {
        file: './LICENSE.md',
        template: (dependencies) => {
          return template(licenseTemplate)({ dependencies, pkg })
        }
      }
    }
  })
}

function scolaUglify () {
  if (watch) {
    return {}
  }

  return uglify()
}

module.exports = [
  { watch },
  resolve(),
  commonjs(),
  builtins(),
  css({
    extract: true,
    minimize: true
  }),
  json(),
  scolaBabel(),
  scolaUglify(),
  scolaLicense(),
  scolaChangelog()
]
