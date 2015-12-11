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
  CryptoJS.pad.ZeroPadding = {
    pad: function(data, blockSize) {
      var blockSizeBytes = blockSize * 4;
      data.clamp();
      data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
    },
    unpad: function(data) {
      var dataWords = data.words;
      var i = data.sigBytes - 1;
      while (!((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
        i--;
      }
      data.sigBytes = i + 1;
    }
  };
  return CryptoJS.pad.ZeroPadding;
}));
