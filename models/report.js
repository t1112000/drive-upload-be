const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    p1: {
      type: Number,
      required: true,
    },
    p2: {
      type: Number,
      required: true,
    },
    p4: {
      type: Number,
      required: true,
    },
    p8: {
      type: Number,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

module.exports = mongoose.model("report", reportSchema);
