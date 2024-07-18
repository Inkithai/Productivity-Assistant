// Shared shape for stored embeddings. Keeping it in one place means the
// collections always agree on how to compare provider tags.
const embeddingField = {
  type: {
    vector: { type: [Number] },
    provider: { type: String, default: '' },
  },
  default: null,
};

module.exports = { embeddingField };
