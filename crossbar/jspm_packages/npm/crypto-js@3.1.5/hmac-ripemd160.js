/* */ 
"format cjs";
;
(function(root, factory, undef) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'), require('./ripemd160'), require('./hmac'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core", "./ripemd160", "./hmac"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  return CryptoJS.HmacRIPEMD160;
}));
