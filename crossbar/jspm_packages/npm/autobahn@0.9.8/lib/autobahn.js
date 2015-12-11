/* */ 
require('./polyfill');
var pjson = require('../package.json!systemjs-json');
var when = require('when');
if ('AUTOBAHN_DEBUG' in global && AUTOBAHN_DEBUG) {
  require('when/monitor/console');
  if ('console' in global) {
    console.log("AutobahnJS debug enabled");
  }
}
var util = require('./util');
var log = require('./log');
var session = require('./session');
var connection = require('./connection');
var configure = require('./configure');
var persona = require('./auth/persona');
var cra = require('./auth/cra');
exports.version = pjson.version;
exports.transports = configure.transports;
exports.Connection = connection.Connection;
exports.Session = session.Session;
exports.Invocation = session.Invocation;
exports.Event = session.Event;
exports.Result = session.Result;
exports.Error = session.Error;
exports.Subscription = session.Subscription;
exports.Registration = session.Registration;
exports.Publication = session.Publication;
exports.auth_persona = persona.auth;
exports.auth_cra = cra;
exports.when = when;
exports.util = util;
exports.log = log;
