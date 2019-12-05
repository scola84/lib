/* eslint-disable no-console */

export function log (config = {}) {
  if (config.fail === true) {
    console.fail = (id, box, error) => {
      console.log(id, 'fail')

      if (error.logged !== true) {
        error.logged = true
        console.error(error)
      }
    }
  }

  if (config.decide === true) {
    console.decide = (id, box, data, decided) => {
      console.log(id, 'decide', decided)
    }
  }

  if (config.filter === true) {
    console.filter = (id, box, data, filtered) => {
      console.log(id, 'filter', filtered)
    }
  }

  if (config.merge === true) {
    console.merge = (id, box, data, merged) => {
      console.log(id, 'merge', merged)
    }
  }

  if (config.pass === true) {
    console.pass = (id) => {
      console.log(id, 'pass')
    }
  }
}
