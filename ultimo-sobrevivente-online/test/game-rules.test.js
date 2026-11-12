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
assert.ok(easy > normal && normal > hard, 'A dificuldade dos zumbis deve alterar a chance na direção esperada');
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
assert.ok(html.includes('class=\"item has-tip\"'), 'O inventário deve exibir descrição do item ao passar o mouse');
assert.ok(html.includes("if(me&&!me.confirmed)socket.emit('confirm-next')"), 'Jogadores eliminados também devem conseguir confirmar a próxima cena');
console.log('OK: regras de armas, itens especiais e dificuldades validadas.');
