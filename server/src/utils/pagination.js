function buildPagination({ page, limit }, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safeLimit =
    Number.isFinite(limit) && limit >= 1 ? Math.min(Math.floor(limit), maxLimit) : defaultLimit;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

function paginationMeta({ page, limit, total }) {
  return { page, limit, total, pages: total === 0 ? 1 : Math.ceil(total / limit) };
}

module.exports = { buildPagination, paginationMeta };
