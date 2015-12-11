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
  CryptoJS.pad.AnsiX923 = {
    pad: function(data, blockSize) {
      var dataSigBytes = data.sigBytes;
      var blockSizeBytes = blockSize * 4;
      var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;
      var lastBytePos = dataSigBytes + nPaddingBytes - 1;
      data.clamp();
      data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
      data.sigBytes += nPaddingBytes;
    },
    unpad: function(data) {
      var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
      data.sigBytes -= nPaddingBytes;
    }
  };
  return CryptoJS.pad.Ansix923;
}));
