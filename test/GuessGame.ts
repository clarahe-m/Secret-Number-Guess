import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("GuessGame", function () {
  before(function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }
  });

  it("create, join, start, submit guess", async function () {
    const [deployer, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("GuessGame");
    const game = await factory.deploy();
    const addr = await game.getAddress();

    // Create game for 2 players
    await (await game.connect(deployer).createGame(2)).wait();
    const next = await game.nextGameId();
    const gameId = (next - 1n) as unknown as number;

    // Debug check created game
    const info = await game.getGame(0n);
    console.log('gameId', gameId, 'creator', info[0], 'max', info[1], 'phase', info[2], 'players', info[3].toString());
    expect(info[1]).to.equal(2); // maxPlayers

    // Join with correct fee
    try {
      await game.connect(alice).joinGame(0n, { value: 1000000000000000n });
    } catch (e:any) {
      console.error('join revert', e?.message);
      throw e;
    }
    await expect(game.connect(bob).joinGame(0n, { value: 1000000000000000n })).to.not.be.reverted;

    // Cannot start before ready
    // Now ready, start
    await expect(game.connect(deployer).startGame(gameId)).to.not.be.reverted;

    // Encrypted guess submission
    await fhevm.initializeCLIApi();
    const encAlice = await fhevm.createEncryptedInput(addr, alice.address).add8(77).encrypt();
    const encBob = await fhevm.createEncryptedInput(addr, bob.address).add8(42).encrypt();

    await expect(
      game.connect(alice).submitGuess(gameId, encAlice.handles[0], encAlice.inputProof)
    ).to.emit(game, "Guessed");
    await expect(game.connect(bob).submitGuess(gameId, encBob.handles[0], encBob.inputProof)).to.emit(
      game,
      "Guessed",
    );

    // Decrypt stored encrypted guess to verify correctness
    const encStoredAlice = await game.getEncryptedGuess(gameId, alice.address);
    const clearAlice = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encStoredAlice,
      addr,
      alice,
    );
    expect(clearAlice).to.equal(77);

    const encStoredBob = await game.getEncryptedGuess(gameId, bob.address);
    const clearBob = await fhevm.userDecryptEuint(FhevmType.euint8, encStoredBob, addr, bob);
    expect(clearBob).to.equal(42);

    // Encrypted random A must be initialized (not ZeroHash)
    const encA = await game.getEncryptedRandomA(gameId);
    expect(encA).to.not.equal(ethers.ZeroHash);
  });
});
