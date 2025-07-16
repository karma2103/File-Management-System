const mongoose = require("mongoose");

const ShareSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", default: null },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },

  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ New field

  sharedWith: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: "CommitteeGroup" },
      access: { type: String, enum: [ "write", "NoDownload"], default: "read" },
      sharedAt: { type: Date, default: Date.now },
    },
  ],
  shareToAll : { type: Boolean, default: false },
  sharedAt: { type: Date, default: Date.now },
   downloadedBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      downloadedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Share", ShareSchema);
