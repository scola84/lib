import { Query } from '../../../../src/server/helpers/sql/query'
import { expect } from 'chai'

describe('Query', () => {
  describe('should create', () => {
    it('a delete query', aDeleteQuery)
    it('a select query', aSelectQuery)
    it('an insert query', anInsertQuery)
    it('an update query', anUpdateQuery)
  })
})

function aDeleteQuery (): void {
  const query = new Query('object_table', {
    column1: 'column1',
    column2: 'column2',
    object_id: 1
  })

  const cleanQuery = query
    .delete()
    .trim()
    .replace(/\n\s*/gu, ' ')

  expect(cleanQuery).equal('DELETE FROM object_table WHERE object_id = $(object_id)')
}

function aSelectQuery (): void {
  const query = new Query('object_table', {
    column1: 'column1',
    column2: 'column2',
    object_id: 1
  })

  const cleanQuery = query
    .select()
    .trim()
    .replace(/\n\s*/gu, ' ')

  expect(cleanQuery).equal('SELECT column1,column2,object_id FROM object_table WHERE object_id = $(object_id)')
}

function anInsertQuery (): void {
  const query = new Query('object_table', {
    column1: 'column1',
    column2: 'column2'
  })

  const cleanQuery = query
    .insert()
    .trim()
    .replace(/\n\s*/gu, ' ')

  expect(cleanQuery).equal('INSERT INTO object_table (column1,column2) VALUES ($(column1),$(column2))')
}

function anUpdateQuery (): void {
  const query = new Query('object_table', {
    column1: 'column1',
    column2: 'column2',
    object_id: 1
  })

  const cleanQuery = query
    .update()
    .trim()
    .replace(/\n\s*/gu, ' ')

  expect(cleanQuery).equal('UPDATE object_table SET column1 = $(column1),column2 = $(column2) WHERE object_id = $(object_id)')
}
