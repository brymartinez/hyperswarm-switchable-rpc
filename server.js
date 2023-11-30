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
    // All connections must receive rpcPublicKey and dhtSeed when available

    this.connections.push(conn);
    conn.write(
      JSON.stringify({
        msg: "init",
        dhtSeed: this.dhtSeed,
        publicKey: this.rpcPublicKey,
      })
    );
    this.handleData = this.handleData.bind(this);
    conn.on("data", this.handleData);
  }

  async handleData(data) {
    const jsonData = JSON.parse(data.toString());
    console.log("Server received: ", jsonData);

    switch (jsonData.mode) {
      case "rpc-server":
        console.log("Receiving seed...");
        this.dhtSeed = jsonData.dhtSeed.toString("hex");
        // send ack
        this.broadcast(JSON.stringify({ mode: "rpc-server-ack" }));
        break;
      case "rpc-public-key":
        console.log("Receiving public key...");
        this.rpcPublicKey = jsonData.publicKey;
      default:
        break;
    }
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
