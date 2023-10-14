const mongoose = require("mongoose");

const FileModel = require("../models/file");

const getFiles = async (req, res) => {
  const { page, pageSize, search } = req.query;

  const offset = (Number(page) - 1) * Number(pageSize);

  const query = FileModel.find({
    // name: `${search}`,
  });

  const files = await query.skip(offset).limit(pageSize);
  const total = await query.countDocuments();

  return res.send({
    success: true,
    message: "Get file list is successfully",
    total,
    data: files,
  });
};

const createFile = (req, res) => {
  console.log(req.body);
  const {} = req.body;

  const file = new FileModel({
    name: "test",
    type: "test",
    file_size: 2000,
  });

  return file.save().then((newFile) => {
    return res.status(201).json({
      success: true,
      message: "Created file is successfully",
      data: newFile,
    });
  });
};

module.exports = {
  getFiles,
  createFile,
};
