const fs = require("fs");
const util = require("util");
const deleteFileUploadFromLocalStorage = util.promisify(fs.unlink);
const { Upload } = require("@aws-sdk/lib-storage");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const FileModel = require("../models/file");
const ReportModel = require("../models/report");
const { s3 } = require("../config");

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

const uploadParallel = async (id, file, pvm) => {
  const buffer = await fs.readFileSync(file.path);
  const start = performance.now();

  const uploadParallel = new Upload({
    client: s3,
    queueSize: pvm,
    partSize: 1024 * 1024 * 5,
    // partSize: Math.ceil(file.size / pvm), // optional size of each part
    leavePartsOnError: false,
    params: {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.originalname,
      Body: buffer,
    },
  });

  uploadParallel.on("httpUploadProgress", ({ total, loaded }) => {
    const progress = Math.round((100 * loaded) / total);

    io.emit(id, {
      [`p${pvm}`]: {
        progress,
      },
    });
  });

  const { Location } = await uploadParallel.done();
  const end = performance.now();

  return {
    url: Location,
    time: Number(Number((end - start) / 1000).toFixed(2)),
  };
};

const createFile = async (req, res) => {
  const {
    file,
    query: { id },
  } = req;
  const { originalname, mimetype, size, path } = file;

  try {
    // Handle upload file S3 1 PVM
    const { url, time: p1 } = await uploadParallel(id, file, 1);

    // Handle upload file S3 2 PVM
    const { time: p2 } = await uploadParallel(id, file, 2);

    // Handle upload file S3 4 PVM
    const { time: p4 } = await uploadParallel(id, file, 4);

    // Handle upload file S3 8 PVM
    const { time: p8 } = await uploadParallel(id, file, 8);

    const newFile = new FileModel({
      name: originalname,
      type: mimetype,
      file_size: size,
      url,
    });

    // Save 1 record report
    const report = new ReportModel({
      file_size: size,
      p1,
      p2,
      p4,
      p8,
    });

    deleteFileUploadFromLocalStorage(path);

    await report.save();

    return newFile.save().then((fileData) => {
      return res.status(201).json({
        success: true,
        data: fileData,
      });
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
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
