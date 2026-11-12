const assert = require('node:assert/strict');
const { S, SPECIAL_OPTIONS } = require('../game-data');
const { getPlayerOptions, chanceFor } = require('../game-rules');

const player = (items = [], used = []) => ({ stats: [2,2,2,2,2], items, used });

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
const easy = chanceFor(player(), baseOption, 0, 'facil');
const normal = chanceFor(player(), baseOption, 0, 'normal');
const hard = chanceFor(player(), baseOption, 0, 'dificil');
assert.ok(easy > normal && normal > hard, 'A dificuldade dos zumbis deve alterar a chance na direção esperada');
const lateNormal = chanceFor(player(), S[9].opts[1], 9, 'normal');
assert.ok(lateNormal < chanceFor(player(), S[9].opts[1], 0, 'normal'), 'As cenas finais devem aplicar penalidade de progressão');

assert.ok(Object.keys(SPECIAL_OPTIONS).length >= 7, 'Os itens especiais devem ter opções contextualizadas');
console.log('OK: regras de armas, itens especiais e dificuldades validadas.');
