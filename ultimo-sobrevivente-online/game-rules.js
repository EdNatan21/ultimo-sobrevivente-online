const { ATTRS, ITEM, S, SPECIAL_OPTIONS, ZOMBIE_DIFFICULTIES, STAGE_MODIFIERS } = require('./game-data');

const hasItem = (player, id) => player.items.includes(id) && !player.used.includes(id);

function getPlayerOptions(player, round) {
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

function chanceFor(player, option, round, zombieDifficulty) {
  const [, attr, difficulty] = option;
  const base = { facil: 68, medio: 52, dificil: 36 }[difficulty] ?? 36;
  const rewardPenalty = option[3] ? 10 : 0;
  const attrIndex = ATTRS.findIndex(a => a[0] === attr);
  const bonus = player.items.reduce((sum, id) => {
    const item = ITEM[id];
    return sum + (item && item.attr === attr && (item.type !== 'consumivel' || !player.used.includes(id)) ? item.bonus : 0);
  }, 0);
  const globalModifier = ZOMBIE_DIFFICULTIES[zombieDifficulty]?.modifier ?? 0;
  const stageModifier = STAGE_MODIFIERS[round] ?? 0;
  return Math.max(5, Math.min(70, base - rewardPenalty + 4 * (player.stats[attrIndex] || 0) + bonus + globalModifier + stageModifier));
}

module.exports = { hasItem, getPlayerOptions, chanceFor };
