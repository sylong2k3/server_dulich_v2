const formatPagination = (data, total, page, limit) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  },
});

module.exports = {
  formatPagination,
};