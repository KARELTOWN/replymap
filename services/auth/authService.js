import notificationService from "../../services/notification/notificationService.js";
const { sendMailNotification } = notificationService();

export default function authService() {
  const registerNotification = async (user, codeOTP) => {
    try {
      let params = {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        _id: user._id,
      };

      await sendMailNotification({
        receivers: [{ ...params }],
        params: { code: codeOTP, ...params },
        model_name: "CVC",
      });
      return true;
    } catch (error) {
      throw new Error(error);
    }
  };

  const confirmRegisterNotification = async (user) => {
    try {
      let params = {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        _id: user._id,
      };
      await sendMailNotification({
        receivers: [{ ...params }],
        params: params,
        model_name: "CC",
      });
      return true;
    } catch (error) {
      throw new Error(error);
    }
  };

  const forgotPasswordNotification = async (user, link, reject) => {
    try {
      let params = {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        _id: user._id,
      };

      await sendMailNotification({
        receivers: [{ ...params }],
        params: { link: link, reject: reject, ...params },
        model_name: "LRMP",
      });
      return true;
    } catch (error) {
      throw new Error(error);
    }
  };

  const resetPasswordNotification = async (user) => {
    try {
      let params = {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        _id: user._id,
      };

      await sendMailNotification({
        receivers: [{ ...params }],
        params: params,
        model_name: "RMP",
      });
      return true;
    } catch (error) {
      throw new Error(error);
    }
  };

  return {
    registerNotification,
    confirmRegisterNotification,
    forgotPasswordNotification,
    resetPasswordNotification,
  };
}
