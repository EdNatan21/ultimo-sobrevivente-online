const { ATTRS, ITEM, S, SPECIAL_OPTIONS, ZOMBIE_DIFFICULTIES, STAGE_BASES, STAGE_MAX_CHANCE } = require('./game-data');

const hasItem = (player, id) => player.items.includes(id) && !player.used.includes(id);

function getPlayerOptions(player, round) {
  // Cinco escolhas comuns por cena. Ações especiais ficam fora desse limite
  // e só aparecem quando o jogador possui o item correspondente.
  const options = S[round].opts.filter(option => {
    const meta = option[4] || {};
    return !meta.requiresItem || hasItem(player, meta.requiresItem);
  });
  for (const [itemId, option] of Object.entries(SPECIAL_OPTIONS[round] || {})) {
    const meta = option[4] || {};
    if (hasItem(player, itemId) && (!meta.requiresItem || hasItem(player, meta.requiresItem))) options.push(option);
  }
  return options;
}

function stageIndex(round) {
  if (round <= 3) return 0; // infectados lentos
  if (round <= 7) return 1; // infectados rápidos
  return 2; // chefe
}

function chanceFor(player, option, round, zombieDifficulty) {
  const [, attr, difficulty] = option;
  const tier = stageIndex(round);
  const base = STAGE_BASES[tier][difficulty] ?? STAGE_BASES[tier].dificil;
  const rewardPenalty = option[3] ? 5 : 0;
  const attrIndex = ATTRS.findIndex(a => a[0] === attr);
  const bonus = player.items.reduce((sum, id) => {
    const item = ITEM[id];
    return sum + (item && item.attr === attr && (item.type !== 'consumivel' || !player.used.includes(id)) ? item.bonus : 0);
  }, 0);
  const globalModifier = ZOMBIE_DIFFICULTIES[zombieDifficulty]?.modifier ?? 0;
  const maxChance = STAGE_MAX_CHANCE[tier];
  return Math.max(5, Math.min(maxChance, base - rewardPenalty + 4 * (player.stats[attrIndex] || 0) + bonus + globalModifier));
}

module.exports = { hasItem, getPlayerOptions, chanceFor, stageIndex };
