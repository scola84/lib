import camelCase from 'lodash/camelCase.js'
import { Mysql } from './mysql.js'
import { Postgresql } from './postgresql.js'

const client = {
  Mysql,
  Postgresql
}

export const map = Object
  .keys(client)
  .reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: client[name]
      }
    }
  }, {})

export default client
