const throwsTrue = () => true

const isEqual = (a, e) => Object.is(a, e)

const isDeepEqual = (a, e) => {
  if (Object.is(a, e)) return true

  if (a instanceof Date && e instanceof Date) return a.getTime() === e.getTime()

  if (!a || !e || (typeof a !== 'object' && typeof e !== 'object')) return Object.is(a, e)

  if (a.prototype !== e.prototype) return false

  const ea = Object.entries(a).sort((a, b) => a[0].localeCompare(b[0]))
  const ee = Object.entries(e).sort((a, b) => a[0].localeCompare(b[0]))

  if (ea.length !== ee.length) return false

  if (!ee.every((eev, i) => ea[i][0] === eev[0])) return false

  if (!ee.every((eev, i) => isDeepEqual(ea[i][1], eev[1]))) return false

  return Object.is(typeof a, typeof e)
}

function isConstructor (f) {
  try {
    Reflect.construct(String, [], f)
  } catch (e) {
    return false
  }
  return true
}

const matchError = (e, matcher) => {
  if (Error.prototype.isPrototypeOf.call(Error, matcher) && e instanceof matcher) return true
  if (matcher instanceof RegExp && matcher.test(e.message)) return true
  if (typeof matcher === 'string' && e.message === matcher) return true
  // The isConstructor check is needed because classes are functions.
  if (typeof matcher === 'function' && !isConstructor(matcher) && matcher(e)) return true
  return false
}

export const AssertionError = class extends Error {
  constructor (actual, expected, ...args) {
    super(...args)
    this.expected = expected
    this.actual = actual
  }
}

export const assert = (pass, actual, expected, message = 'Assertion must pass.') => {
  if (!pass) throw new AssertionError(actual, expected, message)
}

export const ok = (value, message = 'Value must be truthy.') => {
  assert(!!value, value, true, message)
}

export const notOk = (value, message = 'Value must be falsy.') => {
  assert(!value, value, false, message)
}

export const equal = (actual, expected, message = 'Value must be equal') => {
  assert(isEqual(actual, expected), actual, expected, message)
}

export const notEqual = (actual, expected, message = 'Value must not be equal') => {
  assert(!isEqual(actual, expected), actual, expected, message)
}

export const deepEqual = (actual, expected, message = 'Value must be deep equal') => {
  assert(isDeepEqual(actual, expected), actual, expected, message)
}

export const notDeepEqual = (actual, expected, message = 'Value must not be deep equal') => {
  assert(!isDeepEqual(actual, expected), actual, expected, message)
}

export const throws = (operation, matcher = throwsTrue, message = 'Operation must throw an error') => {
  try { operation() } catch (e) { if (matchError(e, matcher)) return }
  throw new AssertionError('Error thrown', 'No error thrown', message)
}

export const rejects = async (actual, matcher = throwsTrue, message = 'Promise must reject') => {
  try { await actual } catch (e) { if (matchError(e, matcher)) return }
  throw new AssertionError('Promise rejected', 'Promise not rejected', message)
}
