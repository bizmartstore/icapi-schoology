(function () {
  var blockedPaths = ["/__l5e/trackevents", "/~api/analytics"];

  function isBlocked(url) {
    try {
      var value = String(url);
      for (var i = 0; i < blockedPaths.length; i++) {
        if (value.indexOf(blockedPaths[i]) !== -1) return true;
      }
    } catch (_error) {
      return false;
    }
    return false;
  }

  if (navigator.sendBeacon) {
    var nativeSendBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      if (isBlocked(url)) return true;
      return nativeSendBeacon(url, data);
    };
  }

  if (window.fetch) {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : input && input.url;
      if (isBlocked(url)) {
        return Promise.resolve(new Response(null, { status: 204, statusText: "No Content" }));
      }
      return nativeFetch(input, init);
    };
  }
})();
