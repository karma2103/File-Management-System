const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  date: { type: Date, default: Date.now },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sharedWith: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      access: {
        type: String,
        enum: ["read", "write"],
        default: "read",
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const folderSchema = new mongoose.Schema({
  folderName: String,
  files: [fileSchema],
  uploadType: { type: String, default: "Folder" },
  date: { type: Date, default: Date.now },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  linkedFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CreateFolder",
  },
  sharedWith: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      access: {
        type: String,
        enum: ["read", "write"],
        default: "read",
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const FolderModel = mongoose.model("Folder", folderSchema);

module.exports = FolderModel;
