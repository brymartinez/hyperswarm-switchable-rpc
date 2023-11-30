const Hyperswarm = require("hyperswarm");
const HyperswarmRPC = require("@hyperswarm/rpc");
const DHT = require("hyperdht");
const { CHANNEL_NAME } = require("./constants");
const cli = require("./cli");
const crypto = require("crypto");

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
    this.handleData = this.handleData.bind(this);
    this.serverConnection.on("data", this.handleData);
    await cli.prompt(this);
  }

  async handleData(data) {
    const jsonData = JSON.parse(data.toString());

    console.log("Client received: ", jsonData);

    switch (jsonData.mode) {
      case "init":
        // dhtSeed and public key are received when there's an existing server.
        // otherwise null
        // this way, RPCEntity defaults to 'client' mode.
        if (jsonData.dhtSeed) {
          this.RPC = new HyperswarmRPC({ keyPair: DHT.keyPair(dhtSeed) });
        }

        if (jsonData.publicKey) {
          this.rpcServerPublicKey = jsonData.publicKey.toString("hex");
          this.RPC.connect(jsonData.publicKey.toString("hex"));
        }

      case "rpc-server-ack":
        this.RPCServer = this.RPC.createServer();
        await this.RPCServer.listen();
        this.serverConnection.write(
          JSON.stringify({
            mode: "rpc-public-key",
            publicKey: this.RPCServer.publicKey.toString("hex"),
          })
        );

        console.log("You are now in server mode.");
        process.stdout.write("> ");
    }
  }

  sendToSwarmServer(message) {
    this.serverConnection.write(JSON.stringify(message));
  }

  async toServer() {
    const dhtSeed = crypto.randomBytes(32);

    const dht = new DHT({ keyPair: DHT.keyPair(dhtSeed) });

    await dht.ready();
    this.RPC = new HyperswarmRPC({ dht });

    // Send this dhtSeed to server for safekeeping
    this.sendToSwarmServer({
      mode: "rpc-server",
      dhtSeed: dhtSeed.toString("hex"),
    });
  }

  async toClient() {
    if (this.RPCServer && !this.RPCServer.closed) {
      await this.RPCServer.close();
    }

    if (!this.rpcServerPublicKey) {
      console.error("There is currently no server available.");
      return;
    }

    this.RPCClient = this.RPC.connect(Buffer.from(this.rpcServerPublicKey));
  }
}

module.exports = {
  RPCEntity,
};
