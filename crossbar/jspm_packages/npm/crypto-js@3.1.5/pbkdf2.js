/* */ 
"format cjs";
;
(function(root, factory, undef) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'), require('./sha1'), require('./hmac'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core", "./sha1", "./hmac"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  (function() {
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var WordArray = C_lib.WordArray;
    var C_algo = C.algo;
    var SHA1 = C_algo.SHA1;
    var HMAC = C_algo.HMAC;
    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
      cfg: Base.extend({
        keySize: 128 / 32,
        hasher: SHA1,
        iterations: 1
      }),
      init: function(cfg) {
        this.cfg = this.cfg.extend(cfg);
      },
      compute: function(password, salt) {
        var cfg = this.cfg;
        var hmac = HMAC.create(cfg.hasher, password);
        var derivedKey = WordArray.create();
        var blockIndex = WordArray.create([0x00000001]);
        var derivedKeyWords = derivedKey.words;
        var blockIndexWords = blockIndex.words;
        var keySize = cfg.keySize;
        var iterations = cfg.iterations;
        while (derivedKeyWords.length < keySize) {
          var block = hmac.update(salt).finalize(blockIndex);
          hmac.reset();
          var blockWords = block.words;
          var blockWordsLength = blockWords.length;
          var intermediate = block;
          for (var i = 1; i < iterations; i++) {
            intermediate = hmac.finalize(intermediate);
            hmac.reset();
            var intermediateWords = intermediate.words;
            for (var j = 0; j < blockWordsLength; j++) {
              blockWords[j] ^= intermediateWords[j];
            }
          }
          derivedKey.concat(block);
          blockIndexWords[0]++;
        }
        derivedKey.sigBytes = keySize * 4;
        return derivedKey;
      }
    });
    C.PBKDF2 = function(password, salt, cfg) {
      return PBKDF2.create(cfg).compute(password, salt);
    };
  }());
  return CryptoJS.PBKDF2;
}));
