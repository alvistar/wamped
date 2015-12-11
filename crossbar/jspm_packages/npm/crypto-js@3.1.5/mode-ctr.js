/* */ 
"format cjs";
(function(process) {
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
    CryptoJS.mode.CTR = (function() {
      var CTR = CryptoJS.lib.BlockCipherMode.extend();
      var Encryptor = CTR.Encryptor = CTR.extend({processBlock: function(words, offset) {
          var cipher = this._cipher;
          var blockSize = cipher.blockSize;
          var iv = this._iv;
          var counter = this._counter;
          if (iv) {
            counter = this._counter = iv.slice(0);
            this._iv = undefined;
          }
          var keystream = counter.slice(0);
          cipher.encryptBlock(keystream, 0);
          counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0;
          for (var i = 0; i < blockSize; i++) {
            words[offset + i] ^= keystream[i];
          }
        }});
      CTR.Decryptor = Encryptor;
      return CTR;
    }());
    return CryptoJS.mode.CTR;
  }));
})(require('process'));
