"use strict";

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
        // A client might connect while onRPCServerAck is being called, hence no public key
        // Only notify client mode when there's a public key
        if (jsonData.dhtSeed) {
          this.dhtSeed = jsonData.dhtSeed;
          await this.startRPC();
        }

        if (jsonData.publicKey) {
          this.rpcServerPublicKey = jsonData.publicKey;
          console.log("You are now in client mode.");
          process.stdout.write("> ");
        }
        break;
      case "rpc-server-ack":
        await this.onRPCServerAck();
        break;
      case "rpc-server-public-key-ack":
        await this.onRPCServerPublicKeyAck(jsonData);
        break;
    }
  }

  async onRPCServerAck() {
    if (this.RPC) {
      // Only care about the message when you already started the RPC
      this.RPCServer = this.RPC.createServer();
      await this.RPCServer.listen();
      this.onRPCMessage = this.onRPCMessage.bind(this);
      this.RPCServer.respond("message", this.onRPCMessage);

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

  async onRPCServerPublicKeyAck(jsonData) {
    // Received after public key creation (hence after dhtSeed creation)
    // Only relevant if you are running on client mode, but no harm in reassigning
    this.rpcServerPublicKey = jsonData.publicKey;
    this.dhtSeed = jsonData.dhtSeed;
  }

  sendToSwarmServer(message) {
    this.serverConnection.write(JSON.stringify(message));
  }

  async startRPC() {
    if (!this.RPC) {
      this.dhtSeed = this.dhtSeed ?? crypto.randomBytes(32);

      const dht = new DHT({
        keyPair: DHT.keyPair(Buffer.from(this.dhtSeed, "hex")),
      });

      await dht.ready();
      this.RPC = new HyperswarmRPC({ dht });
    }
  }

  async toServer() {
    this.RPC?.destroy();
    await this.startRPC();
    // Send this dhtSeed to server for safekeeping
    this.sendToSwarmServer({
      mode: "rpc-server",
      dhtSeed: this.dhtSeed.toString("hex"),
    });
  }

  async toClient() {
    if (this.RPCServer) {
      console.error("You are the current server, closing connections...");
      await this.RPCServer.close();
    }

    if (!this.rpcServerPublicKey) {
      console.error("There is currently no server available.");
      return;
    }

    await this.startRPC();
    console.log("You are now in client mode.");
    process.stdout.write("> ");
  }

  async onClientMessage(data) {
    if (!this.RPCServer) {
      // if you are a server, ignore this
      await this.RPC.request(
        Buffer.from(this.rpcServerPublicKey, "hex"),
        "message",
        Buffer.from(data, "utf-8")
      ).catch((err) => {
        console.log("error on sending request!!!");
        console.error(err);
      });
    }
  }

  async onRPCMessage(data) {
    console.log("Via RPC: ", data.toString("utf-8"));
  }
}

module.exports = {
  RPCEntity,
};
