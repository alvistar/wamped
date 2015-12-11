/* */ 
"format cjs";
;
(function(root, factory) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  return CryptoJS.enc.Hex;
}));
