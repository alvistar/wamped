/* */ 
"format cjs";
;
(function(root, factory, undef) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'), require('./md5'), require('./hmac'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core", "./md5", "./hmac"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  return CryptoJS.HmacMD5;
}));
