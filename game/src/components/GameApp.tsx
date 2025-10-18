import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { createPublicClient, http, getContract } from 'viem';
import { sepolia } from 'viem/chains';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Secret Number Guess</h2>
        <ConnectButton />
      </header>

      <section style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3>Create Game</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label>Players:</label>
          <input type="number" min={2} max={10} value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value || '2'))} style={{ width: 80 }} />
          <button onClick={() => createGame(maxPlayers)} disabled={!address}>Create</button>
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Games</h3>
          <button onClick={refresh}>Refresh</button>
        </div>
        {games.length === 0 && <p>No games yet.</p>}
        {games.map(({ id, data, players }) => {
          const [creator, maxP, phase, playerCount, prize, winner, prizeClaimed, clearA] = data;
          const myGuess = guessInputs[id] || '';
          return (
            <div key={id} style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div>Game #{id} • Phase: {PHASE_LABEL[phase]} • Players: {playerCount.toString()} / {maxP}</div>
                  <div>Creator: {creator}</div>
                  <div>Prize: {formatEther(prize)} ETH</div>
                  {phase === 3 && (
                    <div>Random A: {clearA} • Winner: {winner}</div>
                  )}
                  <div>Participants: {players.join(', ') || '-'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {phase === 0 && <button onClick={() => joinGame(id)} disabled={!address}>Join (0.001 ETH)</button>}
                  {phase === 0 && Number(playerCount) === maxP && (
                    <button onClick={() => startGame(id)} disabled={!address}>Start</button>
                  )}
                  {phase === 1 && (
                    <>
                      <input
                        placeholder="1-100"
                        value={myGuess}
                        onChange={(e) => setGuessInputs((s) => ({ ...s, [id]: e.target.value }))}
                        style={{ width: 90 }}
                      />
                      <button onClick={() => submitGuess(id, Math.max(1, Math.min(100, parseInt(myGuess || '0'))))} disabled={!address || !myGuess}>Submit Guess</button>
                    </>
                  )}
                  {phase === 1 && (
                    <button onClick={() => endGame(id)} disabled={!address}>End Game</button>
                  )}
                  {phase === 3 && !prizeClaimed && (
                    <button onClick={() => claim(id)} disabled={!address}>Claim</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section style={{ marginTop: 24, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h3>How to Play</h3>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li>Connect your wallet and create a new game with a chosen player count or join an existing lobby.</li>
          <li>Joining a game requires a 0.001&nbsp;ETH entry fee that builds the shared prize pool.</li>
          <li>Once the lobby is full, any participant can start the round to lock in an encrypted random number between 1 and 100.</li>
          <li>During the guessing phase, each player submits their encrypted guess in the 1&nbsp;to&nbsp;100 range.</li>
          <li>After all guesses are in, anyone can end the game to trigger decryption of the random number and every submitted guess.</li>
          <li>The player whose guess is closest to the decrypted number becomes the winner and can claim the entire prize pool.</li>
        </ol>
      </section>
    </div>
  );
}
