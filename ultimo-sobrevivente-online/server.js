const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const path = require('path');
const { ATTRS, ITEM, S, SCENE_CONTEXT, ZOMBIE_DIFFICULTIES, STAGE_MODIFIERS } = require('./game-data');
const { hasItem, getPlayerOptions, chanceFor } = require('./game-rules');

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
function roomState(r, viewer) {
  const revealChoices = r.phase === 'results' || (alivePlayers(r).length > 0 && alivePlayers(r).every(p => p.choice !== null));
  const stageModifier = STAGE_MODIFIERS[r.round] ?? 0;
  const scene = r.phase === 'lobby' ? null : {
    ...S[r.round], context: SCENE_CONTEXT[r.round],
    opts: viewer ? getPlayerOptions(viewer, r.round) : S[r.round].opts,
    stageModifier,
    zombieModifier: ZOMBIE_DIFFICULTIES[r.zombieDifficulty]?.modifier ?? 0
  };
  return {
    code: r.code, hostId: r.hostId, phase: r.phase, round: r.round,
    zombieDifficulty: r.zombieDifficulty,
    zombieDifficultyLabel: ZOMBIE_DIFFICULTIES[r.zombieDifficulty]?.label || 'Normal',
    scene,
    players: [...r.players.values()].map(p => ({
      id: p.id, name: p.name, stats: p.stats, alive: p.alive, ready: p.ready,
      choiceSubmitted: revealChoices ? p.choice !== null : (!!viewer && viewer.id === p.id && p.choice !== null), choiceIndex: (revealChoices || (!!viewer && viewer.id === p.id)) ? p.choice : null, choiceLabel: (revealChoices || (!!viewer && viewer.id === p.id)) ? (p.choiceLabel || null) : null, confirmed: p.confirmed, items: p.items,
      used: p.used, disconnected: p.disconnected
    })),
    results: r.results,
    endReason: r.endReason || null
  };
}
function broadcast(r) {
  for (const p of r.players.values()) {
    if (p.socketId) io.to(p.socketId).emit('room-state', roomState(r, p));
  }
}
function getRoom(socket) { const code = socket.data.room; return code ? rooms.get(code) : null; }
function getPlayer(r, socket) { return r && [...r.players.values()].find(p => p.socketId === socket.id); }
function fail(socket, message) { socket.emit('app-error', message); }
function finishCampaign(r, reason) {
  r.phase = 'finished'; r.endReason = reason;
  broadcast(r);
  io.to(r.code).emit('game-finished');
}
function resolveRound(r) {
  const outcomes = [];
  for (const p of alivePlayers(r)) {
    const options = getPlayerOptions(p, r.round);
    const option = options[p.choice];
    if (!option) continue;
    const probability = chanceFor(p, option, r.round, r.zombieDifficulty);
    const roll = 1 + Math.floor(Math.random() * 100);
    const success = roll <= probability;
    const [, attr] = option;
    const meta = option[4] || {};
    const consumed = Array.isArray(meta.consumes) ? meta.consumes.filter(id => hasItem(p, id)) : [];
    if (meta.usesAmmo && hasItem(p, 'municao') && !consumed.includes('municao')) consumed.push('municao');
    if (meta.usesSignal && hasItem(p, 'sinal') && !consumed.includes('sinal')) consumed.push('sinal');
    if (consumed.length) p.used.push(...consumed);
    if (success && meta.consumeOnSuccess && meta.specialItem && hasItem(p, meta.specialItem)) p.used.push(meta.specialItem);
    let protectedByVest = false;
    if (!success && hasItem(p, 'colete') && !consumed.includes('colete')) {
      p.used.push('colete');
      protectedByVest = true;
    }
    const deathReason = !success ? `Você tentou ${option[0].toLowerCase()}, mas falhou no teste de ${attr}. Sua rolagem foi ${roll}, acima da chance de ${probability}%. ${r.round >= 8 ? 'O Anfitrião aproveitou a abertura e atacou antes que você alcançasse o navio.' : r.round >= 4 ? 'Os infectados rápidos alcançaram você antes da fuga.' : 'Os infectados cercaram você e impediram sua fuga.'}` : null;
    outcomes.push({
      playerId: p.id, name: p.name, choice: p.choice, option: option[0], probability, roll, success, deathReason,
      itemId: success ? (option[3] || null) : null,
      specialItem: meta.specialItem || null,
      consumed,
      protectedByVest
    });
  }
  const itemGroups = new Map();
  outcomes.filter(o => o.success && o.itemId).forEach(o => {
    if (!itemGroups.has(o.itemId)) itemGroups.set(o.itemId, []);
    itemGroups.get(o.itemId).push(o);
  });
  const loot = [];
  for (const [itemId, group] of itemGroups) {
    let contenders = [...group];
    const tieBreakRounds = [];
    let roundNumber = 0;
    while (contenders.length > 1) {
      roundNumber++;
      const rolls = contenders.map(o => ({ playerId:o.playerId, name:o.name, roll:1+Math.floor(Math.random()*20) }));
      const high = Math.max(...rolls.map(x=>x.roll));
      const tied = rolls.filter(x=>x.roll===high);
      tieBreakRounds.push({ round:roundNumber, rolls, tiedPlayerIds:tied.length>1?tied.map(x=>x.playerId):[] });
      contenders = tied.map(x=>group.find(o=>o.playerId===x.playerId));
    }
    const winner = contenders[0];
    const player = r.players.get(winner.playerId);
    if (!player.items.includes(itemId)) player.items.push(itemId);
    loot.push({ itemId, itemName: ITEM[itemId].name, itemDescription: ITEM[itemId].description || '', winnerId: winner.playerId, winnerName: winner.name, tieBreakRounds });
  }
  outcomes.forEach(o => {
    const p = r.players.get(o.playerId);
    if (!o.success && !o.protectedByVest) p.alive = false;
    p.confirmed = false;
  });
  r.results = { round: r.round, outcomes, loot };
  r.phase = 'results';
  broadcast(r);
  io.to(r.code).emit('round-result', r.results);
  if (alivePlayers(r).length === 0) finishCampaign(r, 'natural');
}

io.on('connection', socket => {
  socket.on('create-room', ({ name, token } = {}) => {
    let code; do { code = makeCode(); } while (rooms.has(code));
    const id = token || makeToken();
    const player = { id, token: id, socketId: socket.id, name: cleanName(name), stats: [2,2,2,2,2], alive: true, ready: false, choice: null, choiceLabel: null, confirmed: false, items: [], used: [], disconnected: false };
    const r = { code, hostId: player.id, phase: 'lobby', round: 0, players: new Map([[player.id, player]]), results: null, zombieDifficulty: 'normal', endReason: null };
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
      socket.emit('rejoined-room', { code, playerId: existing.id, token: existing.token, state: roomState(r, existing) }); broadcast(r); return;
    }
    if (r.phase !== 'lobby') return fail(socket, 'Esta partida já começou. Não é possível entrar agora.');
    if (r.players.size >= MAX_PLAYERS) return fail(socket, 'A sala está cheia (máximo de 8 jogadores).');
    const id = makeToken();
    const player = { id, token: id, socketId: socket.id, name: cleanName(name), stats: [2,2,2,2,2], alive: true, ready: false, choice: null, choiceLabel: null, confirmed: false, items: [], used: [], disconnected: false };
    r.players.set(id, player); socket.join(code); socket.data.room = code; socket.data.playerId = id;
    socket.emit('joined-room', { code, playerId: id, token: id }); broadcast(r);
  });

  socket.on('set-character', ({ stats } = {}) => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.phase !== 'lobby') return;
    if (!validStats(stats)) return fail(socket, 'Distribua exatamente 10 pontos, com no máximo 5 por atributo.');
    p.stats = [...stats]; p.ready = true; broadcast(r);
  });
  socket.on('set-zombie-difficulty', ({ difficulty } = {}) => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.phase !== 'lobby') return;
    if (r.hostId !== p.id) return fail(socket, 'Somente o anfitrião pode alterar a dificuldade dos zumbis.');
    if (!Object.prototype.hasOwnProperty.call(ZOMBIE_DIFFICULTIES, difficulty)) return fail(socket, 'Dificuldade inválida.');
    r.zombieDifficulty = difficulty; broadcast(r);
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
    const options = getPlayerOptions(p, r.round);
    if (!Number.isInteger(choice) || choice < 0 || choice >= options.length) return fail(socket, 'Escolha inválida ou item necessário indisponível.');
    if (p.choice !== null) return fail(socket, 'Você já confirmou sua escolha nesta cena.');
    p.choice = choice; p.choiceLabel = options[choice][0]; broadcast(r);
    if (alivePlayers(r).every(x => x.choice !== null)) resolveRound(r);
  });
  function advanceWhenEveryoneConfirmed(r, forced = false) {
    if (r.phase !== 'results' || (!forced && alivePlayers(r).some(x => !x.confirmed))) return;
    if (r.round >= 9 || alivePlayers(r).length === 0) return finishCampaign(r, 'natural');
    r.round++; r.phase = 'playing'; r.results = null;
    for (const player of r.players.values()) { player.choice = null; player.choiceLabel = null; player.confirmed = false; }
    broadcast(r); io.to(r.code).emit('new-round', { round: r.round });
  }
  socket.on('confirm-next', () => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.phase !== 'results') return;
    if (!p.alive) return;
    p.confirmed = true; broadcast(r);
    advanceWhenEveryoneConfirmed(r);
  });
  socket.on('force-next', () => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.phase !== 'results') return;
    if (r.hostId !== p.id) return fail(socket, 'Somente o anfitrião pode forçar a próxima cena.');
    advanceWhenEveryoneConfirmed(r, true);
  });
  socket.on('end-campaign', () => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p || r.hostId !== p.id) return fail(socket, 'Somente o anfitrião pode encerrar a campanha.');
    if (r.phase === 'finished') return;
    finishCampaign(r, 'host');
  });
  socket.on('leave-room', () => {
    const r = getRoom(socket), p = getPlayer(r, socket);
    if (!r || !p) return;
    r.players.delete(p.id); socket.leave(r.code); socket.data.room = null; socket.data.playerId = null;
    if (r.hostId === p.id) {
      const successor = [...r.players.values()].find(candidate => !candidate.disconnected);
      r.hostId = successor ? successor.id : null;
    }
    if (r.players.size === 0) { rooms.delete(r.code); return; }
    broadcast(r);
    if (r.phase === 'results') advanceWhenEveryoneConfirmed(r);
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
