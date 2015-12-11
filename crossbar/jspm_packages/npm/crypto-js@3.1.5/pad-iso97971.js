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
  CryptoJS.pad.Iso97971 = {
    pad: function(data, blockSize) {
      data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));
      CryptoJS.pad.ZeroPadding.pad(data, blockSize);
    },
    unpad: function(data) {
      CryptoJS.pad.ZeroPadding.unpad(data);
      data.sigBytes--;
    }
  };
  return CryptoJS.pad.Iso97971;
}));
