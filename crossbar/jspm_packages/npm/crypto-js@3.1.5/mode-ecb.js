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
    CryptoJS.mode.ECB = (function() {
      var ECB = CryptoJS.lib.BlockCipherMode.extend();
      ECB.Encryptor = ECB.extend({processBlock: function(words, offset) {
          this._cipher.encryptBlock(words, offset);
        }});
      ECB.Decryptor = ECB.extend({processBlock: function(words, offset) {
          this._cipher.decryptBlock(words, offset);
        }});
      return ECB;
    }());
    return CryptoJS.mode.ECB;
  }));
})(require('process'));
