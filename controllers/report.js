const ReportModel = require("../models/report");

const getReports = async (req, res) => {
  const reports = await ReportModel.find();

  return res.status(200).json({
    success: true,
    data: reports,
  });
};

module.exports = {
  getReports,
};
