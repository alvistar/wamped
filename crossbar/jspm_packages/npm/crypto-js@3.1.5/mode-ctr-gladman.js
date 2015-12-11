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
    CryptoJS.mode.CTRGladman = (function() {
      var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();
      function incWord(word) {
        if (((word >> 24) & 0xff) === 0xff) {
          var b1 = (word >> 16) & 0xff;
          var b2 = (word >> 8) & 0xff;
          var b3 = word & 0xff;
          if (b1 === 0xff) {
            b1 = 0;
            if (b2 === 0xff) {
              b2 = 0;
              if (b3 === 0xff) {
                b3 = 0;
              } else {
                ++b3;
              }
            } else {
              ++b2;
            }
          } else {
            ++b1;
          }
          word = 0;
          word += (b1 << 16);
          word += (b2 << 8);
          word += b3;
        } else {
          word += (0x01 << 24);
        }
        return word;
      }
      function incCounter(counter) {
        if ((counter[0] = incWord(counter[0])) === 0) {
          counter[1] = incWord(counter[1]);
        }
        return counter;
      }
      var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({processBlock: function(words, offset) {
          var cipher = this._cipher;
          var blockSize = cipher.blockSize;
          var iv = this._iv;
          var counter = this._counter;
          if (iv) {
            counter = this._counter = iv.slice(0);
            this._iv = undefined;
          }
          incCounter(counter);
          var keystream = counter.slice(0);
          cipher.encryptBlock(keystream, 0);
          for (var i = 0; i < blockSize; i++) {
            words[offset + i] ^= keystream[i];
          }
        }});
      CTRGladman.Decryptor = Encryptor;
      return CTRGladman;
    }());
    return CryptoJS.mode.CTRGladman;
  }));
})(require('process'));
