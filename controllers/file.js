const mongoose = require("mongoose");

const FileModel = require("../models/file");

const getFiles = async (req, res) => {
  const { page, pageSize, search } = req.query;

  const offset = (Number(page) - 1) * Number(pageSize);

  const query = {
    name: new RegExp(search, "i"),
  };

  const files = await FileModel.find(query).skip(offset).limit(pageSize);
  const total = await FileModel.count(query);

  return res.send({
    success: true,
    total,
    data: files,
  });
};

const createFile = (req, res) => {
  console.log(req.body);
  console.log(req);
  const {} = req.body;

  const file = new FileModel({
    name: "test",
    type: "test",
    file_size: 2000,
  });

  return file.save().then((newFile) => {
    return res.status(201).json({
      success: true,
      data: newFile,
    });
  });
};

module.exports = {
  getFiles,
  createFile,
};
