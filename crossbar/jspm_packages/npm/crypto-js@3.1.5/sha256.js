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
  (function(Math) {
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;
    var H = [];
    var K = [];
    (function() {
      function isPrime(n) {
        var sqrtN = Math.sqrt(n);
        for (var factor = 2; factor <= sqrtN; factor++) {
          if (!(n % factor)) {
            return false;
          }
        }
        return true;
      }
      function getFractionalBits(n) {
        return ((n - (n | 0)) * 0x100000000) | 0;
      }
      var n = 2;
      var nPrime = 0;
      while (nPrime < 64) {
        if (isPrime(n)) {
          if (nPrime < 8) {
            H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
          }
          K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));
          nPrime++;
        }
        n++;
      }
    }());
    var W = [];
    var SHA256 = C_algo.SHA256 = Hasher.extend({
      _doReset: function() {
        this._hash = new WordArray.init(H.slice(0));
      },
      _doProcessBlock: function(M, offset) {
        var H = this._hash.words;
        var a = H[0];
        var b = H[1];
        var c = H[2];
        var d = H[3];
        var e = H[4];
        var f = H[5];
        var g = H[6];
        var h = H[7];
        for (var i = 0; i < 64; i++) {
          if (i < 16) {
            W[i] = M[offset + i] | 0;
          } else {
            var gamma0x = W[i - 15];
            var gamma0 = ((gamma0x << 25) | (gamma0x >>> 7)) ^ ((gamma0x << 14) | (gamma0x >>> 18)) ^ (gamma0x >>> 3);
            var gamma1x = W[i - 2];
            var gamma1 = ((gamma1x << 15) | (gamma1x >>> 17)) ^ ((gamma1x << 13) | (gamma1x >>> 19)) ^ (gamma1x >>> 10);
            W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
          }
          var ch = (e & f) ^ (~e & g);
          var maj = (a & b) ^ (a & c) ^ (b & c);
          var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
          var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7) | (e >>> 25));
          var t1 = h + sigma1 + ch + K[i] + W[i];
          var t2 = sigma0 + maj;
          h = g;
          g = f;
          f = e;
          e = (d + t1) | 0;
          d = c;
          c = b;
          b = a;
          a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0;
        H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + c) | 0;
        H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0;
        H[5] = (H[5] + f) | 0;
        H[6] = (H[6] + g) | 0;
        H[7] = (H[7] + h) | 0;
      },
      _doFinalize: function() {
        var data = this._data;
        var dataWords = data.words;
        var nBitsTotal = this._nDataBytes * 8;
        var nBitsLeft = data.sigBytes * 8;
        dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
        dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
        dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
        data.sigBytes = dataWords.length * 4;
        this._process();
        return this._hash;
      },
      clone: function() {
        var clone = Hasher.clone.call(this);
        clone._hash = this._hash.clone();
        return clone;
      }
    });
    C.SHA256 = Hasher._createHelper(SHA256);
    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
  }(Math));
  return CryptoJS.SHA256;
}));
