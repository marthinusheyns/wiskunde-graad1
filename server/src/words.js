/* Die woorde in 'n sin, soos die stembediener dit nagaan (ook gebruik deur tools/say-config.js). */
const words = (t) => String(t).toLowerCase().replace(/'/g, '’').split(/\s+/)
  .map((w) => w.replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, '')).filter(Boolean);
module.exports = { words };
