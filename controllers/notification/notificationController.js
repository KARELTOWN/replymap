import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import notificationService from "../../services/notification/notificationService.js";

const service = notificationService();

// HTTP layer of the notification history. A user only reads their own.

export default function notificationController() {
  const getNotifications = async (req, res) => {
    assertValid(req);
    const data = await service.listForUser({ user: req.user, pagination: req.pagination });
    return ApiResponse.ok(res, { messageKey: "notification.listed", data });
  };

  return { getNotifications };
}
