/* */ 
function Transports() {
  this._repository = {};
}
Transports.prototype.register = function(name, factory) {
  this._repository[name] = factory;
};
Transports.prototype.isRegistered = function(name) {
  return this._repository[name] ? true : false;
};
Transports.prototype.get = function(name) {
  if (this._repository[name] !== undefined) {
    return this._repository[name];
  } else {
    throw "no such transport: " + name;
  }
};
Transports.prototype.list = function() {
  var items = [];
  for (var name in this._repository) {
    items.push(name);
  }
  return items;
};
var _transports = new Transports();
var websocket = require('./transport/websocket');
_transports.register("websocket", websocket.Factory);
var longpoll = require('./transport/longpoll');
_transports.register("longpoll", longpoll.Factory);
var rawsocket = require('./transport/rawsocket');
_transports.register("rawsocket", rawsocket.Factory);
exports.transports = _transports;
