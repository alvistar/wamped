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
    var WordArray = C_lib.WordArray;
    var C_enc = C.enc;
    var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
      stringify: function(wordArray) {
        var words = wordArray.words;
        var sigBytes = wordArray.sigBytes;
        var utf16Chars = [];
        for (var i = 0; i < sigBytes; i += 2) {
          var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
          utf16Chars.push(String.fromCharCode(codePoint));
        }
        return utf16Chars.join('');
      },
      parse: function(utf16Str) {
        var utf16StrLength = utf16Str.length;
        var words = [];
        for (var i = 0; i < utf16StrLength; i++) {
          words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
        }
        return WordArray.create(words, utf16StrLength * 2);
      }
    };
    C_enc.Utf16LE = {
      stringify: function(wordArray) {
        var words = wordArray.words;
        var sigBytes = wordArray.sigBytes;
        var utf16Chars = [];
        for (var i = 0; i < sigBytes; i += 2) {
          var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
          utf16Chars.push(String.fromCharCode(codePoint));
        }
        return utf16Chars.join('');
      },
      parse: function(utf16Str) {
        var utf16StrLength = utf16Str.length;
        var words = [];
        for (var i = 0; i < utf16StrLength; i++) {
          words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
        }
        return WordArray.create(words, utf16StrLength * 2);
      }
    };
    function swapEndian(word) {
      return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
    }
  }());
  return CryptoJS.enc.Utf16;
}));
