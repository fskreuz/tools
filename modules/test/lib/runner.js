const noop = () => { }
const modules = []

const TestError = class extends Error {
  constructor (result, ...params) {
    super(...params)
    this.result = result
  }
}

const testConfig = {
  run: true,
  expectSuccess: true,
  getMessage: (testNumber, module, test) => `${testNumber} ${module} - ${test}`
}

const todoConfig = {
  run: true,
  expectSuccess: false,
  getMessage: (testNumber, module, test) => `${testNumber} # TODO ${module} - ${test}`
}

const skipConfig = {
  run: false,
  expectSuccess: false,
  getMessage: (testNumber, module, test) => `${testNumber} # SKIP ${module} - ${test}`
}

const diagnostics = ({ actual, expected, stack }) => {
  const block = []

  block.push(`Actual:\n\n${JSON.stringify(actual, null, 2)}`)
  block.push(`Expected:\n\n${JSON.stringify(expected, null, 2)}`)

  if (stack) block.push(`Stack:\n\n${stack}`)

  return block.join('\n\n').replace(/^(.*)/gm, '# $1')
}

const runner = async (modules) => {
  const length = modules.reduce((c, v) => c + v.tests.length, 0)
  let testNumber = 0
  let isFail = false
  const log = []

  log.push('TAP version 13')
  log.push(`1..${length}`)

  for (const module of modules) {
    for (const test of module.tests) {
      testNumber = testNumber + 1

      const testLine = test.getMessage(testNumber, module.name, test.name)

      if (test.run) {
        try {
          await test.callback()
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
  }

  if (isFail) throw new TestError(log.join('\n'), 'Test failed')

  return log.join('\n')
}

/**
 * Creates a test module.
 *
 * @param {string} moduleName The module's name.
 */
export const module = (moduleName) => {
  const testDefaults = {
    name: 'Test Defaults',
    run: true,
    expectSuccess: true,
    getMessage: (testNumber, module, test) => `${testNumber} ${module} - ${test}`,
    callback: noop
  }

  // Each module has its own instance of the tests array.
  const module = { name: moduleName, tests: [] }

  modules.push(module)

  return {
    /**
     * Defines a runnable test.
     *
     * @param {string} testName The name of the test.
     * @param {Function} callback The test body.
     */
    test: (testName, callback = noop) => {
      module.tests.push({ ...testDefaults, ...testConfig, callback, name: testName })
    },
    /**
     * Defines a test whose result is not expected to pass.
     *
     * @param {string} testName The name of the test.
     * @param {Function} callback The test body.
     */
    todo: (testName, callback = noop) => {
      module.tests.push({ ...testDefaults, ...todoConfig, callback, name: testName })
    },
    /**
     * Defines a test that will be skipped.
     *
     * @param {string} testName The name of the test.
     * @param {Function} callback The test body.
     */
    skip: (testName, callback = noop) => {
      module.tests.push({ ...testDefaults, ...skipConfig, callback, name: testName })
    }
  }
}

// Test setup happens in the same tick as the execution of the script.
// Test execution happens in some tick in the future.
setTimeout(async () => {
  try {
    const result = await runner(modules)
    console.log(result)
  } catch (e) {
    // In tools like Gulp, logs are sent to stderr when a non-zero is returned.
    // So we must log accordingly so that Gulp doesn't swallow the report.
    console.warn(e.result)

    // Ensures that the process exits as non-zero when run in Node.js.
    if (process) process.exitCode = 1
  }
})
