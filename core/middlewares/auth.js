'use strict';

var jwt = require('jwt-simple');
var send = require('../helpers/send');
var errors = require('../messages/errors');
var config = require('../config/config').get();
var moment = require('moment');
var log4js = require('log4js');
var logger = log4js.getLogger('Tools.Swagger');

/**
 * Function used for creation of a new token by credentials
 * @param {object} credentials an object which contains password
 * and username in string format
 */
function createToken(credentials) {
  var payload = {
    sub: credentials.username + credentials.password,
    iat: moment().unix(),
    exp: moment().add(config.TOKEN_EXPIRATION_DAYS, 'days').unix(),
  };
  return jwt.encode(payload, config.JWT_SECRET);
}

/**
 * Middleware used for check the token by its expiration and
 * validation
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
function ensureAuthenticated(req, res, next) {
  logger.info('Ensure user authorized...');
  if (!req.headers.authorization) {
    return invalidToken();
  }
  var token = req.headers.authorization.split(' ')[1];
  try {
    var payload = jwt.decode(token, config.JWT_SECRET);
  } catch (e) {
    logger.error('Error decoding token');
    return invalidToken();
  }
  if (payload.exp <= moment().unix()) {
    return invalidToken();
  }
  req.credentials = payload.sub;
  next();

  function invalidToken() {
    const error = errors.invalidToken;
    send(res, error.code, { errors: error.txt });
  }
}

module.exports = {
  createToken: createToken,
  ensureAuthenticated: ensureAuthenticated
};
