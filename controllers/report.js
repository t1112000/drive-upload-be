const ReportModel = require("../models/report");

const getReports = async (req, res) => {
  const { from, to } = req.query;

  const query = {};

  if (from && to) {
    query.created_at = {
      $gte: from,
      $lt: to,
    };
  }

  const reports = await ReportModel.find(query);

  return res.status(200).json({
    success: true,
    data: reports,
  });
};

module.exports = {
  getReports,
};
