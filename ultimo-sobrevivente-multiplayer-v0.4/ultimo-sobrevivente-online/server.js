const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const path = require('path');
const { ATTRS, ITEM, S, SCENE_CONTEXT } = require('./game-data');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true, game: 'ultimo-sobrevivente' }));

const rooms = new Map();
const MAX_PLAYERS = 8;
const makeCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();
const makeToken = () => crypto.randomBytes(24).toString('hex');
const cleanName = s => String(s || 'Sobrevivente').trim().replace(/[<>]/g, '').slice(0, 18) || 'Sobrevivente';
const validStats = a => Array.isArray(a) && a.length === 5 && a.every(n => Number.isInteger(n) && n >= 0 && n <= 5) && a.reduce((x, y) => x + y, 0) === 10;
const alivePlayers = r => [...r.players.values()].filter(p => p.alive);

function roomState(r) {
  return {
    code: r.code, hostId: r.hostId, phase: r.phase, round: r.round,
    scene: r.phase === 'lobby' ? null : { ...S[r.round], context: SCENE_CONTEXT[r.round] },
    players: [...r.players.values()].map(p => ({
      id: p.id, name: p.name, stats: p.stats, alive: p.alive, ready: p.ready,
      choiceSubmitted: p.choice !== null, confirmed: p.confirmed, items: p.items,
      used: p.used, disconnected: p.disconnected
    })),
    results: r.results
  };
}
function broadcast(r) { io.to(r.code).emit('room-state', roomState(r)); }
function getRoom(socket) { const code = socket.data.room; return code ? rooms.get(code) : null; }
function getPlayer(r, socket) { return r && [...r.players.values()].find(p => p.socketId === socket.id); }
function fail(socket, message) { socket.emit('app-error', message); }
function calculateChance(p, option) {
  const [, attr, difficulty] = option;
  const base = { facil: 75, medio: 60, dificil: 45 }[difficulty] ?? 45;
  const attrIndex = ATTRS.findIndex(a => a[0] === attr);
  const bonus = p.items.reduce((sum, id) => {
    const item = ITEM[id];
    return sum + (item && item.attr === attr && (item.type !== 'consumivel' || !p.used.includes(id)) ? item.bonus : 0);
  }, 0);
  return Math.min(95, base + 8 * (p.stats[attrIndex] || 0) + bonus);
}
function resolveRound(r) {
  const outcomes = [];
  for (const p of alivePlayers(r)) {
    const option = S[r.round].opts[p.choice];
    const probability = calculateChance(p, option);
    const roll = 1 + Math.floor(Math.random() * 100);
    const success = roll <= probability;
    const [, attr] = option;
    const consumed = p.items.filter(id => ITEM[id]?.attr === attr && ITEM[id]?.type === 'consumivel' && !p.used.includes(id));
    p.used.push(...consumed);
    outcomes.push({ playerId: p.id, name: p.name, choice: p.choice, option: option[0], probability, roll, success, itemId: success ? (option[3] || null) : null });
  }
  const itemGroups = new Map();
  outcomes.filter(o => o.success && o.itemId).forEach(o => {
    if (!itemGroups.has(o.itemId)) itemGroups.set(o.itemId, []);
    itemGroups.get(o.itemId).push(o);
  });
  const loot = [];
  for (const [itemId, group] of itemGroups) {
    group.forEach(o => { o.lootRoll = group.length > 1 ? 1 + Math.floor(Math.random() * 20) : null; });
    const winner = [...group].sort((a, b) => (b.lootRoll || 0) - (a.lootRoll || 0))[0];
    const player = r.players.get(winner.playerId);
    player.items.push(itemId);
    loot.push({ itemId, itemName: ITEM[itemId].name, winnerId: winner.playerId, winnerName: winner.name, rolls: group.map(o => ({ playerId: o.playerId, name: o.name, roll: o.lootRoll })) });
  }
  outcomes.forEach(o => {
    const p = r.players.get(o.playerId);
    if (!o.success) p.alive = false;
    p.confirmed = !p.alive;
  });
  r.results = { round: r.round, outcomes, loot };
  r.phase = 'results';
  broadcast(r);
  io.to(r.code).emit('round-result', r.results);
}

io.on('connection', socket => {
  socket.on('create-room', ({ name, token } = {}) => {
    let code; do { code = makeCode(); } while (rooms.has(code));
    const player = { id: token || makeToken(), token: token || null, socketId: socket.id, name: cleanName(name), stats: [2,2,2,2,2], alive: true, ready: false, choice: null, confirmed: false, items: [], used: [], disconnected: false };
    player.token = player.token || player.id;
    const r = { code, hostId: player.id, phase: 'lobby', round: 0, players: new Map([[player.id, player]]), results: null };
    rooms.set(code, r); socket.join(code); socket.data.room = code; socket.data.playerId = player.id;
    socket.emit('room-created', { code, playerId: player.id, token: player.token }); broadcast(r);
  });

  socket.on('join-room', ({ code: raw, name, token } = {}) => {
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const r = rooms.get(code);
    if (!r) return fail(socket, 'Sala não encontrada. Confira o código e tente novamente.');
    const existing = token && [...r.players.values()].find(p => p.token === token);
    if (existing) {
      existing.socketId = socket.id; existing.disconnected = false;
      socket.join(code); socket.data.room = code; socket.data.playerId = existing.id;
      socket.emit('rejoined-room', { code, playerId: existing.id, token: existing.token, state: roomState(r) }); broadcast(r); return;
    }
    if (r.phase !== 'lobby') return fail(socket, 'Esta partida já começou. Não é possível entrar agora.');
    if (r.players.size >= MAX_PLAYERS) return fail(socket, 'A sala está cheia (máximo de 8 jogadores).');
    const id = makeToken();
    const player = { id, token: id, socketId: socket.id, name: cleanName(name), stats: [2,2,2,2,2], alive: true, ready: false, choice: null, confirmed: false, items: [], used: [], disconnected: false };
    r.players.set(id, player); socket.join(code); socket.data.room = code; socket.data.playerId = id;
    socket.emit('joined-room', { code, playerId: id, token: id }); broadcast(r);
  });

  socket.on('set-character', ({ stats } = {}) => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.phase !== 'lobby') return;
    if (!validStats(stats)) return fail(socket, 'Distribua exatamente 10 pontos, com no máximo 5 por atributo.');
    p.stats = stats; p.ready = true; broadcast(r);
  });
  socket.on('start-game', () => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.hostId !== p.id) return fail(socket, 'Somente o anfitrião pode iniciar.');
    if (r.phase !== 'lobby' || r.players.size < 2) return fail(socket, 'É necessário ter pelo menos 2 jogadores para começar.');
    if ([...r.players.values()].some(x => !x.ready || x.disconnected)) return fail(socket, 'Todos precisam distribuir os atributos e estar conectados e prontos.');
    r.phase = 'playing'; r.round = 0; broadcast(r); io.to(r.code).emit('game-started');
  });
  socket.on('submit-choice', ({ choice } = {}) => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.phase !== 'playing' || !p.alive) return;
    if (!Number.isInteger(choice) || choice < 0 || choice > 2) return fail(socket, 'Escolha inválida.');
    if (p.choice !== null) return fail(socket, 'Você já confirmou sua escolha nesta cena.');
    p.choice = choice; broadcast(r);
    if (alivePlayers(r).every(x => x.choice !== null)) resolveRound(r);
  });
  socket.on('confirm-next', () => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.phase !== 'results' || !p.alive) return;
    p.confirmed = true; broadcast(r);
    if (alivePlayers(r).every(x => x.confirmed)) io.to(r.code).emit('everyone-confirmed');
  });
  socket.on('advance-round', () => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.hostId !== p.id || r.phase !== 'results') return fail(socket, 'Somente o anfitrião pode avançar a cena.');
    if (alivePlayers(r).some(x => !x.confirmed)) return fail(socket, 'Ainda há sobreviventes que não confirmaram.');
    if (r.round >= 9 || alivePlayers(r).length === 0) {
      r.phase = 'finished'; broadcast(r); io.to(r.code).emit('game-finished'); return;
    }
    r.round++; r.phase = 'playing'; r.results = null;
    for (const player of r.players.values()) { player.choice = null; player.confirmed = !player.alive; }
    broadcast(r); io.to(r.code).emit('new-round', { round: r.round });
  });
  socket.on('disconnect', () => {
    const r = getRoom(socket); if (!r) return;
    const p = getPlayer(r, socket); if (p) p.disconnected = true;
    if (r.phase === 'lobby' && p) {
      r.players.delete(p.id);
      if (r.hostId === p.id) r.hostId = r.players.keys().next().value || null;
      if (!r.players.size) rooms.delete(r.code); else broadcast(r);
    } else {
      if (p && r.hostId === p.id) {
        const successor = [...r.players.values()].find(candidate => candidate.id !== p.id && !candidate.disconnected);
        if (successor) r.hostId = successor.id;
      }
      broadcast(r);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Último Sobrevivente online na porta ${PORT}`));
