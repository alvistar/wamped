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
  (function(undefined) {
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var X32WordArray = C_lib.WordArray;
    var C_x64 = C.x64 = {};
    var X64Word = C_x64.Word = Base.extend({init: function(high, low) {
        this.high = high;
        this.low = low;
      }});
    var X64WordArray = C_x64.WordArray = Base.extend({
      init: function(words, sigBytes) {
        words = this.words = words || [];
        if (sigBytes != undefined) {
          this.sigBytes = sigBytes;
        } else {
          this.sigBytes = words.length * 8;
        }
      },
      toX32: function() {
        var x64Words = this.words;
        var x64WordsLength = x64Words.length;
        var x32Words = [];
        for (var i = 0; i < x64WordsLength; i++) {
          var x64Word = x64Words[i];
          x32Words.push(x64Word.high);
          x32Words.push(x64Word.low);
        }
        return X32WordArray.create(x32Words, this.sigBytes);
      },
      clone: function() {
        var clone = Base.clone.call(this);
        var words = clone.words = this.words.slice(0);
        var wordsLength = words.length;
        for (var i = 0; i < wordsLength; i++) {
          words[i] = words[i].clone();
        }
        return clone;
      }
    });
  }());
  return CryptoJS;
}));
