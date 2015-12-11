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
    CryptoJS.mode.CFB = (function() {
      var CFB = CryptoJS.lib.BlockCipherMode.extend();
      CFB.Encryptor = CFB.extend({processBlock: function(words, offset) {
          var cipher = this._cipher;
          var blockSize = cipher.blockSize;
          generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
          this._prevBlock = words.slice(offset, offset + blockSize);
        }});
      CFB.Decryptor = CFB.extend({processBlock: function(words, offset) {
          var cipher = this._cipher;
          var blockSize = cipher.blockSize;
          var thisBlock = words.slice(offset, offset + blockSize);
          generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
          this._prevBlock = thisBlock;
        }});
      function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
        var iv = this._iv;
        if (iv) {
          var keystream = iv.slice(0);
          this._iv = undefined;
        } else {
          var keystream = this._prevBlock;
        }
        cipher.encryptBlock(keystream, 0);
        for (var i = 0; i < blockSize; i++) {
          words[offset + i] ^= keystream[i];
        }
      }
      return CFB;
    }());
    return CryptoJS.mode.CFB;
  }));
})(require('process'));
