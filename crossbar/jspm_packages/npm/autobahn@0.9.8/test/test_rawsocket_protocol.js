/* */ 
(function(Buffer, process) {
  var stream = require('stream');
  var rawsocket = require('../lib/transport/rawsocket');
  module.exports = {
    testValidHandshake: function(testcase) {
      var wire = makeXWire();
      testcase.expect(3);
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: function(handshake) {
          testcase.equal(handshake.length, 4, 'Handshake should be 4 bytes');
          testcase.equal(handshake[0], 0x7f, 'Magic byte must be 0x7f');
          testcase.ok([0x1, 0x2].indexOf(handshake[1] & 0xf) > -1, 'Must announce a valid serializer');
          replyWithValidHandshake(wire.tx, 'wait')();
          setTimeout(function() {
            testcase.done();
          }, 50);
        },
        wait: function() {}
      });
      var protocol = new rawsocket.Protocol(wire.rx);
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(false, 'Should not throw a protocol error');
        testcase.done();
      });
      machine.tick();
    },
    testFailedHandshake: function(testcase) {
      var wire = makeXWire();
      testcase.expect(1);
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: function(handshake) {
          setTimeout(function() {
            var howdy = new Buffer(4);
            howdy.writeUInt8(0x7f, 0);
            howdy.writeUInt8(0x10, 1);
            howdy.writeUInt8(0x00, 2);
            howdy.writeUInt8(0x00, 3);
            wire.tx.write(howdy);
          }, 10);
        }
      });
      var protocol = new rawsocket.Protocol(wire.rx);
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(err instanceof rawsocket.ProtocolError, 'Should throw a protocol error');
        testcase.done();
      });
      machine.tick();
    },
    testPingReply: function(testcase) {
      var wire = makeXWire();
      testcase.expect(4);
      var payload = randomString(256);
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
        sendPing: function() {
          setTimeout(function() {
            var frame = buildRawSocketFrame(0x01, payload);
            machine.transition('waitPong');
            wire.tx.write(frame);
          }, 10);
        },
        waitPong: function(packet) {
          testcase.equal(packet[0] >> 4, 0, 'Reserved half-byte must be zeroed');
          testcase.equal(packet[0] & 0x0f, 0x2, 'Expected a PONG packet');
          testcase.equal(packet.readUIntBE(1, 3), packet.length - 4, 'Length prefix doesn\'t match frame length');
          testcase.equal(packet.toString('utf8', 4), payload, 'PONG reply must have the same payload as the PING packet');
          testcase.done();
        }
      });
      var protocol = new rawsocket.Protocol(wire.rx);
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(false, 'Should not throw a protocol error');
        testcase.done();
      });
      machine.tick();
    },
    testPingRequest: function(testcase) {
      var wire = makeXWire();
      testcase.expect(3);
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
        sendPing: function() {
          setTimeout(function() {
            machine.transition('waitPing');
            protocol.ping();
          }, 10);
        },
        waitPing: function(packet) {
          testcase.equal(packet[0] >> 4, 0, 'Reserved half-byte must be zeroed');
          testcase.equal(packet[0] & 0x0f, 0x1, 'Expected a PING packet');
          testcase.equal(packet.readUIntBE(1, 3), packet.length - 4, 'Length prefix doesn\'t match frame length');
          setTimeout(function() {
            machine.transition('wait');
            var frame = buildRawSocketFrame(0x2, packet.toString('utf8', 4));
            wire.tx.write(frame);
          }, 10);
          setTimeout(function() {
            testcase.done();
          }, protocol._options.ping_timeout + 10);
          machine.transition('wait');
        },
        wait: function() {}
      });
      var protocol = new rawsocket.Protocol(wire.rx, {
        strict_pong: true,
        ping_timeout: 20
      });
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(false, 'Should not throw a protocol error');
        testcase.done();
      });
      machine.tick();
    },
    testInvalidPong: function(testcase) {
      var wire = makeXWire();
      testcase.expect(1);
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
        sendPing: function() {
          setTimeout(function() {
            machine.transition('waitPing');
            protocol.ping();
          }, 10);
        },
        waitPing: function(packet) {
          setTimeout(function() {
            machine.transition('wait');
            var frame = buildRawSocketFrame(0x2, packet.toString('utf8', 'This is not supposed to be the same payload'));
            wire.tx.write(frame);
          }, 10);
          machine.transition('wait');
        },
        wait: function() {}
      });
      var protocol = new rawsocket.Protocol(wire.rx, {
        strict_pong: true,
        ping_timeout: 20
      });
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(err instanceof rawsocket.ProtocolError, 'Should throw a protocol error');
        testcase.done();
      });
      machine.tick();
    },
    testPingTimeout: function(testcase) {
      var wire = makeXWire();
      testcase.expect(1);
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: replyWithValidHandshake(wire.tx, 'sendPing'),
        sendPing: function() {
          setTimeout(function() {
            machine.transition('wait');
            protocol.ping();
          }, 10);
        },
        wait: function() {}
      });
      var protocol = new rawsocket.Protocol(wire.rx, {
        strict_pong: true,
        ping_timeout: 20
      });
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(err instanceof rawsocket.ProtocolError, 'Should throw a protocol error');
        testcase.done();
      });
      machine.tick();
    },
    testDataReceive: function(testcase) {
      var wire = makeXWire();
      testcase.expect(1);
      var obj = [1, null, [true, false], [-21, 0.6666], {
        a: 'hello',
        b: ['jamie', 'nicole']
      }];
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),
        sendData: function() {
          setTimeout(function() {
            machine.transition('wait');
            var frame = buildRawSocketFrame(0x0, JSON.stringify(obj));
            wire.tx.write(frame);
          }, 10);
        },
        wait: function() {}
      });
      var protocol = new rawsocket.Protocol(wire.rx);
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(false, 'Should not throw a protocol error');
        testcase.done();
      });
      protocol.on('data', function(data) {
        testcase.deepEqual(data, obj, 'Received frame doesn\'t match original data');
        testcase.done();
      });
      machine.tick();
    },
    testDataSend: function(testcase) {
      var wire = makeXWire();
      testcase.expect(5);
      var obj = [1, null, [true, false], [-21, 0.6666], {
        a: 'hello',
        b: ['jamie', 'nicole']
      }];
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),
        sendData: function() {
          setTimeout(function() {
            machine.transition('receiveData');
            protocol.write(obj);
          }, 10);
        },
        receiveData: function(frame) {
          testcase.equal(frame[0] >> 4, 0x0, 'Reserved half-byte must be zeroed');
          testcase.equal(frame[0] & 0xf, 0x0, 'Frame type must be WAMP');
          testcase.equal(frame.readUIntBE(1, 3), frame.length - 4, 'Unexpected payload size');
          var payload = frame.toString('utf8', 4);
          testcase.doesNotThrow(function() {
            payload = JSON.parse(payload);
          }, 'Invalid JSON');
          testcase.deepEqual(payload, obj, 'Sent object does\'nt match');
          testcase.done();
        }
      });
      var protocol = new rawsocket.Protocol(wire.rx);
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(false, 'Should not throw a protocol error');
        testcase.done();
      });
      machine.tick();
    },
    testChunkedData: function(testcase) {
      var wire = makeXWire();
      testcase.expect(1);
      var obj = [1, null, [true, false], [-21, 0.6666], {
        a: 'hello',
        b: ['jamie', 'nicole']
      }];
      var machine = new StateMachine({
        init: function() {
          this.transition('waitForHandshake');
          wire.rx.emit('connect');
        },
        waitForHandshake: replyWithValidHandshake(wire.tx, 'sendData'),
        sendData: function() {
          this.transition('wait');
          var frame = buildRawSocketFrame(0x0, JSON.stringify(obj));
          function sendChunk(start, end) {
            wire.tx.write(frame.slice(start, end));
          }
          for (var i = 0; i < frame.length; i++) {
            setTimeout(sendChunk, i * 2, i, i + 1);
          }
        },
        wait: function() {}
      });
      var protocol = new rawsocket.Protocol(wire.rx);
      wire.tx.on('data', function(data) {
        machine.tick(data);
      });
      protocol.on('error', function(err) {
        testcase.ok(false, 'Should not throw a protocol error');
        testcase.done();
      });
      protocol.on('data', function(data) {
        testcase.deepEqual(data, obj, 'Received object doesn\'t match');
        testcase.done();
      });
      machine.tick();
    }
  };
  process.on('uncaughtException', function(err) {
    console.error(err.stack);
  });
  function makeXWire() {
    var rx = new stream.PassThrough();
    var tx = new stream.PassThrough();
    rx.__write = rx.write.bind(rx);
    tx.__write = tx.write.bind(tx);
    rx.write = tx.__write;
    tx.write = rx.__write;
    var close = function() {
      rx.emit('close');
      tx.emit('close');
    };
    rx.close = close;
    tx.close = close;
    return {
      rx: rx,
      tx: tx
    };
  }
  function replyWithValidHandshake(connection, transitionTo, delay) {
    return function() {
      var self = this;
      setTimeout(function() {
        var howdy = new Buffer(4);
        howdy.writeUInt8(0x7f, 0);
        howdy.writeUInt8(0xf1, 1);
        howdy.writeUInt8(0x00, 2);
        howdy.writeUInt8(0x00, 3);
        transitionTo && self.transition && self.transition(transitionTo);
        connection.write(howdy);
        transitionTo && self.tick && self.tick();
      }, delay || 10);
    };
  }
  function buildRawSocketFrame(type, payload) {
    var msgLen = Buffer.byteLength(payload, 'utf8');
    var frame = new Buffer(msgLen + 4);
    frame.writeUInt8(type, 0);
    frame.writeUIntBE(msgLen, 1, 3);
    frame.write(payload, 4);
    return frame;
  }
  function randomString(len) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.()[]{}+=`#"~&$*!:;,?./§';
    var str = '';
    for (var i = 0; i < len; i++) {
      str += chars.charAt((Math.random() * chars.length) | 0);
    }
    return str;
  }
  function StateMachine(states, log) {
    this._states = states;
    this._state = null;
    this.log = log || function() {};
    this.transition('init');
  }
  StateMachine.prototype.tick = function(payload) {
    var cb = this._states[this._state];
    if (!cb)
      throw new Error('Invalid state: ' + this._state);
    this.log('[' + this._state + '] ' + (payload && payload.toString ? payload.toString() : payload));
    return cb.call(this, payload);
  };
  StateMachine.prototype.transition = function(newstate) {
    if (!(newstate in this._states))
      throw new Error('Unregistered state: ' + newstate);
    this.log('Transitioning from ' + this._state + ' to ' + newstate);
    this._state = newstate;
  };
})(require('buffer').Buffer, require('process'));
