const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { S, SPECIAL_OPTIONS, ITEM } = require('../game-data');
const { getPlayerOptions, chanceFor } = require('../game-rules');

const player = (items = [], used = [], stats = [2,2,2,2,2]) => ({ stats, items, used });
const ITEM_PRESENT = id => Object.prototype.hasOwnProperty.call(ITEM, id);

assert.equal(S.length, 10, 'A campanha deve conter 10 cenas');

const noWeapon = getPlayerOptions(player(), 4);
assert.equal(noWeapon.some(o => /atirar/i.test(o[0])), false, 'Sem pistola, a opção de tiro não deve aparecer');
const withWeapon = getPlayerOptions(player(['pistola']), 4);
assert.equal(withWeapon.some(o => /atirar/i.test(o[0])), true, 'Com pistola, a opção de tiro deve aparecer');

const specialWithoutItem = getPlayerOptions(player(), 3);
assert.equal(specialWithoutItem.some(o => (o[4] || {}).specialItem === 'pe'), false, 'A opção especial não deve aparecer sem o item');
const specialWithItem = getPlayerOptions(player(['pe']), 3);
assert.equal(specialWithItem.some(o => (o[4] || {}).specialItem === 'pe'), true, 'A opção especial deve aparecer com o item');

const pistolAndAmmo = getPlayerOptions(player(['pistola','municao']), 7);
assert.equal(pistolAndAmmo.some(o => (o[4] || {}).specialItem === 'municao'), true, 'A opção especial de munição exige pistola e munição');
assert.equal(getPlayerOptions(player(['municao']), 7).some(o => (o[4] || {}).specialItem === 'municao'), false, 'Munição sem pistola não libera a opção especial');

const baseOption = S[0].opts[1];
const lowStats = player([], [], [0,0,0,0,0]);
const easy = chanceFor(lowStats, baseOption, 0, 'facil');
const normal = chanceFor(lowStats, baseOption, 0, 'normal');
const hard = chanceFor(lowStats, baseOption, 0, 'dificil');
assert.ok(easy > normal && normal > hard, 'Fácil deve ter chance maior que médio, e médio maior que difícil');
const easyChoice = ['Escolha fácil','Pontaria','facil'];
const mediumChoice = ['Escolha média','Pontaria','medio'];
const hardChoice = ['Escolha difícil','Pontaria','dificil'];
assert.ok(chanceFor(lowStats, easyChoice, 0, 'normal') > chanceFor(lowStats, mediumChoice, 0, 'normal') && chanceFor(lowStats, mediumChoice, 0, 'normal') > chanceFor(lowStats, hardChoice, 0, 'normal'), 'Os níveis da escolha devem reduzir a probabilidade de fácil para difícil');
const rewardOption = S[0].opts.find(o => o[3]);
assert.ok(chanceFor(lowStats, rewardOption, 0, 'normal') < chanceFor(lowStats, S[0].opts.find(o => !o[3] && o[2] === rewardOption[2]), 0, 'normal'), 'Escolhas com recompensa devem ter chance-base menor que escolhas sem recompensa da mesma dificuldade');
assert.ok(ITEM.pistola.bonus < 12 && ITEM.municao.bonus < 25 && ITEM.kit.bonus < 20, 'Os bônus dos itens devem ser menores que os valores anteriores');
const lateNormal = chanceFor(player(), S[9].opts[1], 9, 'normal');
assert.ok(lateNormal < chanceFor(player(), S[9].opts[1], 0, 'normal'), 'As cenas finais devem aplicar penalidade de progressão');

assert.ok(Object.keys(SPECIAL_OPTIONS).length >= 7, 'Os itens especiais devem ter opções contextualizadas');
assert.ok(getPlayerOptions(player(['faca']), 8).some(o => (o[4]||{}).specialItem === 'faca'), 'A faca deve liberar ação especial no confronto com o chefe');
assert.ok(getPlayerOptions(player(['radio']), 9).some(o => (o[4]||{}).specialItem === 'radio'), 'O rádio deve liberar ação especial na rampa do navio');
assert.ok(getPlayerOptions(player(['mascara']), 7).some(o => (o[4]||{}).specialItem === 'mascara'), 'A máscara deve liberar ação especial na cena da mordida');
assert.ok(S.every(scene => scene.opts.length === 7), 'Cada cena deve oferecer sete escolhas comuns');
assert.ok(S.every(scene => new Set(scene.opts.map(o => o[0])).size === scene.opts.length), 'As escolhas comuns de cada cena não devem se repetir');
assert.ok(['faca','mascara','radio'].every(id => ITEM_PRESENT(id)), 'As novas recompensas devem existir no catálogo');
const maxed = player(['pistola','municao','pe','tenis','sinal','lanterna','colete','kit','faca','mascara','radio'], [], [5,5,5,5,5]);
for (let round=0; round<10; round++) for (const option of getPlayerOptions(maxed, round)) for (const difficulty of ['facil','normal','dificil']) assert.ok(chanceFor(maxed, option, round, difficulty) <= 70, 'Nenhuma probabilidade pode ultrapassar 70%');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
assert.ok(html.includes("socket.emit('force-next')"), 'O anfitrião deve poder forçar a próxima cena');
assert.ok(html.includes('difficulty-easy') && html.includes('difficulty-medium') && html.includes('difficulty-hard'), 'As dificuldades devem ter cores próprias');
assert.ok(!html.includes('Sua chance estimada:'), 'A tela de escolhas não deve exibir a porcentagem estimada');
assert.ok(!html.includes('passe o mouse para ver o efeito'), 'As descrições das recompensas não devem aparecer por hover');
assert.ok(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8').includes('alivePlayers(r).some(x => !x.confirmed)'), 'Somente jogadores vivos devem precisar confirmar o avanço');
assert.ok(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8').includes('revealChoices'), 'As escolhas devem ter controle de revelação');
console.log('OK: regras, probabilidades, recompensas e fluxo de confirmação validados.');
