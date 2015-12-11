System.register(['bootstrap'], function (_export) {
  'use strict';

  _export('configure', configure);

  function configure(aurelia) {
    aurelia.use.standardConfiguration().developmentLogging().plugin('autobahn');

    aurelia.start().then(function (a) {
      return a.setRoot();
    });
  }

  return {
    setters: [function (_bootstrap) {}],
    execute: function () {}
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFFTyxXQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUU7QUFDakMsV0FBTyxDQUFDLEdBQUcsQ0FDUixxQkFBcUIsRUFBRSxDQUN2QixrQkFBa0IsRUFBRSxDQUNwQixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBUXRCLFdBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDO2FBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTtLQUFBLENBQUMsQ0FBQztHQUN4QyIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdib290c3RyYXAnO1xuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKGF1cmVsaWEpIHtcbiAgYXVyZWxpYS51c2VcbiAgICAuc3RhbmRhcmRDb25maWd1cmF0aW9uKClcbiAgICAuZGV2ZWxvcG1lbnRMb2dnaW5nKClcbiAgICAucGx1Z2luKCdhdXRvYmFobicpO1xuXG4gIC8vVW5jb21tZW50IHRoZSBsaW5lIGJlbG93IHRvIGVuYWJsZSBhbmltYXRpb24uXG4gIC8vYXVyZWxpYS51c2UucGx1Z2luKCdhdXJlbGlhLWFuaW1hdG9yLWNzcycpO1xuXG4gIC8vQW55b25lIHdhbnRpbmcgdG8gdXNlIEhUTUxJbXBvcnRzIHRvIGxvYWQgdmlld3MsIHdpbGwgbmVlZCB0byBpbnN0YWxsIHRoZSBmb2xsb3dpbmcgcGx1Z2luLlxuICAvL2F1cmVsaWEudXNlLnBsdWdpbignYXVyZWxpYS1odG1sLWltcG9ydC10ZW1wbGF0ZS1sb2FkZXInKVxuXG4gIGF1cmVsaWEuc3RhcnQoKS50aGVuKGEgPT4gYS5zZXRSb290KCkpO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
