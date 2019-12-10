const list = [
  'ASC',
  'BINARY',
  'CHAR',
  'CURRENT ROW',
  'DATE',
  'DATETIME',
  'DECIMAL',
  'DESC',
  'FOLLOWING',
  'JSON',
  'NCHAR',
  'PRECEDING',
  'RANGE',
  'ROWS',
  'SIGNED',
  'TIME',
  'UNBOUNDED FOLLOWING',
  'UNBOUNDED PRECEDING',
  'UNSIGNED'
]

export default [
  ...list.map((token) => {
    return {
      name: token,
      postfix: ` ${token}`
    }
  })
]
