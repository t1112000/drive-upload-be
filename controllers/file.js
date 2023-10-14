const fs = require("fs");
const util = require("util");
const deleteFileUploadFromLocalStorage = util.promisify(fs.unlink);

const FileModel = require("../models/file");
const ReportModel = require("../models/report");

const getFiles = async (req, res) => {
  const { page, pageSize, search, type, from, to } = req.query;

  const offset = (Number(page) - 1) * Number(pageSize);

  const query = {
    name: new RegExp(search, "i"),
  };

  if (type) {
    query.type = type;
  }

  if (from && to) {
    query.created_at = {
      $gte: from,
      $lt: to,
    };
  }

  const files = await FileModel.find(query)
    .sort({ created_at: "desc" })
    .skip(offset)
    .limit(pageSize);
  const total = await FileModel.count(query);

  return res.status(200).json({
    success: true,
    total,
    data: files,
  });
};

const getFileTypes = async (req, res) => {
  const files = await FileModel.find();

  const fileTypes = new Set();

  files.forEach((file) => {
    fileTypes.add(file?.type);
  });

  return res.status(200).json({
    success: true,
    data: Array.from(fileTypes),
  });
};

const createFile = async (req, res) => {
  const { files } = req;
  const { originalname, mimetype, size, path } = files?.[0];

  deleteFileUploadFromLocalStorage(path);

  // Handle upload file S3 1 PVM

  // Handle upload file S3 2 PVM

  // Handle upload file S3 4 PVM

  // Handle upload file S3 8 PVM

  await setTimeout(async () => {
    const file = new FileModel({
      name: originalname,
      type: mimetype,
      file_size: size,
      // GET URL from s3
      url: "string",
    });

    // Save 1 record report
    const report = new ReportModel({
      file_size: size,
      p1: 10,
      p2: 6,
      p4: 3,
      p8: 1,
    });

    await report.save();

    return file.save().then((newFile) => {
      return res.status(201).json({
        success: true,
        data: newFile,
      });
    });
  }, 2000);
};

const deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    const foundFile = await FileModel.find({ _id: id }).deleteMany().exec();

    if (!foundFile.deletedCount) {
      return res.status(404).json({
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
    });
  }
};

module.exports = {
  getFiles,
  getFileTypes,
  createFile,
  deleteFile,
};
