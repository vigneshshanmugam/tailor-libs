const http = require("http");
const https = require("https");
const { NetworkError, SocketError } = require("./errors");

const defaultReadTimeout = 3000;
const defaultConnTimeout = 1000;

module.exports = function(options) {
  const protocol = options.protocol === "https:" ? https : http;
  // connection timeout - Happens when the socket connection cannot be established
  const connectionTimeout = options.timeout || defaultConnTimeout;
  /**
   * Read timeout - Happens after the socket connection is successfully established and
   * when there is no activity on the connected socket.
   *
   * By default use readTimeout, For fragment use the timeout from the attributes
   */
  const readTimeout = options.readTimeout || defaultReadTimeout;

  return new Promise((resolve, reject) => {
    const request = protocol.request(options);

    function setSocketTimeout(socket) {
      function onConnectionTimeout() {
        socket.destroy();
        reject(
          new SocketError(
            `Could not connect within ${connectionTimeout} ms to ${options.host}`
          )
        );
      }
      function onReadTimeout() {
        socket.destroy();
        reject(
          new SocketError(
            `Failed to read data within ${readTimeout} ms from ${options.host}`
          )
        );
      }
      /**
       * Connect event would kick in only for new socket connection and
       * not for connections that are kept alive
       */
      if (socket.connecting) {
        socket.setTimeout(connectionTimeout, onConnectionTimeout);
        socket.once("connect", () => {
          socket.removeListener("timeout", onConnectionTimeout);
          /**
           * Registering the timeout listener on request instead of socket because
           * sockets are reused and that will trigger memory leaks because of too many listeners
           */
          request.setTimeout(readTimeout, onReadTimeout);
        });
      } else {
        request.setTimeout(readTimeout, onReadTimeout);
      }
    }

    if (request.socket) {
      setSocketTimeout(request.socket);
    } else {
      // Fires once the socket is assigned to a request
      request.once("socket", socket => setSocketTimeout(socket));
    }

    request.on("response", response => {
      const { statusCode, statusMessage } = response;

      if (statusCode >= 500) {
        return reject(
          new NetworkError(
            `${statusMessage || "Internal Server Error"} - ${statusCode}`,
            statusCode
          )
        );
      }
      return resolve(response);
    });

    request.on("error", err => {
      reject(new SocketError(err.message, err.code));
    });
    request.end();
  });
};
