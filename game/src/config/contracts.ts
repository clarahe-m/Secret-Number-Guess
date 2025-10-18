// GuessGame contract deployed on Sepolia
// Update this constant after deployment to Sepolia
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Copied from contract build ABI (kept inline to avoid importing .json in frontend)
export const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "maxPlayers", "type": "uint8" }
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "Joined",
    "type": "event"
  },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "Started", "type": "event" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "Guessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "requestId", "type": "uint256" }
    ],
    "name": "DecryptionRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "clearA", "type": "uint8" }
    ],
    "name": "DecryptionCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "prize", "type": "uint256" }
    ],
    "name": "WinnerDecided",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Claimed",
    "type": "event"
  },
  { "inputs": [ { "internalType": "uint8", "name": "maxPlayers", "type": "uint8" } ], "name": "createGame", "outputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "joinGame", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "startGame", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "internalType": "bytes32", "name": "encryptedGuess", "type": "bytes32" }, { "internalType": "bytes", "name": "inputProof", "type": "bytes" } ], "name": "submitGuess", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "endGame", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "requestId", "type": "uint256" }, { "internalType": "bytes", "name": "cleartexts", "type": "bytes" }, { "internalType": "bytes", "name": "decryptionProof", "type": "bytes" } ], "name": "decryptionCallback", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "claim", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "getEncryptedRandomA", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "internalType": "address", "name": "player", "type": "address" } ], "name": "getEncryptedGuess", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "getPlayers", "outputs": [ { "internalType": "address[]", "name": "", "type": "address[]" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "internalType": "address", "name": "player", "type": "address" } ], "name": "hasSubmittedGuess", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "internalType": "address", "name": "player", "type": "address" } ], "name": "hasJoined", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ], "name": "allGuessed", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "internalType": "address", "name": "player", "type": "address" } ], "name": "getClearGuess", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "nextGameId", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  {
    "inputs": [ { "internalType": "uint256", "name": "gameId", "type": "uint256" } ],
    "name": "getGame",
    "outputs": [
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "uint8", "name": "maxPlayers", "type": "uint8" },
      { "internalType": "uint8", "name": "phase", "type": "uint8" },
      { "internalType": "uint256", "name": "playerCount", "type": "uint256" },
      { "internalType": "uint256", "name": "prize", "type": "uint256" },
      { "internalType": "address", "name": "winner", "type": "address" },
      { "internalType": "bool", "name": "prizeClaimed", "type": "bool" },
      { "internalType": "uint8", "name": "clearA", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

