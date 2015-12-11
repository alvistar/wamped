/* */ 
"format cjs";
(function(Buffer, process) {
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
    CryptoJS.lib.Cipher || (function(undefined) {
      var C = CryptoJS;
      var C_lib = C.lib;
      var Base = C_lib.Base;
      var WordArray = C_lib.WordArray;
      var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
      var C_enc = C.enc;
      var Utf8 = C_enc.Utf8;
      var Base64 = C_enc.Base64;
      var C_algo = C.algo;
      var EvpKDF = C_algo.EvpKDF;
      var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
        cfg: Base.extend(),
        createEncryptor: function(key, cfg) {
          return this.create(this._ENC_XFORM_MODE, key, cfg);
        },
        createDecryptor: function(key, cfg) {
          return this.create(this._DEC_XFORM_MODE, key, cfg);
        },
        init: function(xformMode, key, cfg) {
          this.cfg = this.cfg.extend(cfg);
          this._xformMode = xformMode;
          this._key = key;
          this.reset();
        },
        reset: function() {
          BufferedBlockAlgorithm.reset.call(this);
          this._doReset();
        },
        process: function(dataUpdate) {
          this._append(dataUpdate);
          return this._process();
        },
        finalize: function(dataUpdate) {
          if (dataUpdate) {
            this._append(dataUpdate);
          }
          var finalProcessedData = this._doFinalize();
          return finalProcessedData;
        },
        keySize: 128 / 32,
        ivSize: 128 / 32,
        _ENC_XFORM_MODE: 1,
        _DEC_XFORM_MODE: 2,
        _createHelper: (function() {
          function selectCipherStrategy(key) {
            if (typeof key == 'string') {
              return PasswordBasedCipher;
            } else {
              return SerializableCipher;
            }
          }
          return function(cipher) {
            return {
              encrypt: function(message, key, cfg) {
                return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
              },
              decrypt: function(ciphertext, key, cfg) {
                return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
              }
            };
          };
        }())
      });
      var StreamCipher = C_lib.StreamCipher = Cipher.extend({
        _doFinalize: function() {
          var finalProcessedBlocks = this._process(!!'flush');
          return finalProcessedBlocks;
        },
        blockSize: 1
      });
      var C_mode = C.mode = {};
      var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
        createEncryptor: function(cipher, iv) {
          return this.Encryptor.create(cipher, iv);
        },
        createDecryptor: function(cipher, iv) {
          return this.Decryptor.create(cipher, iv);
        },
        init: function(cipher, iv) {
          this._cipher = cipher;
          this._iv = iv;
        }
      });
      var CBC = C_mode.CBC = (function() {
        var CBC = BlockCipherMode.extend();
        CBC.Encryptor = CBC.extend({processBlock: function(words, offset) {
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;
            xorBlock.call(this, words, offset, blockSize);
            cipher.encryptBlock(words, offset);
            this._prevBlock = words.slice(offset, offset + blockSize);
          }});
        CBC.Decryptor = CBC.extend({processBlock: function(words, offset) {
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;
            var thisBlock = words.slice(offset, offset + blockSize);
            cipher.decryptBlock(words, offset);
            xorBlock.call(this, words, offset, blockSize);
            this._prevBlock = thisBlock;
          }});
        function xorBlock(words, offset, blockSize) {
          var iv = this._iv;
          if (iv) {
            var block = iv;
            this._iv = undefined;
          } else {
            var block = this._prevBlock;
          }
          for (var i = 0; i < blockSize; i++) {
            words[offset + i] ^= block[i];
          }
        }
        return CBC;
      }());
      var C_pad = C.pad = {};
      var Pkcs7 = C_pad.Pkcs7 = {
        pad: function(data, blockSize) {
          var blockSizeBytes = blockSize * 4;
          var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
          var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;
          var paddingWords = [];
          for (var i = 0; i < nPaddingBytes; i += 4) {
            paddingWords.push(paddingWord);
          }
          var padding = WordArray.create(paddingWords, nPaddingBytes);
          data.concat(padding);
        },
        unpad: function(data) {
          var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
          data.sigBytes -= nPaddingBytes;
        }
      };
      var BlockCipher = C_lib.BlockCipher = Cipher.extend({
        cfg: Cipher.cfg.extend({
          mode: CBC,
          padding: Pkcs7
        }),
        reset: function() {
          Cipher.reset.call(this);
          var cfg = this.cfg;
          var iv = cfg.iv;
          var mode = cfg.mode;
          if (this._xformMode == this._ENC_XFORM_MODE) {
            var modeCreator = mode.createEncryptor;
          } else {
            var modeCreator = mode.createDecryptor;
            this._minBufferSize = 1;
          }
          this._mode = modeCreator.call(mode, this, iv && iv.words);
        },
        _doProcessBlock: function(words, offset) {
          this._mode.processBlock(words, offset);
        },
        _doFinalize: function() {
          var padding = this.cfg.padding;
          if (this._xformMode == this._ENC_XFORM_MODE) {
            padding.pad(this._data, this.blockSize);
            var finalProcessedBlocks = this._process(!!'flush');
          } else {
            var finalProcessedBlocks = this._process(!!'flush');
            padding.unpad(finalProcessedBlocks);
          }
          return finalProcessedBlocks;
        },
        blockSize: 128 / 32
      });
      var CipherParams = C_lib.CipherParams = Base.extend({
        init: function(cipherParams) {
          this.mixIn(cipherParams);
        },
        toString: function(formatter) {
          return (formatter || this.formatter).stringify(this);
        }
      });
      var C_format = C.format = {};
      var OpenSSLFormatter = C_format.OpenSSL = {
        stringify: function(cipherParams) {
          var ciphertext = cipherParams.ciphertext;
          var salt = cipherParams.salt;
          if (salt) {
            var wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
          } else {
            var wordArray = ciphertext;
          }
          return wordArray.toString(Base64);
        },
        parse: function(openSSLStr) {
          var ciphertext = Base64.parse(openSSLStr);
          var ciphertextWords = ciphertext.words;
          if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
            var salt = WordArray.create(ciphertextWords.slice(2, 4));
            ciphertextWords.splice(0, 4);
            ciphertext.sigBytes -= 16;
          }
          return CipherParams.create({
            ciphertext: ciphertext,
            salt: salt
          });
        }
      };
      var SerializableCipher = C_lib.SerializableCipher = Base.extend({
        cfg: Base.extend({format: OpenSSLFormatter}),
        encrypt: function(cipher, message, key, cfg) {
          cfg = this.cfg.extend(cfg);
          var encryptor = cipher.createEncryptor(key, cfg);
          var ciphertext = encryptor.finalize(message);
          var cipherCfg = encryptor.cfg;
          return CipherParams.create({
            ciphertext: ciphertext,
            key: key,
            iv: cipherCfg.iv,
            algorithm: cipher,
            mode: cipherCfg.mode,
            padding: cipherCfg.padding,
            blockSize: cipher.blockSize,
            formatter: cfg.format
          });
        },
        decrypt: function(cipher, ciphertext, key, cfg) {
          cfg = this.cfg.extend(cfg);
          ciphertext = this._parse(ciphertext, cfg.format);
          var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);
          return plaintext;
        },
        _parse: function(ciphertext, format) {
          if (typeof ciphertext == 'string') {
            return format.parse(ciphertext, this);
          } else {
            return ciphertext;
          }
        }
      });
      var C_kdf = C.kdf = {};
      var OpenSSLKdf = C_kdf.OpenSSL = {execute: function(password, keySize, ivSize, salt) {
          if (!salt) {
            salt = WordArray.random(64 / 8);
          }
          var key = EvpKDF.create({keySize: keySize + ivSize}).compute(password, salt);
          var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
          key.sigBytes = keySize * 4;
          return CipherParams.create({
            key: key,
            iv: iv,
            salt: salt
          });
        }};
      var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
        cfg: SerializableCipher.cfg.extend({kdf: OpenSSLKdf}),
        encrypt: function(cipher, message, password, cfg) {
          cfg = this.cfg.extend(cfg);
          var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);
          cfg.iv = derivedParams.iv;
          var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);
          ciphertext.mixIn(derivedParams);
          return ciphertext;
        },
        decrypt: function(cipher, ciphertext, password, cfg) {
          cfg = this.cfg.extend(cfg);
          ciphertext = this._parse(ciphertext, cfg.format);
          var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);
          cfg.iv = derivedParams.iv;
          var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);
          return plaintext;
        }
      });
    }());
  }));
})(require('buffer').Buffer, require('process'));
