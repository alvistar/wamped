/* */ 
"format cjs";
;
(function(root, factory, undef) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'), require('./sha256'), require('./sha224'), require('./hmac'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core", "./sha256", "./sha224", "./hmac"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  return CryptoJS.HmacSHA224;
}));
