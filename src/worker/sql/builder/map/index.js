import camel from 'lodash-es/camelCase'
import { Snippet } from '../snippet/snippet'

import dialectBase from './dialect'
import funcBase from './func'
import infixBase from './infix'
import postfixBase from './postfix'
import prefixBase from './prefix'
import snippetBase from './snippet'

const custom = {
  from: {
    object: Snippet,
    options: {
      infix: '',
      name: 'from',
      prefix: 'FROM '
    }
  },
  id: {
    object: Snippet,
    options: {
      escape: 'id',
      name: 'id'
    }
  },
  list: {
    object: Snippet,
    options: {
      parens: true
    }
  },
  query: {
    object: Snippet,
    options: {
      infix: ' ',
      name: 'query'
    }
  },
  value: {
    object: Snippet,
    options: {
      escape: 'value',
      name: 'value'
    }
  }
}

const dialect = Object.keys(dialectBase).reduce((master, group) => {
  return Object.keys(dialectBase[group]).reduce((object, name) => {
    return {
      ...object,
      [camel(name)]: {
        object: dialectBase[group][name]
      }
    }
  }, master)
}, {})

const func = funcBase.reduce((object, name) => {
  return {
    ...object,
    [camel(name)]: {
      object: Snippet,
      options: {
        name,
        parens: true,
        prefix: name
      }
    }
  }
}, {})

const infix = infixBase.reduce((object, { name, token }) => {
  return {
    ...object,
    [camel(name)]: {
      object: Snippet,
      options: {
        infix: ` ${token} `,
        name
      }
    }
  }
}, {})

const postfix = postfixBase.reduce((object, name) => {
  return {
    ...object,
    [camel(name)]: {
      object: Snippet,
      options: {
        name,
        postfix: ` ${name}`
      }
    }
  }
}, {})

const prefix = prefixBase.reduce((object, name) => {
  return {
    ...object,
    [camel(name)]: {
      object: Snippet,
      options: {
        name,
        prefix: `${name} `
      }
    }
  }
}, {})

const snippet = Object.keys(snippetBase).reduce((master, group) => {
  return Object.keys(snippetBase[group]).reduce((object, name) => {
    return {
      ...object,
      [camel(name)]: {
        object: snippetBase[group][name]
      }
    }
  }, master)
}, {})

export default {
  custom,
  dialect,
  snippet,
  infix,
  postfix,
  prefix,
  func
}
