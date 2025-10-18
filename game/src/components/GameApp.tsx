import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { createPublicClient, http, getContract } from 'viem';
import { sepolia } from 'viem/chains';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import './GameApp.css';

type GameTuple = [
  string, // creator
  number, // maxPlayers (uint8)
  number, // phase (uint8)
  bigint, // playerCount
  bigint, // prize
  string, // winner
  boolean, // prizeClaimed
  number // clearA (uint8)
];

const PHASE_LABEL: Record<number, string> = {
  0: 'Lobby',
  1: 'Started',
  2: 'DecryptionPending',
  3: 'Finished'
};

const PHASE_COLOR: Record<number, string> = {
  0: '#3b82f6',
  1: '#10b981',
  2: '#f59e0b',
  3: '#8b5cf6'
};

export function GameApp() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance } = useZamaInstance();

  const client = useMemo(() => createPublicClient({ chain: sepolia, transport: http() }), []);
  const [nextId, setNextId] = useState<bigint>(0n);
  const [games, setGames] = useState<{ id: number; data: GameTuple; players: string[] }[]>([]);

  const contractViem = useMemo(() => getContract({ address: CONTRACT_ADDRESS as `0x${string}` , abi: CONTRACT_ABI, client }), [client]);

  async function refresh() {
    try {
      const nid = (await contractViem.read.nextGameId()) as bigint;
      setNextId(nid);
      const items: { id: number; data: GameTuple; players: string[] }[] = [];
      for (let i = 0n; i < nid; i++) {
        const data = (await contractViem.read.getGame([i])) as unknown as GameTuple;
        const players = (await contractViem.read.getPlayers([i])) as string[];
        items.push({ id: Number(i), data, players });
      }
      setGames(items);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createGame(maxPlayers: number) {
    const signer = await signerPromise;
    if (!signer) return;
    const ethersContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, await signer);
    const tx = await ethersContract.createGame(maxPlayers);
    await tx.wait();
    await refresh();
  }

  async function joinGame(id: number) {
    const signer = await signerPromise;
    if (!signer) return;
    const ethersContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, await signer);
    const tx = await ethersContract.joinGame(id, { value: parseEther('0.001') });
    await tx.wait();
    await refresh();
  }

  async function startGame(id: number) {
    const signer = await signerPromise;
    if (!signer) return;
    const ethersContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, await signer);
    const tx = await ethersContract.startGame(id);
    await tx.wait();
    await refresh();
  }

  async function submitGuess(id: number, guess: number) {
    if (!address || !instance) return;
    const signer = await signerPromise;
    if (!signer) return;
    const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
    input.add8(guess);
    const encrypted = await input.encrypt();
    const ethersContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, await signer);
    const tx = await ethersContract.submitGuess(id, encrypted.handles[0], encrypted.inputProof);
    await tx.wait();
    await refresh();
  }

  async function endGame(id: number) {
    const signer = await signerPromise;
    if (!signer) return;
    const ethersContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, await signer);
    const tx = await ethersContract.endGame(id);
    await tx.wait();
    await refresh();
  }

  async function claim(id: number) {
    const signer = await signerPromise;
    if (!signer) return;
    const ethersContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, await signer);
    const tx = await ethersContract.claim(id);
    await tx.wait();
    await refresh();
  }

  const [maxPlayers, setMaxPlayers] = useState(2);
  const [guessInputs, setGuessInputs] = useState<Record<number, string>>({});

  return (
    <div className="game-container">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🎲</div>
            <div>
              <h1 className="title">Secret Number Guess</h1>
              <p className="subtitle">Privacy-First Blockchain Gaming</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="main-content">
        <div className="create-game-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🎮 Create New Game</h2>
            </div>
            <div className="create-game-form">
              <div className="form-group">
                <label className="label">Number of Players</label>
                <select
                  className="select-input"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} Players</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={() => createGame(maxPlayers)}
                disabled={!address}
              >
                {address ? '🚀 Create Game' : '🔒 Connect Wallet First'}
              </button>
            </div>
          </div>
        </div>

        <div className="games-section">
          <div className="section-header">
            <h2 className="section-title">🎯 Active Games</h2>
            <button className="btn btn-secondary" onClick={refresh}>
              🔄 Refresh
            </button>
          </div>

          {games.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎲</div>
              <h3>No games yet</h3>
              <p>Be the first to create a game!</p>
            </div>
          ) : (
            <div className="games-grid">
              {games.map(({ id, data, players }) => {
                const [, maxP, phase, playerCount, prize, winner, prizeClaimed, clearA] = data;
                const myGuess = guessInputs[id] || '';
                const isWinner = address && winner.toLowerCase() === address.toLowerCase();

                return (
                  <div key={id} className="game-card">
                    <div className="game-card-header">
                      <div className="game-id">Game #{id}</div>
                      <span
                        className="phase-badge"
                        style={{ backgroundColor: PHASE_COLOR[phase] }}
                      >
                        {PHASE_LABEL[phase]}
                      </span>
                    </div>

                    <div className="game-info">
                      <div className="info-row">
                        <span className="info-label">👥 Players</span>
                        <span className="info-value">{playerCount.toString()} / {maxP}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">💰 Prize Pool</span>
                        <span className="info-value prize">{formatEther(prize)} ETH</span>
                      </div>
                      {phase === 3 && (
                        <>
                          <div className="info-row">
                            <span className="info-label">🎲 Secret Number</span>
                            <span className="info-value highlight">{clearA}</span>
                          </div>
                          {isWinner && (
                            <div className="winner-badge">
                              🏆 You Won!
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {players.length > 0 && (
                      <div className="players-list">
                        <div className="players-label">Participants:</div>
                        <div className="players-addresses">
                          {players.map((p, idx) => (
                            <div
                              key={idx}
                              className={`player-address ${p.toLowerCase() === address?.toLowerCase() ? 'is-you' : ''}`}
                              title={p}
                            >
                              {p.toLowerCase() === address?.toLowerCase() ? '👤 You' : `${p.slice(0, 6)}...${p.slice(-4)}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="game-actions">
                      {phase === 0 && (
                        <>
                          <button
                            className="btn btn-primary btn-block"
                            onClick={() => joinGame(id)}
                            disabled={!address}
                          >
                            💎 Join (0.001 ETH)
                          </button>
                          {Number(playerCount) === maxP && (
                            <button
                              className="btn btn-success btn-block"
                              onClick={() => startGame(id)}
                              disabled={!address}
                            >
                              ▶️ Start Game
                            </button>
                          )}
                        </>
                      )}

                      {phase === 1 && (
                        <>
                          <div className="guess-input-group">
                            <input
                              type="number"
                              className="guess-input"
                              placeholder="Enter 1-100"
                              min="1"
                              max="100"
                              value={myGuess}
                              onChange={(e) => setGuessInputs((s) => ({ ...s, [id]: e.target.value }))}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={() => submitGuess(id, Math.max(1, Math.min(100, parseInt(myGuess || '0'))))}
                              disabled={!address || !myGuess}
                            >
                              🔐 Submit
                            </button>
                          </div>
                          <button
                            className="btn btn-warning btn-block"
                            onClick={() => endGame(id)}
                            disabled={!address}
                          >
                            🏁 End Game
                          </button>
                        </>
                      )}

                      {phase === 2 && (
                        <div className="loading-state">
                          <div className="spinner"></div>
                          <span>Decrypting results...</span>
                        </div>
                      )}

                      {phase === 3 && !prizeClaimed && isWinner && (
                        <button
                          className="btn btn-success btn-block btn-glow"
                          onClick={() => claim(id)}
                          disabled={!address}
                        >
                          🏆 Claim Prize
                        </button>
                      )}

                      {phase === 3 && prizeClaimed && (
                        <div className="claimed-state">
                          ✅ Prize Claimed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="how-to-play-section">
          <div className="card card-accent">
            <div className="card-header">
              <h2 className="card-title">📖 How to Play</h2>
            </div>
            <div className="how-to-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Connect & Create</h4>
                  <p>Connect your wallet and create a new game or join an existing lobby</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Pay Entry Fee</h4>
                  <p>Join with 0.001 ETH that builds the shared prize pool</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Game Starts</h4>
                  <p>An encrypted random number (1-100) is generated on-chain</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Submit Guess</h4>
                  <p>Enter your encrypted guess between 1 and 100</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h4>Reveal Results</h4>
                  <p>After all guesses, trigger decryption to reveal the winner</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">6</div>
                <div className="step-content">
                  <h4>Claim Prize</h4>
                  <p>The closest guess wins the entire prize pool!</p>
                </div>
              </div>
            </div>
            <div className="privacy-note">
              <div className="privacy-icon">🔒</div>
              <div>
                <strong>Privacy Guaranteed:</strong> All guesses and the random number remain encrypted using Fully Homomorphic Encryption (FHE) until the game ends.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
