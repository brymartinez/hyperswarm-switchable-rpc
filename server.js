const Hyperswarm = require("hyperswarm");
/**
 * Hyperswarm Server managing the RPC server.
 * Receives rpc-server, data, message
 *
 * @class Server
 */
class Server {
  constructor() {
    this.swarm = new Hyperswarm();
  }
}

module.exports = {
  Server,
};
