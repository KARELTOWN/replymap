const paginateData = (req, res, next) => {
  console.log("req.query", req.query.page)
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
