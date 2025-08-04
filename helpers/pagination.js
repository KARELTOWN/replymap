const paginateData = (req, res, next) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;
  req.pagination = {
    limit: limit,
    page: page,
    skip: skip,
  };
  next();
};
export default paginateData;
