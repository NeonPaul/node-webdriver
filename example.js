var Session = require('./test').Session
var geckodriver = require.resolve('./geckodriver')

var browser = Session.start(geckodriver)

browser.go('http://example.com')

setTimeout(() => browser.close(), 2000)
