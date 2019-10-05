export function core () {
  console.out = (type, box, data) => {
    if (type === 'fail' && !data.logged) {
      data.logged = true
      console.error(data)
    }
  }
}
