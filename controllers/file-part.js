const fs = require("fs");
const util = require("util");
const deleteFileUploadFromLocalStorage = util.promisify(fs.unlink);
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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

const uploadParallel = async (id, file, pvm) => {
  const fileTemp = fs.readFileSync(file.path);
  const chunks = [];

  const chunkSize = file.size / pvm;

  for (let i = 0; i < pvm; i++) {
    chunks.push(
      fileTemp.slice(
        i * chunkSize,
        pvm - 1 === i ? file.size : (i + 1) * chunkSize
      )
    );
  }

  const streams = [];

  chunks.forEach((chunk, index) => {
    const path = __dirname + `/${pvm}-${index + 1}.txt`;

    fs.writeFileSync(path, chunk, (err) => {
      console.log({ err });
    });

    const stream = fs.createReadStream(path);

    streams.push(stream);
  });

  const Bucket = process.env.AWS_S3_BUCKET_NAME;
  const Key = file.originalname;
  const s3 = new AWS.S3();
  const upload = await s3
    .createMultipartUpload({
      Bucket,
      Key,
    })
    .promise();

  const Parts = await Promise.all(
    streams.map(async (stream, index) => {
      const params = {
        Bucket,
        Key,
        UploadId: upload.UploadId || "",
        PartNumber: index + 1,
        Body: stream,
      };
      const uploadPart = s3.uploadPart(params);

      uploadPart.on("httpUploadProgress", ({ loaded, total }) => {
        const progress = Math.round((100 * loaded) / total);

        const dataRes = {
          [`p${pvm}`]: {
            [index]: progress,
          },
        };

        io.emit(id, dataRes);
      });

      const data = await uploadPart.promise();

      return {
        ETag: data.ETag,
        PartNumber: index + 1,
      };
    })
  );

  const { Location } = await s3
    .completeMultipartUpload({
      Bucket,
      Key,
      UploadId: upload.UploadId || "",
      MultipartUpload: {
        Parts,
      },
    })
    .promise();

  return {
    url: Location,
  };
};

const getTime = (start, end) => Number(Number((end - start) / 1000).toFixed(2));

const createFile = async (req, res) => {
  const {
    file,
    query: { id },
  } = req;
  const { originalname, mimetype, size, path } = file;

  try {
    // Handle upload file S3 1 PVM
    const start_p1 = performance.now();
    const { url } = await uploadParallel(id, file, 1);
    const end_p1 = performance.now();
    const p1 = getTime(start_p1, end_p1);

    // Handle upload file S3 2 PVM
    const start_p2 = performance.now();
    const {} = await uploadParallel(id, file, 2);
    const end_p2 = performance.now();
    const p2 = getTime(start_p2, end_p2);

    // Handle upload file S3 4 PVM
    const start_p4 = performance.now();
    const {} = await uploadParallel(id, file, 4);
    const end_p4 = performance.now();
    const p4 = getTime(start_p4, end_p4);

    // Handle upload file S3 8 PVM
    const start_p8 = performance.now();
    const {} = await uploadParallel(id, file, 8);
    const end_p8 = performance.now();
    const p8 = getTime(start_p8, end_p8);

    const newFileModal = new FileModel({
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

    const files = fs.readdirSync(__dirname);

    files.forEach((fileTemp) => {
      if (fileTemp.endsWith(".txt")) {
        fs.unlinkSync(__dirname + "/" + fileTemp);
      }
    });

    await report.save();

    return newFileModal.save().then((newFile) => {
      return res.status(201).json({
        success: true,
        data: newFile,
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
