const Hyperswarm = require("hyperswarm");
const { CHANNEL_NAME } = require("./constants");
/**
 * Hyperswarm Server managing the RPC server.
 * Receives rpc-server, data, message
 *
 * @class Server
 */
class Server {
  constructor() {
    this.swarm = new Hyperswarm();

    this.connections = [];
    const discovery = this.swarm.join(Buffer.alloc(32).fill(CHANNEL_NAME), {
      server: true,
      client: false,
    });

    discovery.flushed().then(() => {
      console.log("Server started. Waiting for connections...");
      this.handleConnections = this.handleConnections.bind(this);
      this.swarm.on("connection", this.handleConnections);
    });
  }

  async handleConnections(conn, info) {
    this.connections.push(conn);

    this.handleData = this.handleData.bind(this);
    conn.on("data", this.handleData);
  }

  async handleData(data) {
    console.log(data);
    // should eventually handle handshakes, etc
  }

  broadcast(object) {
    for (const conn of this.connections) {
      conn.write(object);
    }
  }
}

module.exports = {
  Server,
};
