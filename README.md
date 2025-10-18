# Secret Number Guess Game

A decentralized guessing game built on Ethereum Sepolia testnet utilizing Fully Homomorphic Encryption (FHE) technology powered by Zama's fhEVM. Players compete to guess a secret random number while their guesses remain encrypted until the game concludes, ensuring complete privacy and fairness.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [How It Works](#how-it-works)
- [Problems Solved](#problems-solved)
- [Project Structure](#project-structure)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Smart Contract Deployment](#smart-contract-deployment)
  - [Frontend Application](#frontend-application)
  - [Hardhat Tasks](#hardhat-tasks)
- [Game Flow](#game-flow)
- [Security Considerations](#security-considerations)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

Secret Number Guess is a blockchain-based multiplayer game where players pay an entry fee to participate and submit encrypted guesses for a random number between 1-100. The player whose guess is closest to the secret number wins the entire prize pool. Unlike traditional blockchain games, all guesses and the random number remain encrypted throughout the game using Fully Homomorphic Encryption (FHE), preventing any player from gaining an unfair advantage.

## Key Features

### Privacy-Preserving Gameplay
- **Encrypted Guesses**: All player guesses are encrypted using FHE, making them invisible to other players and external observers
- **Encrypted Random Number**: The target number is generated and stored in encrypted form, ensuring complete fairness
- **On-Chain Privacy**: Privacy is maintained entirely on-chain without relying on off-chain oracles or trusted third parties

### Decentralized and Trustless
- **Smart Contract-Based**: All game logic runs on Ethereum smart contracts, eliminating the need for centralized game servers
- **Verifiable Randomness**: Random number generation uses fhEVM's cryptographically secure random functions
- **Transparent Decryption**: Winners are determined through verifiable decryption proofs

### Flexible Game Configuration
- **Configurable Player Count**: Support for 2-10 players per game
- **Multiple Concurrent Games**: Unlimited parallel game sessions
- **Entry Fee System**: 0.001 ETH entry fee per player creates a prize pool
- **Winner-Takes-All**: Complete prize pool awarded to the closest guesser

### Modern Web3 Integration
- **RainbowKit Wallet Support**: Seamless wallet connection experience
- **React Frontend**: Modern, responsive UI built with React and TypeScript
- **Real-time Updates**: Live game state updates and player tracking
- **Viem/Wagmi Integration**: Type-safe contract interactions

## Technology Stack

### Smart Contract Layer
- **Solidity 0.8.27**: Smart contract programming language
- **fhEVM (@fhevm/solidity)**: Zama's Fully Homomorphic Encryption library for Ethereum
- **Hardhat**: Development environment, testing framework, and deployment tools
- **TypeChain**: TypeScript bindings for smart contracts
- **Hardhat Deploy**: Deployment management and versioning

### Frontend Layer
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **Viem 2**: Low-level Ethereum library
- **Wagmi 2**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI
- **Ethers.js 6**: Ethereum wallet implementation
- **Zama Relayer SDK**: FHE encryption/decryption client-side support

### Development Tools
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting
- **Solhint**: Solidity linting
- **Mocha/Chai**: Testing framework
- **Hardhat Network Helpers**: Testing utilities

## How It Works

### Game Creation and Setup
1. **Create Game**: Any user can create a game by specifying the maximum number of players (2-10)
2. **Join Game**: Players join by paying the 0.001 ETH entry fee, which adds to the prize pool
3. **Start Game**: Once the maximum number of players join, anyone can start the game
4. **Random Generation**: Upon starting, the contract generates an encrypted random number between 1-100

### Encrypted Gameplay
1. **Submit Guesses**: Each player submits an encrypted guess (1-100) using client-side FHE encryption
2. **Clamping**: Guesses are automatically clamped to the valid range [1,100] in encrypted form
3. **Privacy Preservation**: All guesses remain encrypted and invisible to other players
4. **Completion Check**: The contract tracks when all players have submitted guesses

### Winner Determination
1. **Request Decryption**: After all guesses are submitted, decryption is requested from the Zama decryption oracle
2. **Batch Decryption**: The random number and all player guesses are decrypted together
3. **Winner Calculation**: The contract calculates which guess is closest to the random number
4. **Tie Resolution**: In case of ties, the first player to submit the tied guess wins
5. **Prize Distribution**: The winner can claim the entire prize pool

### Technical Implementation Details

#### FHE Operations
- **euint8 Type**: 8-bit encrypted integers for numbers and guesses
- **Encrypted Comparisons**: All validations performed on encrypted values
- **Secure Random**: `FHE.randEuint8()` provides cryptographically secure randomness
- **Access Control**: `FHE.allowThis()` manages contract permissions for encrypted values

#### Decryption Process
- **Asynchronous Decryption**: Oracle-based decryption with callback pattern
- **Batch Processing**: Multiple encrypted values decrypted in a single request
- **Verification**: Decryption proofs verified via `FHE.checkSignatures()`
- **State Management**: Game phases track decryption lifecycle

## Problems Solved

### 1. On-Chain Privacy
**Problem**: Traditional blockchain games expose all data publicly, allowing players to see others' moves and game state, enabling cheating and unfair advantages.

**Solution**: Using Zama's fhEVM, all sensitive game data (guesses and random numbers) remain encrypted on-chain. Players cannot see or infer others' guesses, creating truly fair gameplay.

### 2. Verifiable Randomness Without Oracles
**Problem**: Generating fair random numbers on blockchain typically requires complex oracle solutions (VRF) or is vulnerable to manipulation.

**Solution**: fhEVM provides native encrypted random number generation that remains hidden until intentionally decrypted, ensuring no party can predict or manipulate the outcome.

### 3. Front-Running Protection
**Problem**: In typical blockchain games, players can observe pending transactions and front-run favorable moves.

**Solution**: Since all guesses are encrypted before submission, front-running provides no advantage as the encrypted values are meaningless to observers.

### 4. Trustless Prize Distribution
**Problem**: Traditional online games require trusted servers to manage prize pools and determine winners.

**Solution**: Smart contracts autonomously manage the entire game lifecycle, prize pool, and winner determination with mathematical certainty.

### 5. Client-Side Privacy
**Problem**: Encryption schemes requiring server-side key management introduce central points of failure and trust.

**Solution**: FHE allows computation on encrypted data without exposing private keys, enabling fully client-side encryption with on-chain computation.

### 6. Scalable Multi-Game Architecture
**Problem**: Single-game contracts don't scale well for multiple concurrent games.

**Solution**: Our contract supports unlimited concurrent game sessions with isolated state and efficient storage patterns.

## Project Structure

```
Secret-Number-Guess/
├── contracts/                    # Solidity smart contracts
│   └── GuessGame.sol            # Main game contract with FHE
├── game/                        # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── GameApp.tsx     # Main game interface
│   │   │   └── Header.tsx      # Header component
│   │   ├── config/
│   │   │   └── contracts.ts    # Contract ABI and address
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useEthersSigner.ts
│   │   │   └── useZamaInstance.ts  # FHE initialization
│   │   ├── App.tsx             # Root component
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   └── vite.config.ts
├── deploy/                      # Deployment scripts
│   └── 01_deploy_guess_game.ts
├── tasks/                       # Hardhat CLI tasks
│   └── GuessGame.ts            # Game management tasks
├── test/                        # Contract tests
│   └── GuessGame.ts            # Test suite
├── hardhat.config.ts           # Hardhat configuration
├── package.json                # Root dependencies
└── README.md                   # This file
```

## Smart Contract Architecture

### GuessGame Contract

#### State Variables
- `nextGameId`: Counter for game IDs
- `games`: Mapping of game ID to Game struct
- `requestIdToGameId`: Maps decryption requests to games

#### Game Struct
```solidity
struct Game {
    address creator;                      // Game creator
    uint8 maxPlayers;                    // Maximum players (2-10)
    GamePhase phase;                     // Current phase
    address[] players;                   // Player addresses
    mapping(address => bool) joined;     // Join status
    mapping(address => bool) hasGuessed; // Guess status
    mapping(address => euint8) encryptedGuesses;  // Encrypted guesses
    euint8 encryptedRandomA;            // Encrypted target number
    uint256 prize;                       // Prize pool
    uint8 clearA;                        // Decrypted target (after game)
    mapping(address => uint8) clearGuess; // Decrypted guesses
    address winner;                      // Winner address
    bool prizeClaimed;                   // Prize claim status
    bool decryptionPending;             // Decryption in progress
    uint256 latestRequestId;            // Decryption request ID
}
```

#### Game Phases
1. **Lobby**: Waiting for players to join
2. **Started**: Game active, collecting guesses
3. **DecryptionPending**: Waiting for oracle decryption
4. **Finished**: Game complete, winner determined

#### Key Functions

**createGame(uint8 maxPlayers)**
- Creates new game with specified player count
- Validates maxPlayers between MIN_PLAYERS (2) and MAX_PLAYERS (10)
- Emits GameCreated event

**joinGame(uint256 gameId)**
- Adds player to game with 0.001 ETH entry fee
- Validates game is in Lobby phase
- Checks player hasn't already joined
- Adds entry fee to prize pool

**startGame(uint256 gameId)**
- Initiates game when full
- Generates encrypted random number (1-100)
- Transitions to Started phase
- Sets up FHE permissions

**submitGuess(uint256 gameId, externalEuint8 encryptedGuess, bytes inputProof)**
- Accepts encrypted guess from player
- Validates player is in game and hasn't guessed
- Clamps guess to valid range [1,100] in encrypted form
- Stores encrypted guess

**endGame(uint256 gameId)**
- Triggers when all players have guessed
- Requests batch decryption of target and all guesses
- Transitions to DecryptionPending phase

**decryptionCallback(uint256 requestId, bytes cleartexts, bytes decryptionProof)**
- Called by Zama oracle with decrypted values
- Verifies decryption proof
- Determines winner (closest guess)
- Updates game to Finished phase
- Emits WinnerDecided event

**claim(uint256 gameId)**
- Allows winner to claim prize pool
- Validates game is finished and caller is winner
- Transfers prize to winner
- Prevents double claims

#### Events
- `GameCreated(gameId, creator, maxPlayers)`
- `Joined(gameId, player)`
- `Started(gameId)`
- `Guessed(gameId, player)`
- `DecryptionRequested(gameId, requestId)`
- `DecryptionCompleted(gameId, clearA)`
- `WinnerDecided(gameId, winner, prize)`
- `Claimed(gameId, winner, amount)`

## Prerequisites

### Software Requirements
- **Node.js**: v20 or higher
- **npm**: v7.0.0 or higher
- **Git**: Latest version

### Accounts and API Keys
- **Ethereum Wallet**: With Sepolia testnet ETH
- **Infura Account**: For Sepolia RPC access (optional, can use public RPC)
- **Etherscan API Key**: For contract verification (optional)

### Get Sepolia Testnet ETH
- [Sepolia Faucet 1](https://sepoliafaucet.com/)
- [Sepolia Faucet 2](https://www.alchemy.com/faucets/ethereum-sepolia)

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/Secret-Number-Guess.git
cd Secret-Number-Guess
```

### 2. Install Smart Contract Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd game
npm install
cd ..
```

### 4. Configure Environment Variables

Create `.env` file in the root directory:

```env
# Deployment wallet private key
PRIVATE_KEY=your_wallet_private_key_here

# Infura API key (optional)
INFURA_API_KEY=your_infura_key_here

# Etherscan API key (optional, for verification)
ETHERSCAN_API_KEY=your_etherscan_key_here
```

**Security Warning**: Never commit `.env` file or expose private keys!

### 5. Configure Hardhat Variables (Alternative to .env)
```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

## Usage

### Smart Contract Deployment

#### Compile Contracts
```bash
npm run compile
```

#### Run Tests
```bash
npm test
```

#### Deploy to Sepolia Testnet
```bash
npm run deploy:sepolia
```

After deployment, note the contract address and update `game/src/config/contracts.ts`:
```typescript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

#### Verify Contract on Etherscan
```bash
npm run verify:sepolia
```

### Frontend Application

#### Development Mode
```bash
cd game
npm run dev
```

The application will be available at `http://localhost:5173`

#### Production Build
```bash
cd game
npm run build
npm run preview
```

#### Linting and Formatting
```bash
# Lint TypeScript
npm run lint

# Check formatting
npm run prettier:check

# Auto-fix formatting
npm run prettier:write
```

### Hardhat Tasks

The project includes convenient Hardhat tasks for contract interaction:

#### Get Contract Address
```bash
npx hardhat game:address --network sepolia
```

#### Create New Game
```bash
# Create game for 5 players
npx hardhat game:create --max 5 --network sepolia
```

#### Join Game
```bash
# Join game #0
npx hardhat game:join --id 0 --network sepolia
```

#### Start Game
```bash
# Start game #0 (when full)
npx hardhat game:start --id 0 --network sepolia
```

#### Submit Guess
```bash
# Submit encrypted guess of 42 for game #0
npx hardhat game:guess --id 0 --value 42 --network sepolia
```

#### End Game
```bash
# End game #0 (after all players guessed)
npx hardhat game:end --id 0 --network sepolia
```

#### Claim Prize
```bash
# Claim prize for game #0 (winner only)
npx hardhat game:claim --id 0 --network sepolia
```

## Game Flow

### Complete Game Lifecycle

```
1. CREATE GAME
   └─> Creator sets max players (2-10)
       └─> Game enters LOBBY phase

2. JOIN GAME
   └─> Players pay 0.001 ETH entry fee
       └─> Prize pool accumulates
           └─> When full, ready to start

3. START GAME
   └─> Encrypted random number generated (1-100)
       └─> Game enters STARTED phase

4. SUBMIT GUESSES
   └─> Each player encrypts guess client-side
       └─> Submits encrypted guess + proof
           └─> Contract validates and stores

5. END GAME
   └─> After all players submit guesses
       └─> Request decryption from oracle
           └─> Game enters DECRYPTION_PENDING phase

6. DECRYPTION CALLBACK
   └─> Oracle returns decrypted values + proof
       └─> Contract verifies proof
           └─> Calculates closest guess
               └─> Determines winner
                   └─> Game enters FINISHED phase

7. CLAIM PRIZE
   └─> Winner calls claim()
       └─> Prize pool transferred to winner
           └─> Game complete
```

### Frontend User Journey

1. **Connect Wallet**: Click "Connect Wallet" button (RainbowKit)
2. **Create Game**: Set player count and create new game
3. **Join Game**: Pay 0.001 ETH to join existing game in lobby
4. **Wait for Players**: Monitor lobby until game is full
5. **Start Game**: Click "Start" when game is full
6. **Submit Guess**: Enter number (1-100) and submit encrypted guess
7. **End Game**: Click "End Game" after all players guess
8. **Wait for Decryption**: Oracle processes decryption request
9. **View Results**: See random number, all guesses, and winner
10. **Claim Prize**: Winner clicks "Claim" to receive prize pool

## Security Considerations

### Smart Contract Security
- **Reentrancy Protection**: Prize claims use checks-effects-interactions pattern
- **Access Control**: Phase-based state machine prevents invalid operations
- **Input Validation**: All user inputs validated and clamped
- **Integer Overflow**: Solidity 0.8+ has built-in overflow protection
- **FHE Permissions**: Explicit permission management for encrypted values

### FHE Security
- **Encrypted Storage**: All sensitive values stored as euint8
- **Client-Side Encryption**: Users encrypt guesses before submission
- **Proof Verification**: Input proofs and decryption proofs verified
- **No Cleartext Leakage**: Values never exposed until game completion

### Frontend Security
- **Type Safety**: TypeScript prevents common errors
- **Input Sanitization**: User inputs validated before encryption
- **Wallet Security**: RainbowKit provides secure wallet integration
- **No Private Keys**: Never stores or transmits private keys

### Known Limitations
1. **Decryption Oracle Dependency**: Relies on Zama's decryption oracle availability
2. **Gas Costs**: FHE operations are more expensive than standard operations
3. **Sepolia Testnet**: Currently deployed on testnet, not production mainnet
4. **Manual Refresh**: Frontend requires manual refresh for state updates

## Future Roadmap

### Phase 1: Enhanced User Experience (Q2 2025)
- [ ] Real-time game state updates using WebSocket/events
- [ ] Automatic UI refresh when game state changes
- [ ] Player notifications for game progression
- [ ] Game history and player statistics
- [ ] Leaderboard system
- [ ] Mobile-responsive UI improvements

### Phase 2: Advanced Features (Q3 2025)
- [ ] Multiple game modes (range variations, multi-round)
- [ ] Tournament system with bracket elimination
- [ ] Customizable entry fees
- [ ] Partial prize distribution (1st, 2nd, 3rd place)
- [ ] Game creator rewards/incentives
- [ ] Social features (chat, friend invites)

### Phase 3: Economic Enhancements (Q4 2025)
- [ ] Token rewards system
- [ ] Staking mechanisms
- [ ] Dynamic entry fees based on player count
- [ ] Treasury/protocol fees for sustainability
- [ ] NFT achievements and rewards
- [ ] Referral program

### Phase 4: Cross-Chain and Scaling (Q1 2026)
- [ ] L2 deployment (Arbitrum, Optimism, Base)
- [ ] Cross-chain game participation
- [ ] Gas optimization improvements
- [ ] Batch operations for multiple games
- [ ] Off-chain computation with on-chain verification

### Phase 5: Mainnet and Production (Q2 2026)
- [ ] Professional security audit
- [ ] Mainnet deployment
- [ ] Insurance/prize pool protection
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Mobile native applications

### Research and Innovation
- [ ] Zero-Knowledge proof integration
- [ ] Alternative FHE schemes comparison
- [ ] Decentralized oracle solutions
- [ ] AI-powered game balancing
- [ ] Multi-party computation experiments

### Community and Governance
- [ ] DAO governance structure
- [ ] Community-driven game parameters
- [ ] Open-source contribution guidelines
- [ ] Bug bounty program
- [ ] Developer documentation and SDKs

## Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write tests for new features
- Update documentation for significant changes
- Ensure all tests pass before submitting PR
- Use meaningful commit messages

### Areas for Contribution
- Smart contract optimizations
- Frontend UI/UX improvements
- Test coverage expansion
- Documentation improvements
- Bug fixes and security enhancements
- New game modes and features

## License

This project is licensed under the **BSD-3-Clause-Clear License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
- fhEVM: BSD-3-Clause-Clear License
- Hardhat: MIT License
- React: MIT License
- OpenZeppelin Contracts: MIT License

---

## Support and Community

### Resources
- **Documentation**: [Zama fhEVM Docs](https://docs.zama.ai/fhevm)
- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/Secret-Number-Guess/issues)
- **Discussions**: [Community discussions](https://github.com/yourusername/Secret-Number-Guess/discussions)

### Contact
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)
- **Discord**: [Join our server](https://discord.gg/yourserver)
- **Email**: your.email@example.com

---

## Acknowledgments

Special thanks to:
- **Zama** for pioneering FHE technology and fhEVM
- **Hardhat** team for excellent development tools
- **RainbowKit** and **Wagmi** for seamless Web3 integration
- **OpenZeppelin** for secure smart contract libraries
- The broader Ethereum and Web3 community

---

**Built with privacy, powered by FHE, secured by blockchain.**

*Last updated: January 2025*
