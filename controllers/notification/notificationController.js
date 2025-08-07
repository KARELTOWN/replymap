import { matchedData, validationResult } from "express-validator";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";
import { redisClient } from "../../config/redis.js";

export default function notificationController() {
  const getNotifications = async (req, res, next) => {
    try {
      const { limit, skip, page } = req.pagination;
      let notifications;
      let total_notifications;
      // cache_key = `notifications_page_${page}_limit_${limit}`;
      // let cached_notifications = await redisClient.get(cache_key);
      // if (cached_notifications) {
      //   notifications = JSON.parse(cached_notifications);
      // } else {
      total_notifications = await Notification.count();
      notifications = await Notification.find({})
        .populate({
          path: "user",
          model: User,
          select: "lastname firstname code phone_number email",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
      //   await redisClient.set(cache_key, JSON.stringify(notifications), {
      //     EX: process.env.REDIS_DEFAULT_CACHE_EXPIRATION || 3600,
      //   });
      // }

      res.status(200).json({
        message: "Notifications récupérées",
        data: notifications,
        total: total_notifications,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total_notifications / limit),
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    getNotifications,
  };
}
