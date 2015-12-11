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
  (function() {
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var C_enc = C.enc;
    var Utf8 = C_enc.Utf8;
    var C_algo = C.algo;
    var HMAC = C_algo.HMAC = Base.extend({
      init: function(hasher, key) {
        hasher = this._hasher = new hasher.init();
        if (typeof key == 'string') {
          key = Utf8.parse(key);
        }
        var hasherBlockSize = hasher.blockSize;
        var hasherBlockSizeBytes = hasherBlockSize * 4;
        if (key.sigBytes > hasherBlockSizeBytes) {
          key = hasher.finalize(key);
        }
        key.clamp();
        var oKey = this._oKey = key.clone();
        var iKey = this._iKey = key.clone();
        var oKeyWords = oKey.words;
        var iKeyWords = iKey.words;
        for (var i = 0; i < hasherBlockSize; i++) {
          oKeyWords[i] ^= 0x5c5c5c5c;
          iKeyWords[i] ^= 0x36363636;
        }
        oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
        this.reset();
      },
      reset: function() {
        var hasher = this._hasher;
        hasher.reset();
        hasher.update(this._iKey);
      },
      update: function(messageUpdate) {
        this._hasher.update(messageUpdate);
        return this;
      },
      finalize: function(messageUpdate) {
        var hasher = this._hasher;
        var innerHash = hasher.finalize(messageUpdate);
        hasher.reset();
        var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));
        return hmac;
      }
    });
  }());
}));
