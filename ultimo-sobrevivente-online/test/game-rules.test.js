const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { S, SPECIAL_OPTIONS, ITEM, STAGE_BASES, STAGE_MAX_CHANCE } = require('../game-data');
const { getPlayerOptions, chanceFor, stageIndex } = require('../game-rules');

const player = (items = [], used = [], stats = [2,2,2,2,2]) => ({ stats, items, used });
assert.equal(S.length, 10, 'A campanha deve conter 10 cenas');

// Cada cena tem cinco escolhas comuns e segue a regra de repetição por atributo.
for (const [sceneIndex, scene] of S.entries()) {
  assert.equal(scene.opts.length, 5, `Cena ${sceneIndex + 1}: deve ter exatamente cinco escolhas comuns`);
  const groups = new Map();
  for (const option of scene.opts) {
    const [, attr, difficulty, reward] = option;
    if (!groups.has(attr)) groups.set(attr, []);
    groups.get(attr).push(option);
    if (reward) assert.equal(difficulty, 'dificil', `Cena ${sceneIndex + 1}: escolhas com recompensa devem ser difíceis`);
  }
  for (const [attr, group] of groups) {
    assert.ok(group.length <= 2, `Cena ${sceneIndex + 1}: ${attr} não pode aparecer mais de duas vezes`);
    if (group.length === 2) {
      assert.equal(group.filter(o => o[3]).length, 1, `Cena ${sceneIndex + 1}: repetição de ${attr} exige exatamente uma recompensa`);
      assert.equal(group.find(o => o[3])[2], 'dificil', `Cena ${sceneIndex + 1}: escolha com recompensa repetida deve ser difícil`);
      assert.notEqual(group.find(o => !o[3])[2], 'dificil', `Cena ${sceneIndex + 1}: a outra escolha repetida não pode ser difícil`);
    }
  }
}

// Recompensas continuam condicionadas ao sucesso e todas as escolhas de recompensa são difíceis.
for (const scene of S) for (const option of scene.opts) if (option[3]) assert.equal(option[2], 'dificil');
assert.ok(S.some(scene => scene.opts.some(o => o[3])), 'Deve haver recompensas nas escolhas comuns');

// Ações especiais aparecem apenas quando o item correspondente está disponível.
assert.equal(getPlayerOptions(player(), 3).some(o => (o[4] || {}).specialItem === 'pe'), false);
assert.equal(getPlayerOptions(player(['pe']), 3).some(o => (o[4] || {}).specialItem === 'pe'), true);
assert.equal(getPlayerOptions(player(['pistola']), 4).some(o => (o[4] || {}).specialItem === 'pistola'), true);
assert.equal(getPlayerOptions(player(['municao']), 7).some(o => (o[4] || {}).specialItem === 'municao'), false);
assert.equal(getPlayerOptions(player(['pistola','municao']), 7).some(o => (o[4] || {}).specialItem === 'municao'), true);
assert.equal(getPlayerOptions(player(['faca']), 8).some(o => (o[4] || {}).specialItem === 'faca'), true);
assert.equal(getPlayerOptions(player(['radio']), 9).some(o => (o[4] || {}).specialItem === 'radio'), true);
assert.equal(getPlayerOptions(player(['mascara']), 7).some(o => (o[4] || {}).specialItem === 'mascara'), true);

// Progressão das probabilidades: lenta > rápida > chefe.
assert.deepEqual(STAGE_BASES, [
  {facil:90,medio:82,dificil:72},
  {facil:80,medio:70,dificil:58},
  {facil:68,medio:55,dificil:40}
]);
assert.deepEqual(STAGE_MAX_CHANCE, [95,85,70]);
assert.equal(stageIndex(0), 0);
assert.equal(stageIndex(4), 1);
assert.equal(stageIndex(8), 2);
const noStats = player([], [], [0,0,0,0,0]);
const easySlow = chanceFor(noStats, ['Fácil','Pontaria','facil'], 0, 'normal');
const easyFast = chanceFor(noStats, ['Fácil','Pontaria','facil'], 4, 'normal');
const easyBoss = chanceFor(noStats, ['Fácil','Pontaria','facil'], 8, 'normal');
assert.ok(easySlow > easyFast && easyFast > easyBoss, 'A chance deve diminuir com a evolução dos zumbis');
assert.equal(chanceFor(noStats, ['Teste com recompensa','Pontaria','dificil','pistola'], 0, 'normal'), 67, 'Recompensas aplicam penalidade de cinco pontos');
assert.ok(chanceFor(noStats, ['Teste fácil','Pontaria','facil'], 0, 'facil') > chanceFor(noStats, ['Teste fácil','Pontaria','facil'], 0, 'dificil'), 'A dificuldade selecionada pelo anfitrião deve alterar a chance');

// Atributos e equipamentos aumentam a chance, respeitando o teto de cada fase.
assert.ok(chanceFor(player([], [], [5,0,0,0,0]), ['Teste','Pontaria','medio'], 0, 'normal') > chanceFor(noStats, ['Teste','Pontaria','medio'], 0, 'normal'));
assert.ok(chanceFor(player(['pistola']), ['Teste','Pontaria','medio'], 0, 'normal') > chanceFor(noStats, ['Teste','Pontaria','medio'], 0, 'normal'));
const maxed = player(['pistola','municao','pe','tenis','sinal','lanterna','colete','kit','faca','mascara','radio'], [], [5,5,5,5,5]);
for (let round=0; round<10; round++) {
  const cap = STAGE_MAX_CHANCE[stageIndex(round)];
  for (const option of getPlayerOptions(maxed, round)) for (const difficulty of ['facil','normal','dificil']) {
    assert.ok(chanceFor(maxed, option, round, difficulty) <= cap, `Cena ${round + 1}: chance não pode superar ${cap}%`);
  }
}

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
assert.ok(html.includes("socket.emit('force-next')"), 'O anfitrião deve poder forçar a próxima cena');
assert.ok(html.includes('difficulty-easy') && html.includes('difficulty-medium') && html.includes('difficulty-hard'), 'As dificuldades devem ter cores próprias');
assert.ok(!html.includes('Sua chance estimada:'), 'A tela de escolhas não deve exibir porcentagem estimada');
assert.ok(!html.includes('<strong>${esc(o[0])}</strong>'), 'O texto das escolhas não deve aparecer em negrito');
assert.ok(html.includes('choice-text'), 'O texto das escolhas deve usar estilo sem negrito');
assert.ok(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8').includes('alivePlayers(r).some(x => !x.confirmed)'), 'Somente jogadores vivos devem precisar confirmar o avanço');
assert.ok(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8').includes('revealChoices'), 'As escolhas devem ter controle de revelação');
console.log('OK: cinco escolhas, repetição por atributo, recompensas, progressão zumbi, itens e interface validados.');
