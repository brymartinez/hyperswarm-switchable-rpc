/**
 * Can seamlessly switch between RPC client mode and RPC server mode.
 * Communicates with Swarm Server and performs handshake.
 * If on client mode, waits for an RPC server to be alive before connecting.
 *
 * @class RPCEntity
 */
class RPCEntity {
  constructor() {}

  toServer() {}

  toClient() {}
}

module.exports = {
  RPCEntity,
};
