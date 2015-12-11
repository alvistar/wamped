System.register(["autobahn", "bootstrap-switch"], function (_export) {
  "use strict";

  var autobahn, Wamp;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [function (_autobahn) {
      autobahn = _autobahn["default"];
    }, function (_bootstrapSwitch) {}],
    execute: function () {
      Wamp = (function () {
        function Wamp() {
          _classCallCheck(this, Wamp);

          this.URL = "ws://localhost:8080/ws";
          this.sw2count = 0;
          this.result = 0;
          this.accelX = 0;
          this.accelY = 0;
          this.accelZ = 0;
          this.colors = ["Blue", "Green", "Red"];
          this.selectedColor = 'Blue';
          this.switchState = false;
        }

        _createClass(Wamp, [{
          key: "onChangeColor",
          value: function onChangeColor() {
            if (this.switchState) this.session.call("com.freedom.switchon", [this.colors.indexOf(this.selectedColor)]);
          }
        }, {
          key: "onTest",
          value: function onTest(state) {
            console.log("Changed:" + state);
            if (state) this.session.call("com.freedom.switchon", [this.colors.indexOf(this.selectedColor)]);else this.session.call("com.freedom.switchoff");
          }
        }, {
          key: "onevent",
          value: function onevent(args) {
            console.log("Event:", args[0]);

            $("[name='my-checkbox']").bootstrapSwitch("toggleState");
          }
        }, {
          key: "changedLedStatus",
          value: function changedLedStatus(res) {
            console.log("Changed Led Status");
            if (res == -1) {
              this.switchState = false;
            } else {
              this.switchState = true;
              this.selectedColor = this.colors[res];
            }
          }
        }, {
          key: "activate",
          value: function activate() {
            var _this = this;

            this.connection = new autobahn.Connection({ url: this.URL, realm: "realm1" });

            this.connection.onopen = function (session) {
              console.log("Session estabilished");
              _this.session = session;
              session.subscribe("button", function (args) {
                _this.sw2count = args[0];
              });

              session.subscribe("acceleremoter", function (args) {
                _this.accelX = args[0];
                _this.accelY = args[1];
                _this.accelZ = args[2];
              });

              session.subscribe("com.freedom.switched", function (args) {
                _this.changedLedStatus(args[0]);
              });

              session.call('com.freedom.getCounter').then(function (res) {
                console.log("Result:", res);
                _this.sw2count = res;
              });

              session.call('com.freedom.getLedStatus').then(function (res) {
                console.log("Led Status:", res);
                _this.changedLedStatus(res);
              });
            };

            this.connection.open();
          }
        }]);

        return Wamp;
      })();

      _export("Wamp", Wamp);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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LHNCQUFzQixFQUFFLFVBQUMsSUFBSSxFQUFLO0FBQ2xELHNCQUFLLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2VBQ2hDLENBQUMsQ0FBQzs7QUFFSCxxQkFBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLElBQUksQ0FDekMsVUFBQSxHQUFHLEVBQUk7QUFDTCx1QkFBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUIsc0JBQUssUUFBUSxHQUFHLEdBQUcsQ0FBQztlQUNyQixDQUFDLENBQUM7O0FBRUwscUJBQU8sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxJQUFJLENBQzNDLFVBQUEsR0FBRyxFQUFJO0FBQ0wsdUJBQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLHNCQUFLLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2VBQzVCLENBQUMsQ0FBQzthQUNOLENBQUM7O0FBRUYsZ0JBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7V0FDeEI7OztlQTVFVSxJQUFJIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhdXRvYmFobiBmcm9tICdhdXRvYmFobic7XG5pbXBvcnQgXCJib290c3RyYXAtc3dpdGNoXCI7XG4vL2ltcG9ydCBcImJvb3RzdHJhcC1zd2l0Y2gvZGlzdC9jc3MvYm9vdHN0cmFwMy9ib290c3RyYXAtc3dpdGNoLmNzcyFcIjtcblxuZXhwb3J0IGNsYXNzIFdhbXAge1xuICBVUkw9IFwid3M6Ly9sb2NhbGhvc3Q6ODA4MC93c1wiXG4gIHN3MmNvdW50ID0gMDtcbiAgcmVzdWx0ID0gMDtcbiAgYWNjZWxYID0wO1xuICBhY2NlbFkgPSAwO1xuICBhY2NlbFogPSAwO1xuICBjb2xvcnMgPSBbXCJCbHVlXCIsXCJHcmVlblwiLFwiUmVkXCJdO1xuICBzZWxlY3RlZENvbG9yID0gJ0JsdWUnO1xuICBzZXNzaW9uO1xuICBzd2l0Y2hTdGF0ZT0gZmFsc2U7XG5cbiAgb25DaGFuZ2VDb2xvcigpIHtcbiAgICBpZiAodGhpcy5zd2l0Y2hTdGF0ZSlcbiAgICAgIHRoaXMuc2Vzc2lvbi5jYWxsKFwiY29tLmZyZWVkb20uc3dpdGNob25cIixbdGhpcy5jb2xvcnMuaW5kZXhPZih0aGlzLnNlbGVjdGVkQ29sb3IpXSk7XG4gIH1cblxuICBvblRlc3Qoc3RhdGUpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNoYW5nZWQ6XCIrIHN0YXRlKTtcbiAgICBpZiAoc3RhdGUpXG4gICAgICB0aGlzLnNlc3Npb24uY2FsbChcImNvbS5mcmVlZG9tLnN3aXRjaG9uXCIsW3RoaXMuY29sb3JzLmluZGV4T2YodGhpcy5zZWxlY3RlZENvbG9yKV0pO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuc2Vzc2lvbi5jYWxsKFwiY29tLmZyZWVkb20uc3dpdGNob2ZmXCIpO1xuICB9XG5cbiAgb25ldmVudChhcmdzKSB7XG4gICAgY29uc29sZS5sb2coXCJFdmVudDpcIiwgYXJnc1swXSk7XG4gICAgLy8kKFwiW25hbWU9J215LWNoZWNrYm94J11cIikuYm9vdHN0cmFwU3dpdGNoKCdzdGF0ZScsdHJ1ZSx0cnVlKTtcbiAgICAkKFwiW25hbWU9J215LWNoZWNrYm94J11cIikuYm9vdHN0cmFwU3dpdGNoKFwidG9nZ2xlU3RhdGVcIik7XG4gIH1cblxuICBjaGFuZ2VkTGVkU3RhdHVzKHJlcykge1xuICAgIGNvbnNvbGUubG9nKFwiQ2hhbmdlZCBMZWQgU3RhdHVzXCIpO1xuICAgIGlmIChyZXM9PS0xKSAgIHtcbiAgICAgIHRoaXMuc3dpdGNoU3RhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnN3aXRjaFN0YXRlID0gdHJ1ZTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRDb2xvciA9IHRoaXMuY29sb3JzW3Jlc107XG4gICAgfVxuICB9XG5cbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gbmV3IGF1dG9iYWhuLkNvbm5lY3Rpb24oe3VybDogdGhpcy5VUkwscmVhbG06IFwicmVhbG0xXCJ9KTtcblxuICAgIHRoaXMuY29ubmVjdGlvbi5vbm9wZW4gPSBzZXNzaW9uID0+IHtcbiAgICAgIGNvbnNvbGUubG9nIChcIlNlc3Npb24gZXN0YWJpbGlzaGVkXCIpO1xuICAgICAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcbiAgICAgIHNlc3Npb24uc3Vic2NyaWJlKFwiYnV0dG9uXCIsIChhcmdzKT0+IHtcbiAgICAgICAgdGhpcy5zdzJjb3VudD1hcmdzWzBdO1xuICAgICAgfSk7XG5cbiAgICAgIHNlc3Npb24uc3Vic2NyaWJlKFwiYWNjZWxlcmVtb3RlclwiLCAoYXJncyk9PiB7XG4gICAgICAgIHRoaXMuYWNjZWxYPWFyZ3NbMF07XG4gICAgICAgIHRoaXMuYWNjZWxZPWFyZ3NbMV07XG4gICAgICAgIHRoaXMuYWNjZWxaPWFyZ3NbMl07XG4gICAgICB9KTtcblxuICAgICAgc2Vzc2lvbi5zdWJzY3JpYmUoXCJjb20uZnJlZWRvbS5zd2l0Y2hlZFwiLCAoYXJncykgPT4ge1xuICAgICAgICB0aGlzLmNoYW5nZWRMZWRTdGF0dXMoYXJnc1swXSk7XG4gICAgICB9KTtcblxuICAgICAgc2Vzc2lvbi5jYWxsKCdjb20uZnJlZWRvbS5nZXRDb3VudGVyJykudGhlbihcbiAgICAgICAgcmVzID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3VsdDpcIiwgcmVzKTtcbiAgICAgICAgICB0aGlzLnN3MmNvdW50ID0gcmVzO1xuICAgICAgICB9KTtcblxuICAgICAgc2Vzc2lvbi5jYWxsKCdjb20uZnJlZWRvbS5nZXRMZWRTdGF0dXMnKS50aGVuKFxuICAgICAgICByZXMgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTGVkIFN0YXR1czpcIiwgcmVzKTtcbiAgICAgICAgICB0aGlzLmNoYW5nZWRMZWRTdGF0dXMocmVzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuY29ubmVjdGlvbi5vcGVuKCk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
