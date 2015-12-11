/* */ 
"format cjs";
;
(function(root, factory, undef) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'), require('./enc-base64'), require('./md5'), require('./evpkdf'), require('./cipher-core'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  (function() {
    var C = CryptoJS;
    var C_lib = C.lib;
    var StreamCipher = C_lib.StreamCipher;
    var C_algo = C.algo;
    var RC4 = C_algo.RC4 = StreamCipher.extend({
      _doReset: function() {
        var key = this._key;
        var keyWords = key.words;
        var keySigBytes = key.sigBytes;
        var S = this._S = [];
        for (var i = 0; i < 256; i++) {
          S[i] = i;
        }
        for (var i = 0,
            j = 0; i < 256; i++) {
          var keyByteIndex = i % keySigBytes;
          var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;
          j = (j + S[i] + keyByte) % 256;
          var t = S[i];
          S[i] = S[j];
          S[j] = t;
        }
        this._i = this._j = 0;
      },
      _doProcessBlock: function(M, offset) {
        M[offset] ^= generateKeystreamWord.call(this);
      },
      keySize: 256 / 32,
      ivSize: 0
    });
    function generateKeystreamWord() {
      var S = this._S;
      var i = this._i;
      var j = this._j;
      var keystreamWord = 0;
      for (var n = 0; n < 4; n++) {
        i = (i + 1) % 256;
        j = (j + S[i]) % 256;
        var t = S[i];
        S[i] = S[j];
        S[j] = t;
        keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
      }
      this._i = i;
      this._j = j;
      return keystreamWord;
    }
    C.RC4 = StreamCipher._createHelper(RC4);
    var RC4Drop = C_algo.RC4Drop = RC4.extend({
      cfg: RC4.cfg.extend({drop: 192}),
      _doReset: function() {
        RC4._doReset.call(this);
        for (var i = this.cfg.drop; i > 0; i--) {
          generateKeystreamWord.call(this);
        }
      }
    });
    C.RC4Drop = StreamCipher._createHelper(RC4Drop);
  }());
  return CryptoJS.RC4;
}));
