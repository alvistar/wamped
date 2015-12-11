/* */ 
"format cjs";
;
(function(root, factory, undef) {
  if (typeof exports === "object") {
    module.exports = exports = factory(require('./core'), require('./sha256'));
  } else if (typeof define === "function" && define.amd) {
    define(["./core", "./sha256"], factory);
  } else {
    factory(root.CryptoJS);
  }
}(this, function(CryptoJS) {
  (function() {
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var C_algo = C.algo;
    var SHA256 = C_algo.SHA256;
    var SHA224 = C_algo.SHA224 = SHA256.extend({
      _doReset: function() {
        this._hash = new WordArray.init([0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4]);
      },
      _doFinalize: function() {
        var hash = SHA256._doFinalize.call(this);
        hash.sigBytes -= 4;
        return hash;
      }
    });
    C.SHA224 = SHA256._createHelper(SHA224);
    C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
  }());
  return CryptoJS.SHA224;
}));
