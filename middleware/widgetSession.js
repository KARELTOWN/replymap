import { AppError } from "../shared/errors/appError.js";

// Sessions of the embedded widget.
//
// The widget runs on the customer's website, where it cannot reach the session
// cookie: it holds a token of its own, tied to one project (see
// authSessionService.issueWidgetToken). Such a token opens only the few routes
// the widget needs, and only for its project.
//
// The rule is deny by default: a route says so before authentication, and
// `isAuthentificate` refuses a widget token everywhere else. Forgetting the
// declaration closes a route to the widget; it never opens one by accident.
export const allowWidgetSession = (req, res, next) => {
  req.allowWidgetSession = true;
  next();
};

// For the routes that carry a project but no access guard of their own.
export const requireWidgetProjectMatch = (req, res, next) => {
  const projectId =
    req.params?.project_id || req.body?.project_id || req.query?.project_id || null;

  if (req.widgetSession && String(req.widgetSession.projectId) !== String(projectId)) {
    return next(new AppError("PROJECT_NOT_MEMBER"));
  }
  return next();
};
