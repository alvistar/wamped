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
    var MD5 = C_algo.MD5;
    var EvpKDF = C_algo.EvpKDF = Base.extend({
      cfg: Base.extend({
        keySize: 128 / 32,
        hasher: MD5,
        iterations: 1
      }),
      init: function(cfg) {
        this.cfg = this.cfg.extend(cfg);
      },
      compute: function(password, salt) {
        var cfg = this.cfg;
        var hasher = cfg.hasher.create();
        var derivedKey = WordArray.create();
        var derivedKeyWords = derivedKey.words;
        var keySize = cfg.keySize;
        var iterations = cfg.iterations;
        while (derivedKeyWords.length < keySize) {
          if (block) {
            hasher.update(block);
          }
          var block = hasher.update(password).finalize(salt);
          hasher.reset();
          for (var i = 1; i < iterations; i++) {
            block = hasher.finalize(block);
            hasher.reset();
          }
          derivedKey.concat(block);
        }
        derivedKey.sigBytes = keySize * 4;
        return derivedKey;
      }
    });
    C.EvpKDF = function(password, salt, cfg) {
      return EvpKDF.create(cfg).compute(password, salt);
    };
  }());
  return CryptoJS.EvpKDF;
}));
