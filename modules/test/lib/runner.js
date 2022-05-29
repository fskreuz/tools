const noop = () => { }
const tests = []

const TestError = class extends Error {
  constructor (result, ...params) {
    super(...params)
    this.result = result
  }
}

const testDefaults = {
  name: 'Test Defaults',
  run: true,
  expectSuccess: true,
  getMessage: (testNumber, test) => `${testNumber} ${test}`,
  callback: noop
}

const testConfig = {
  run: true,
  expectSuccess: true,
  getMessage: (testNumber, test) => `${testNumber} ${test}`
}

const todoConfig = {
  run: true,
  expectSuccess: false,
  getMessage: (testNumber, test) => `${testNumber} # TODO ${test}`
}

const skipConfig = {
  run: false,
  expectSuccess: false,
  getMessage: (testNumber, test) => `${testNumber} # SKIP ${test}`
}

const diagnostics = ({ actual, expected, stack }) => {
  const block = []

  block.push(`Actual:\n\n${JSON.stringify(actual, null, 2)}`)
  block.push(`Expected:\n\n${JSON.stringify(expected, null, 2)}`)

  if (stack) block.push(`Stack:\n\n${stack}`)

  return block.join('\n\n').replace(/^(.*)/gm, '# $1')
}

const timeout = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error('Test timed out.'))
  }, 3000)
})

const runner = async (tests) => {
  let isFail = false
  const log = []

  log.push('TAP version 13')
  log.push(`1..${tests.length}`)

  for (const [index, test] of tests.entries()) {
    const testLine = test.getMessage(index + 1, test.name)

    if (test.run) {
      try {
        await Promise.race([test.callback(), timeout()])
        log.push(`ok ${testLine}`)
      } catch (error) {
        log.push(`not ok ${testLine}\n${diagnostics(error)}`)

        if (test.expectSuccess) {
          isFail = true
        }
      }
    } else {
      log.push(`ok ${testLine}`)
    }
  }

  if (isFail) throw new TestError(log.join('\n'), 'Test failed')

  return log.join('\n')
}

/**
 * Defines a runnable test.
 *
 * @param {string} name The name of the test.
 * @param {Function} callback The test body.
 */
export const test = (name, callback = noop) => {
  tests.push({ ...testDefaults, ...testConfig, name, callback })
}

/**
 * Defines a test whose result is not expected to pass.
 *
 * @param {string} name The name of the test.
 * @param {Function} callback The test body.
 */
export const todo = (name, callback = noop) => {
  tests.push({ ...testDefaults, ...todoConfig, name, callback })
}

/**
 * Defines a test that will be skipped.
 *
 * @param {string} name The name of the test.
 * @param {Function} callback The test body.
 */
export const skip = (name, callback = noop) => {
  tests.push({ ...testDefaults, ...skipConfig, name, callback })
}

// Test setup happens in the same tick as the execution of the script.
// Test execution happens in some tick in the future.
setTimeout(async () => {
  try {
    const result = await runner(tests)
    console.log(result)
  } catch (e) {
    // In tools like Gulp, logs are sent to stderr when a non-zero is returned.
    // So we must log accordingly so that Gulp doesn't swallow the report.
    console.warn(e.result)

    // Ensures that the process exits as non-zero when run in Node.js.
    if (process) process.exitCode = 1
  }
})
