import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

// Print address
task("game:address", "Print GuessGame address").setAction(async (_, hre) => {
  const d = await hre.deployments.get("GuessGame");
  console.log("GuessGame:", d.address);
});

task("game:create", "Create new game")
  .addParam("max", "Max players (2-10)")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const max = parseInt(args.max);
    const d = await deployments.get("GuessGame");
    const c = await ethers.getContractAt("GuessGame", d.address);
    const tx = await c.createGame(max);
    const rc = await tx.wait();
    const ev = rc?.logs?.find((l) => (l as any).fragment?.name === "GameCreated");
    console.log("tx:", tx.hash);
    if (ev) {
      const gameId = (ev as any).args?.gameId?.toString?.();
      console.log("gameId:", gameId);
    }
  });

task("game:join", "Join game")
  .addParam("id", "Game id")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const id = parseInt(args.id);
    const d = await deployments.get("GuessGame");
    const c = await ethers.getContractAt("GuessGame", d.address);
    const tx = await c.joinGame(id, { value: ethers.parseEther("0.001") });
    console.log("tx:", tx.hash);
    await tx.wait();
  });

task("game:start", "Start game")
  .addParam("id", "Game id")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const id = parseInt(args.id);
    const d = await deployments.get("GuessGame");
    const c = await ethers.getContractAt("GuessGame", d.address);
    const tx = await c.startGame(id);
    console.log("tx:", tx.hash);
    await tx.wait();
  });

task("game:guess", "Submit encrypted guess [1..100]")
  .addParam("id", "Game id")
  .addParam("value", "Guess value (1..100)")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const id = parseInt(args.id);
    const value = parseInt(args.value);

    await fhevm.initializeCLIApi();

    const d = await deployments.get("GuessGame");
    const [signer] = await ethers.getSigners();

    const enc = await fhevm
      .createEncryptedInput(d.address, signer.address)
      .add8(value)
      .encrypt();

    const c = await ethers.getContractAt("GuessGame", d.address);
    const tx = await c.submitGuess(id, enc.handles[0], enc.inputProof);
    console.log("tx:", tx.hash);
    await tx.wait();
  });

task("game:end", "End game and request decryption")
  .addParam("id", "Game id")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const id = parseInt(args.id);
    const d = await deployments.get("GuessGame");
    const c = await ethers.getContractAt("GuessGame", d.address);
    const tx = await c.endGame(id);
    console.log("tx:", tx.hash);
    await tx.wait();
  });

task("game:claim", "Claim prize (winner only)")
  .addParam("id", "Game id")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const id = parseInt(args.id);
    const d = await deployments.get("GuessGame");
    const c = await ethers.getContractAt("GuessGame", d.address);
    const tx = await c.claim(id);
    console.log("tx:", tx.hash);
    await tx.wait();
  });

