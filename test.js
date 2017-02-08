var childProcess = require('child_process')

var http = require('./http').sync
var path = require('path')
var url = require('url')

class Driver {
  /**
   * Create a new driver instance & start it
   */
  static start (driverBin, port) {
    var driver = new Driver('http://localhost:' + port)
    driver.start(driverBin, port)
    return driver
  }

  constructor (host) {
    this.host = host
  }

  /**
   * Start the driver as a child process
   */
  start (driverBin, port) {
    this.process = childProcess.spawn(driverBin, ['--port=' + port])
  }

  /**
   * HTTP request to create a new session, then return a new session instance with created obj
   */
  createSession () {
    return new Session(
      this,
      this.request(
        '/session',
        'POST',
        {
          // Chromedriver needs this, can be empty though:
          desiredCapabilities: {}
        }
      )
    )
  }

  /**
   * Make a request to the driver endpoint, given a path
   */
  request (path, method, data) {
    var reqUrl = url.resolve(this.host, path)

    return http(reqUrl, method, data)
  }
}


class Session {
  /**
   * Create a new drver & session & return it
   */
  static start (driver, port = 4444) {
    // TODO: Keep map of signatures -> Driver instances
    if (!Session.driver) {
      Session.driver = Driver.start(driver, port)
    }

   return Session.driver.createSession()
  }

  constructor (driver, session) {
    this.driver = driver
    if (!session.sessionId) {
      throw 'No session Id:\n' + JSON.stringify(session)
    }
    this.path = path.join('session', session.sessionId)
  }

  /**
   * Make a driver request to this session or one of its child endpoints
   */
  request (part, method, data) {
    return this.driver.request(path.join(this.path, part), method, data)
  }

  /**
   * Set the page URL
   */
  go (url) {
    this.request('url', 'POST', { url })
  }

  /**
   * End the session (&process)
   */
  close () {
    this.request('', 'DELETE')
    // TODO: Only kill if there are no more sessions
    this.driver.process.kill()
  }
}

module.exports = {
  Session, Driver
}
