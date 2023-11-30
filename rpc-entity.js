const Hyperswarm = require("hyperswarm");
const { CHANNEL_NAME } = require("./constants");
const cli = require("./cli");
/**
 * Can seamlessly switch between RPC client mode and RPC server mode.
 * Communicates with Swarm Server and performs handshake.
 * If on client mode, waits for an RPC server to be alive before connecting.
 *
 * @class RPCEntity
 */
class RPCEntity {
  constructor() {
    this.swarm = new Hyperswarm();

    this.swarm.join(Buffer.alloc(32).fill(CHANNEL_NAME), {
      client: true,
      server: false,
    });

    this.handleConnection = this.handleConnection.bind(this);
    this.swarm.on("connection", this.handleConnection);
  }

  async handleConnection(conn, info) {
    console.log("Connected to server");
    this.serverConnection = conn;
    await cli.prompt(this);
    this.handleData = this.handleData.bind(this);
    this.serverConnection.on("data", this.handleData);
  }

  handleData(data) {
    console.log("Client received: ", data);
  }

  toServer() {}

  toClient() {}
}

module.exports = {
  RPCEntity,
};
