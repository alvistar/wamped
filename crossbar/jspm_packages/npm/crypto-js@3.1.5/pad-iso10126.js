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
  CryptoJS.pad.Iso10126 = {
    pad: function(data, blockSize) {
      var blockSizeBytes = blockSize * 4;
      var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
      data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
    },
    unpad: function(data) {
      var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
      data.sigBytes -= nPaddingBytes;
    }
  };
  return CryptoJS.pad.Iso10126;
}));
