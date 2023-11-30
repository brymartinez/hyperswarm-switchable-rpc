const readline = require("readline");
class CLI {
  constructor(client) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "> ",
    });
  }

  async prompt(client) {
    this.rl.prompt();

    this.rl.on("line", async (line) => {
      const args = line.trim().split(" ");

      if (args[0] === "go") {
        // it's an internal command to switch
        switch (args[1]) {
          case "server":
            break;
          case "client":
            break;
          default:
            console.error(`Unknown RPC mode: ${args[1]}`);
        }
      }

      this.rl.prompt();
    });
  }
}

module.exports = new CLI();
