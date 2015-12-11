/* */ 
var unhandledRejections = require('../lib/decorators/unhandledRejection');
var PromiseConstructor = unhandledRejections(require('../lib/Promise'));
module.exports = typeof global != 'undefined' ? (global.Promise = PromiseConstructor) : typeof self != 'undefined' ? (self.Promise = PromiseConstructor) : PromiseConstructor;
