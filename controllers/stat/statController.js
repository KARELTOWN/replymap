import ApiResponse from "../../shared/http/apiResponse.js";
import statService from "../../services/stat/statService.js";

const service = statService();

// HTTP layer of the dashboard overview. Figures are computed in statService,
// scoped to the projects the caller may see.

export default function statController() {
  const getStats = async (req, res) => {
    const data = await service.getOverview(req.user);
    return ApiResponse.ok(res, { messageKey: "stat.fetched", data });
  };

  return { getStats };
}
