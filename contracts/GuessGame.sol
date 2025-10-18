// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract GuessGame is SepoliaConfig {
    uint256 public constant MIN_PLAYERS = 2;
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant ENTRY_FEE = 0.001 ether;

    enum GamePhase {
        Lobby,
        Started,
        DecryptionPending,
        Finished
    }

    struct Game {
        address creator;
        uint8 maxPlayers;
        GamePhase phase;
        address[] players;
        mapping(address => bool) joined;
        mapping(address => bool) hasGuessed;
        mapping(address => euint8) encryptedGuesses; // 1..100
        euint8 encryptedRandomA; // 1..100
        uint256 prize; // accumulated ETH

        // Results
        uint8 clearA;
        mapping(address => uint8) clearGuess;
        address winner;
        bool prizeClaimed;

        // Decryption management
        bool decryptionPending;
        uint256 latestRequestId;
    }

    uint256 public nextGameId;
    mapping(uint256 => Game) private games;
    mapping(uint256 => uint256) private requestIdToGameId;

    event GameCreated(uint256 indexed gameId, address indexed creator, uint8 maxPlayers);
    event Joined(uint256 indexed gameId, address indexed player);
    event Started(uint256 indexed gameId);
    event Guessed(uint256 indexed gameId, address indexed player);
    event DecryptionRequested(uint256 indexed gameId, uint256 requestId);
    event DecryptionCompleted(uint256 indexed gameId, uint8 clearA);
    event WinnerDecided(uint256 indexed gameId, address indexed winner, uint256 prize);
    event Claimed(uint256 indexed gameId, address indexed winner, uint256 amount);

    function createGame(uint8 maxPlayers) external returns (uint256 gameId) {
        require(maxPlayers >= MIN_PLAYERS && maxPlayers <= MAX_PLAYERS, "invalid players");
        gameId = nextGameId++;
        Game storage g = games[gameId];
        g.creator = msg.sender;
        g.maxPlayers = maxPlayers;
        g.phase = GamePhase.Lobby;
        emit GameCreated(gameId, msg.sender, maxPlayers);
    }

    function getGame(uint256 gameId)
        external
        view
        returns (
            address creator,
            uint8 maxPlayers,
            GamePhase phase,
            uint256 playerCount,
            uint256 prize,
            address winner,
            bool prizeClaimed,
            uint8 clearA
        )
    {
        Game storage g = games[gameId];
        return (
            g.creator,
            g.maxPlayers,
            g.phase,
            g.players.length,
            g.prize,
            g.winner,
            g.prizeClaimed,
            g.clearA
        );
    }

    function getPlayers(uint256 gameId) external view returns (address[] memory) {
        return games[gameId].players;
    }

    function hasJoined(uint256 gameId, address player) external view returns (bool) {
        return games[gameId].joined[player];
    }

    function hasSubmittedGuess(uint256 gameId, address player) external view returns (bool) {
        return games[gameId].hasGuessed[player];
    }

    function getEncryptedRandomA(uint256 gameId) external view returns (euint8) {
        return games[gameId].encryptedRandomA;
    }

    function getEncryptedGuess(uint256 gameId, address player) external view returns (euint8) {
        return games[gameId].encryptedGuesses[player];
    }

    function joinGame(uint256 gameId) external payable {
        Game storage g = games[gameId];
        require(g.maxPlayers != 0, "not found");
        require(g.phase == GamePhase.Lobby, "not lobby");
        require(!g.joined[msg.sender], "joined");
        require(g.players.length < g.maxPlayers, "full");
        require(msg.value == ENTRY_FEE, "fee=0.001");
        g.players.push(msg.sender);
        g.joined[msg.sender] = true;
        g.prize += msg.value;
        emit Joined(gameId, msg.sender);
    }

    function startGame(uint256 gameId) external {
        Game storage g = games[gameId];
        require(g.maxPlayers != 0, "not found");
        require(g.phase == GamePhase.Lobby, "not lobby");
        require(g.players.length == g.maxPlayers, "not ready");

        // Generate random value in [0,127], map to [0,99], then shift to [1,100]
        euint8 rnd = FHE.randEuint8(128);
        euint8 modded = FHE.rem(rnd, 100);
        g.encryptedRandomA = FHE.add(modded, 1);

        // Contract needs access later
        FHE.allowThis(g.encryptedRandomA);

        g.phase = GamePhase.Started;
        emit Started(gameId);
    }

    function submitGuess(uint256 gameId, externalEuint8 encryptedGuess, bytes calldata inputProof) external {
        Game storage g = games[gameId];
        require(g.maxPlayers != 0, "not found");
        require(g.phase == GamePhase.Started, "not started");
        require(g.joined[msg.sender], "not player");
        require(!g.hasGuessed[msg.sender], "already");

        euint8 guess = FHE.fromExternal(encryptedGuess, inputProof);
        // Clamp to [1,100]
        euint8 one = FHE.asEuint8(1);
        euint8 hundred = FHE.asEuint8(100);
        euint8 clamped = FHE.max(one, FHE.min(guess, hundred));
        g.encryptedGuesses[msg.sender] = clamped;
        g.hasGuessed[msg.sender] = true;

        // Contract needs access
        FHE.allowThis(clamped);

        emit Guessed(gameId, msg.sender);
    }

    function allGuessed(uint256 gameId) public view returns (bool) {
        Game storage g = games[gameId];
        if (g.players.length == 0) return false;
        for (uint256 i = 0; i < g.players.length; i++) {
            if (!g.hasGuessed[g.players[i]]) return false;
        }
        return true;
    }

    function endGame(uint256 gameId) external {
        Game storage g = games[gameId];
        require(g.maxPlayers != 0, "not found");
        require(g.phase == GamePhase.Started, "bad phase");
        require(allGuessed(gameId), "pending guesses");
        require(!g.decryptionPending, "pending");

        // Prepare ciphertexts: first A, then all guesses in players order
        bytes32[] memory cts = new bytes32[](1 + g.players.length);
        cts[0] = FHE.toBytes32(g.encryptedRandomA);
        for (uint256 i = 0; i < g.players.length; i++) {
            cts[1 + i] = FHE.toBytes32(g.encryptedGuesses[g.players[i]]);
        }

        uint256 reqId = FHE.requestDecryption(cts, this.decryptionCallback.selector);
        g.latestRequestId = reqId;
        g.decryptionPending = true;
        g.phase = GamePhase.DecryptionPending;
        requestIdToGameId[reqId] = gameId;

        emit DecryptionRequested(gameId, reqId);
    }

    function decryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public returns (bool) {
        uint256 gameId = requestIdToGameId[requestId];
        Game storage g = games[gameId];
        require(g.maxPlayers != 0, "not found");
        require(g.decryptionPending && g.phase == GamePhase.DecryptionPending, "not pending");

        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Expect ABI-encoded dynamic array of uint8: [A, guesses...]
        // Fallback: if not array, this call will revert; in that case, adjust as necessary.
        uint8[] memory values = abi.decode(cleartexts, (uint8[]));
        require(values.length == 1 + g.players.length, "bad len");

        uint8 A = values[0];
        g.clearA = A;
        for (uint256 i = 0; i < g.players.length; i++) {
            g.clearGuess[g.players[i]] = values[1 + i];
        }

        // Compute winner (closest to A). Ties resolved by first occurrence.
        address winner = g.players[0];
        uint256 bestDiff = _absDiff(uint256(A), uint256(values[1]));
        for (uint256 i = 1; i < g.players.length; i++) {
            uint256 d = _absDiff(uint256(A), uint256(values[1 + i]));
            if (d < bestDiff) {
                bestDiff = d;
                winner = g.players[i];
            }
        }

        g.winner = winner;
        g.decryptionPending = false;
        g.phase = GamePhase.Finished;

        emit DecryptionCompleted(gameId, A);
        emit WinnerDecided(gameId, winner, g.prize);
        return true;
    }

    function claim(uint256 gameId) external {
        Game storage g = games[gameId];
        require(g.phase == GamePhase.Finished, "not finished");
        require(!g.prizeClaimed, "claimed");
        require(msg.sender == g.winner, "not winner");
        uint256 amount = g.prize;
        g.prizeClaimed = true;
        g.prize = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        emit Claimed(gameId, msg.sender, amount);
    }

    function getClearGuess(uint256 gameId, address player) external view returns (uint8) {
        return games[gameId].clearGuess[player];
    }

    function _absDiff(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a - b : b - a;
    }
}
