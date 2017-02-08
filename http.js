var http = require('http')
var url = require('url')
var spawnSync = require('child_process').spawnSync

/**
 * Send an HTTP request to the server using a URL,
 * GET, POST or DELETE verb, & optional JSON data
 */
module.exports = function (urlString, method, data) {
  var options = url.parse(urlString)
  options.method = method || 'GET'

  if (typeof data !== 'string') {
    data = JSON.stringify(data)
  }

  // Need to specify the content length or chromedriver
  // has a bad time
  options.headers = {
    'content-length': data.length
  }

  // Do the request and turn it into a promise
  return new Promise((resolve, reject) => {
    var req = http.request(options, res => {
      var responseBody = ''

      res.setEncoding('utf8')

      res.on('data', chunk => {
        responseBody += chunk
      })

      res.on('error', e => reject(e))

      res.on('end', () => resolve(responseBody))
    })
    req.write(data)
    req.end()
  })
  .then(body => {
    try {
      return JSON.parse(body)
    } catch (e) {
      throw new Error('Couldn\'t decode JSON:\n'+body)
    }
  })
}

/**
 * Allow sync HTTP requests so we can make a single sync function map to
 * a sync webdriver request. Blocking shouldn't matter as there's only one test
 * script running per process.
 */
module.exports.sync = function (url, method, data) {
  // Call this file's main as a sync process
  var node = process.argv[0]
  var proc = spawnSync(node, [__filename, url, method, JSON.stringify(data)])

  if (proc.error) {
    throw proc.error
  }

  var stdErr = proc.stderr.toString()
  if (stdErr) {
    throw stdErr
  }

  return JSON.parse(proc.stdout.toString())
}

/**
 * Main entry point
 * If this file is run as main, make a request with the cli args
 */
if (require.main === module) {
  var args = process.argv.splice(2)

  // Wait for the request to return and write to std out
  module.exports(...args).then(
    result => {
      process.stdout.write(JSON.stringify(result))
      process.exit()
    }
  ).catch(e => {
    process.stderr.write(String(e))
    process.exit(1)
  })
}
