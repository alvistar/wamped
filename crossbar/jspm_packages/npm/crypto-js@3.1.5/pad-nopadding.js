/* */ 
"format cjs";
;
(function(root, factory, undef) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'), require('./cipher-core'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core", "./cipher-core"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  CryptoJS.pad.NoPadding = {
    pad: function() {},
    unpad: function() {}
  };
  return CryptoJS.pad.NoPadding;
}));
