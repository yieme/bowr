/* Package Server to enable client side use of packages by name and version
 *
 * @copyright (C) 2015 by Yieme
 * @license   MIT
*/

'use strict';

var os            = require('os')
var Dias          = require('dias')
var pkg           = require('./package.json')
var Logger        = require('ceo-logger')
var middleServer  = require('middle-server')
var proxy         = require('proxy-cache-file')
var apiDoc        = require('./modules/api-doc')
var apiLatest     = require('./modules/api-latest')
var apiPackage    = require('./modules/api-package')
var compression   = require('compression')()
var LRU           = require('lru-cache')
var prefix        = process.env.PREFIX || '/'
var prefixLength  = prefix.length
var cache         = LRU()
var favicon       = require('serve-favicon')(__dirname + '/favicon.ico')
var pakrStatic    = process.env.STATIC_URL || 'http://pakr-static.yie.me'
var cacheDur      = (process.env.NODE_ENV == 'production') ? 60 * 60 * 1000 : 15 * 1000 // 1 hour in production, 15 seconds dev
var packages    = require('./bower-prep1.json')
//  packageDataUrl:   'https://pub.firebaseio.com/cdn',
//if (pakrStatic) packageList.push(pakrStatic + '/pakr.json')
// {"name":"10digit-geo","url":"git://github.com/10digit/geo.git","hits":4561}

Dias(function(dias) {
  var serverId      = { id: pkg.name, ver: pkg.version, node: dias.node, pid: process.pid }
  var paas          = (dias.paas) ? 'paas/' + dias.paas + ' host/' + dias.host : undefined
  var ua            = process.env.USERAGENT || dias.useragent || paas
  if (ua) serverId.ua = ua
  var logVariables  = { server: serverId }
  var logLevel      = (process.env.DEBUG) ? 'debug' : undefined
  logLevel          = logLevel || process.env.LOG_LEVEL
  var logger        = new Logger(logVariables, false, logLevel)
  var config        = {
    dir:        './tmp',
    logger:     logger,
  }
  proxy(config)
  apiLatest.init({ packages: packages })
  apiPackage.init({ packages: packages })

  function extractPackageVersionFile(url) {
    var atPos = url.indexOf('@')
    var name = url.substr(0,atPos)
    var url = url.substr(atPos+1, url.length - atPos)
    var slash = url.indexOf('/')
    var version = url.substr(0,slash)
    var file = url.substr(slash+1, url.length - slash)
    return { name: name, version: version, file: file }
  }

  function respondWithData(req, res, data) {
    if (data.redirect) {
      logger.info(req.url + ', redirect: ' + data.redirect)
      res.set('Cache-Control', 'public, max-age=' + cacheDur)
      res.redirect(307, data.redirect)
      return
    }
    var headers = data.headers
    var stream  = data.stream
    var body    = data.body
    if (headers.type) res.set('Content-Type', headers.type)
    res.set('Cache-Control', 'public, max-age=' + cacheDur)
    if (stream) {
      stream.pipe(res)
      logger.debug(headers.code + ' ' + req.url  + ', type: ' + headers.type + ', stream')
      return
    } else if (headers.code && headers.code >= 400) {
      res.status(headers.code).send(body)
      logger.info(headers.code  + ' ' + req.url  + ', type: ' + headers.type + ', length: ' + data.body.length)
    } else {
      res.send(body)
      logger.debug(headers.code + ' ' + req.url  + ', type: ' + headers.type + ', length: ' + data.body.length)
    }
  }

  function packageMiddle(req, res, next) {
    if (req.url.indexOf(prefix) != 0) return next() // prefix must match
    req.url = req.url.replace(prefix, '')  // remove prefix
    var cachedData = cache.get(req.url)
    if (cachedData) {
      logger.debug('LRU Cached: ' + req.url)
      return respondWithData(req, res, JSON.parse(cachedData))
    }

    var parts = extractPackageVersionFile(req.url)
    var pack  = packages[parts.name]
    if (!pack) {
      return respondWithData(req, res, { headers: { code: 404 }, body: '' })
    }
    req.url = pack.url + '/' + parts.version + '/' + parts.file

    proxy(req, function proxyResults(err, data) {
      if (err) return next(err)
      respondWithData(req, res, data)
      if (!data.stream) {
        logger.debug('LRU Cache: ' + req.url)
        cache.set(req.url, JSON.stringify(data))
      }
    })
  }

  function logError(err, req, res, next) {
    logger.debug('logError:' + err)
    if ('string' == typeof err) {
      if (err.indexOf('Not Found') >= 0) {
        logger.info(err + ' logError')
        res.status(404).send({ code: 404, error: err.replace(': /', ': ') })
        return
      } else {
        logger.warn(err)
      }
    } else {
      logger.error(err)
      if (err.stack) logger.error(err.stack)
    }
    res.status(500).send({ code: 500, error: err.message || err })
    next(err)
  }

  process.on('uncaughtException', function (err) {
    logger.error('uncaughtException')
    logger.error(err)
    logger.error(err.stack)
  })

  var app = middleServer({
    logger: logger,
    pre:    [
      compression,
      middleServer.log,
      favicon,
      apiDoc,
      apiLatest,
      apiPackage
    ],
    post:   [
      packageMiddle
    ]
  })
  app.use(logError)
  app.locals._log = logger
})
