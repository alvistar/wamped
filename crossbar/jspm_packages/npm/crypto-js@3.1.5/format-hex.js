/* */ 
"format cjs";
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
  (function(undefined) {
    var C = CryptoJS;
    var C_lib = C.lib;
    var CipherParams = C_lib.CipherParams;
    var C_enc = C.enc;
    var Hex = C_enc.Hex;
    var C_format = C.format;
    var HexFormatter = C_format.Hex = {
      stringify: function(cipherParams) {
        return cipherParams.ciphertext.toString(Hex);
      },
      parse: function(input) {
        var ciphertext = Hex.parse(input);
        return CipherParams.create({ciphertext: ciphertext});
      }
    };
  }());
  return CryptoJS.format.Hex;
}));
