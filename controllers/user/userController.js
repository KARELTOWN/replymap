import User from "../../models/User.js";

export default function userController() {
  const getUsers = async (req, res, next) => {
    try {
      

      let users;
      let total_users;
      cache_key = `users_page_${page}_limit_${limit}`;
      let cached_users = await redisClient.get(cache_key);
      if (cached_users) {
        users = JSON.parse(cached_users);
      } else {
        total_users = await User.count();
        users = await User.find({})
          .populate("role", "fonction", "photo")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        await redisClient.set(cache_key, JSON.stringify(users), {
          EX: process.env.REDIS_DEFAULT_CACHE_EXPIRATION || 3600,
        });
      }

      res.status(200).json({
        message: "Utilisateurs récupérés",
        data: users,
        total: total_users,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total_users / limit),
      });
    } catch (error) {
      next(error);
    }
  };

  return { getUsers };
}
