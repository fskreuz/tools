import { module, ok, equal, notEqual, deepEqual, notDeepEqual, throws, rejects } from './lib.js'

const { test } = module('test/harness')

test('equal', () => {
  equal(1, 1, 'numbers')
  equal('a', 'a', 'string')
  equal('', '', 'empty string')
  equal(true, true, 'true')
  equal(false, false, 'false')
  equal(null, null, 'null')
  equal(NaN, NaN, 'NaN')
  equal(NaN, Number.NaN, 'NaN')
  equal(0, 0, 'zero')
  equal(undefined, undefined, 'undefined')

  const a = {}
  const b = []
  const c = () => { }
  const d = /foo/
  const e = new Date()

  equal(a, a, 'object')
  equal(b, b, 'array')
  equal(c, c, 'function')
  equal(d, d, 'regex')
  equal(e, e, 'date')
})

test('notEqual', () => {
  notEqual(1, 2, 'numbers')
  notEqual('a', 'b', 'string')
  notEqual('', 'a', 'empty string')
  notEqual(true, false, 'boolean')
  notEqual(null, undefined, 'null')
  notEqual(undefined, null, 'undefined')
  notEqual(+0, -0, 'zeros mixed')
  notEqual(Symbol('foo'), Symbol('foo'), 'symbol')
  notEqual({}, {}, 'object')
  notEqual([], [], 'array')
  notEqual(() => { }, () => { }, 'function')
  notEqual(/foo/, /foo/, 'regex')
  notEqual(new Date(), new Date(), 'date')
})

test('deep equal', () => {
  deepEqual({}, {})
  deepEqual({ foo: 1 }, { foo: 1 })
  deepEqual({ foo: { bar: 1 } }, { foo: { bar: 1 } })
  deepEqual([], [])
  deepEqual([1, 2, 3], [1, 2, 3])
  deepEqual(['a', 'b', 'c'], ['a', 'b', 'c'])
  deepEqual([{ foo: 1 }, { bar: 2 }], [{ foo: 1 }, { bar: 2 }])
  deepEqual([{ foo: { bar: 1 } }, { baz: { qux: 2 } }], [{ foo: { bar: 1 } }, { baz: { qux: 2 } }])
  deepEqual([[[1, 2, 3]]], [[[1, 2, 3]]])
})

test('notDeepEqual', () => {
  notDeepEqual({ foo: { bar: 1 } }, { baz: { qux: 2 } })
})

test('throws, throw', () => {
  throws(_ => { throw new Error('fail this test') })
})

test('throws, no throw', () => {
  let hit = false
  try {
    throws(_ => { /* Do nothing */ })
  } catch (e) {
    hit = true
  }
  ok(hit)
})

test('throws, matcher true', () => {
  throws(
    _ => { throw new Error('fail this test') },
    e => e.message === 'fail this test'
  )
})

test('throws, matcher false', () => {
  let hit = false
  try {
    throws(
      _ => { throw new Error('fail this test') },
      e => e.message === 'wut?'
    )
  } catch (e) {
    hit = true
  }
  ok(hit)
})

test('throws, constructor matcher', () => {
  class CustomError extends Error { }
  throws(_ => { throw new CustomError('fail this test') }, CustomError)
})

test('throws, RegExp matcher', () => {
  throws(_ => { throw new Error('fail this test') }, /^fail this test$/)
})

test('throws, string matcher', () => {
  throws(_ => { throw new Error('fail this test') }, 'fail this test')
})

test('rejects', async () => {
  await rejects(Promise.reject(new Error('friendzoned')))
})

test('rejects fail', async () => {
  let hit = false
  try {
    await rejects(Promise.resolve())
  } catch (e) {
    hit = true
  }
  ok(hit)
})

test('rejects, matcher true', async () => {
  await rejects(
    Promise.reject(new Error('friendzoned')),
    e => e.message === 'friendzoned'
  )
})

test('rejects, matcher false', async () => {
  let hit = false
  try {
    await rejects(
      Promise.reject(new Error('friendzoned')),
      e => e.message === 'seenzoned'
    )
  } catch (e) {
    hit = true
  }
  ok(hit)
})

test('rejects, constructor matcher', async () => {
  class CustomError extends Error { }
  await rejects(Promise.reject(new CustomError('friendzoned')), CustomError)
})

test('rejects, RegExp matcher', async () => {
  await rejects(Promise.reject(new Error('friendzoned')), /^friendzoned$/)
})

test('rejects, string matcher', async () => {
  await rejects(Promise.reject(new Error('friendzoned')), 'friendzoned')
})
