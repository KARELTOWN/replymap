const filterModel = async (
  model,
  search,
  date,
  foreignKeySearchObject,
  skip,
  limit
) => {
  let query = {};

  const { search_params, search_value } = search;
  query.$or = [];
  for (const param of search_params) {
    let q = { param: { $regex: search_value, $options: "i" } };
    query.$or.push(q);
  }

  const { date_param, date_values } = date;
  const { start, end } = date_values;
  let start_date, end_date;
  if (start && end) {
    start_date = moment(start).toDate();
    end_date = moment(end).toDate();
    query[date_param] = { $gte: start_date, $lte: end_date };
  } else if (start && !end) {
    start_date = moment(start).toDate();
    query[date_param] = { $gte: start_date };
  } else if (!start && end) {
    end_date = moment(end).toDate();
    query[date_param] = { $lte: end_date };
  }

  if (foreignKeySearchObject) {
    const { attribute, value } = foreignKeySearchObject;
    query[attribute] = { $eq: value };
  }

  let data = await model
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  let total = await model.countDocuments(query).exec();
  return { data: data, total: total };
};
