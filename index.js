const { RPCEntity } = require("./rpc-entity");
const { Server } = require("./server");
const cli = require("./cli");

async function main() {
  // node index client
  // node index server
  switch (process.argv[2]) {
    case "server":
      const server = new Server();
      break;
    case "client":
      const client = new RPCEntity();
      await cli.prompt(client);
      break;
    default:
      throw new Error(`Mode ${process.argv[2]} not recognized.`);
  }
}

main();
