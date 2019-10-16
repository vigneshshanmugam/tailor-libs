class NetworkError extends Error {
  constructor(message = "Internal server error", statusCode) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class SocketError extends Error {
  constructor(message = "Socket hang up", code = "ETIMEDOUT") {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
  }
}

module.exports = {
  NetworkError,
  SocketError
};
