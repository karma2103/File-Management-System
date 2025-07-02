const FolderModel = require("../model/File");
const UserModel = require("../model/users");

function getFileIcon(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "pdf":
      return "teenyicons:pdf-outline";
    case "doc":
      return "teenyicons:ms-word-outline";
    case "docx":
      return "teenyicons:ms-word-outline";
    case "xls":
      return "uiw:file-excel";
    case "xlsx":
      return "uiw:file-excel";
    case "ppt":
    case "pptx":
      return "teenyicons:ppt-outline";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "fas fa-file-image";
    case "zip":
    case "rar":
      return "lsicon:file-rar-outline";
    case "txt":
      return "teenyicons:ppt-outline";
    default:
      return "fas fa-file";
  }
}

const shareFilesFolder = async (req, res) => {
  const { id, access, shareWithUserId, type, redirectUrl } = req.body;
  const backTo = redirectUrl || "/checking"; // Fallback if no URL is passed

  try {
    const sharerId = req.session.userId;

    const receiverUser = await UserModel.findById(shareWithUserId);
    if (!receiverUser) {
      req.flash("error", "User to share with not found");
      return res.redirect(backTo);
    }

    if (type === "folder") {
      const folder = await FolderModel.findById(id);
      if (!folder) {
        req.flash("error", "Folder not found");
        return res.redirect(backTo);
      }

      if (
        sharerId === shareWithUserId &&
        folder.uploadedBy.toString() === sharerId
      ) {
        req.flash("error", "You cannot share the folder with yourself as the owner.");
        return res.redirect(backTo);
      }

      const alreadyShared = folder.sharedWith.find(
        (s) => s.user.toString() === shareWithUserId
      );
      if (alreadyShared) {
        req.flash("info", "Folder is already shared with this user.");
        return res.redirect(backTo);
      }

      folder.sharedWith.push({
        user: shareWithUserId,
        access,
        sharedAt: new Date(),
      });

      await folder.save();
      req.flash("success", "Folder shared successfully");
      return res.redirect(backTo);
    }

    else if (type === "file") {
      const folder = await FolderModel.findOne({ "files._id": id });
      if (!folder) {
        req.flash("error", "File not found");
        return res.redirect(backTo);
      }

      const file = folder.files.id(id);
      if (!file) {
        req.flash("error", "File not found");
        return res.redirect(backTo);
      }

      if (
        sharerId === shareWithUserId &&
        file.uploadedBy.toString() === sharerId
      ) {
        req.flash("error", "You cannot share the file with yourself as the owner.");
        return res.redirect(backTo);
      }

      const alreadyShared = file.sharedWith.find(
        (s) => s.user.toString() === shareWithUserId
      );
      if (alreadyShared) {
        req.flash("info", "File is already shared with this user.");
        return res.redirect(backTo);
      }

      file.sharedWith.push({
        user: shareWithUserId,
        access,
        sharedAt: new Date(),
      });

      await folder.save();
      req.flash("success", "File shared successfully");
      return res.redirect(backTo);
    }

    req.flash("error", "Invalid share type");
    return res.redirect(backTo);
  } catch (err) {
    console.error(err);
    req.flash("error", "Error sharing");
    res.redirect(backTo);
  }
};


const getSharedWithMeFolders = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Folders shared with me
    const sharedFolders = await FolderModel.find({
      "sharedWith.user": userId,
      uploadedBy: { $ne: userId },
    })
      .populate("uploadedBy")
      .populate("sharedWith.user")
      .populate("files.uploadedBy")
      .populate("files.sharedWith.user");

    // Folders where files are shared with me, even if the folder itself isn't
    const fileSharedFolders = await FolderModel.find({
      "files.sharedWith.user": userId,
      uploadedBy: { $ne: userId },
    })
      .populate("uploadedBy")
      .populate("files.uploadedBy")
      .populate("files.sharedWith.user");

    // Merge folders - avoid duplicates (if folder is in both sharedFolders & fileSharedFolders)
    const allSharedFolderMap = new Map();

    for (const folder of [...sharedFolders, ...fileSharedFolders]) {
      allSharedFolderMap.set(folder._id.toString(), folder);
    }

    const allSharedFolders = Array.from(allSharedFolderMap.values());

    // Manual population (if needed)
    for (const folder of allSharedFolders) {
      for (const file of folder.files) {
        for (let i = 0; i < file.sharedWith.length; i++) {
          const share = file.sharedWith[i];
          if (share.user && share.user._id == null) {
            share.user = await UserModel.findById(share.user).select("username email");
          }
        }
        if (file.uploadedBy && file.uploadedBy._id == null) {
          file.uploadedBy = await UserModel.findById(file.uploadedBy).select("username email");
        }
      }
    }

    // Folders I shared with others
    const mySharedFolders = await FolderModel.find({
      uploadedBy: userId,
      sharedWith: { $exists: true, $not: { $size: 0 } },
    })
      .populate("sharedWith.user")
      .populate("files.sharedWith.user");

    // Manual population
    for (const folder of mySharedFolders) {
      for (const file of folder.files) {
        for (let i = 0; i < file.sharedWith.length; i++) {
          const share = file.sharedWith[i];
          if (share.user && share.user._id == null) {
            share.user = await UserModel.findById(share.user).select("username email");
          }
        }
        if (file.uploadedBy && file.uploadedBy._id == null) {
          file.uploadedBy = await UserModel.findById(file.uploadedBy).select("username email");
        }
      }
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/upload");
    }

    res.render("sharing", {
      sharedWithMe: allSharedFolders,
      myShared: mySharedFolders,
      getFileIcon,
      userId,
      user,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error fetching shared folders.");
    res.redirect("/checking");
  }
};


const removeSharedFolder = async (req, res) => {
  const { itemId, itemType, userId, redirectUrl } = req.body;
  const backTo = decodeURIComponent(redirectUrl || "/checking");

  try {
    if (itemType === 'folder') {
      const folder = await FolderModel.findById(itemId);
      if (!folder) {
        req.flash('error', 'Folder not found');
        return res.redirect(backTo);
      }

      folder.sharedWith = folder.sharedWith.filter(sw => sw.user.toString() !== userId);
      await folder.save();

    } else if (itemType === 'file') {
      const folder = await FolderModel.findOne({ 'files._id': itemId });
      if (!folder) {
        req.flash('error', 'File not found');
        return res.redirect(backTo);
      }

      const file = folder.files.id(itemId);
      if (!file) {
        req.flash('error', 'File not found in folder');
        return res.redirect(backTo);
      }

      file.sharedWith = file.sharedWith.filter(sw => sw.user.toString() !== userId);
      await folder.save();
    }

    req.flash("success", "Shared user removed successfully");
    return res.redirect(backTo);

  } catch (err) {
    console.error("Error removing shared user:", err);
    req.flash("error", "Server error occurred while removing shared user");
    return res.redirect(backTo);
  }
};


//function to get the user details of shared file and folder
const shareUserDetails = async (req, res) => {
  const { type, id } = req.params;
  try {
    let sharedUsers = [];
    if (type === "folder") {
      const folder = await FolderModel.findById(id).populate(
        "sharedWith.user",
        "username department"
      );
      if (!folder)
        return res
          .status(404)
          .json({ success: false, message: "Folder not found" });
      sharedUsers = folder.sharedWith;
    } else if (type === "file") {
      const folder = await FolderModel.findOne({ "files._id": id });
      if (!folder)
        return res
          .status(404)
          .json({ success: false, message: "File not found" });

      const file = folder.files.id(id);
      if (!file)
        return res
          .status(404)
          .json({ success: false, message: "File not found" });

      const populatedSharedWith = await UserModel.find({
        _id: { $in: file.sharedWith.map((sw) => sw.user) },
      }).select("username department");

      sharedUsers = file.sharedWith.map((entry) => ({
        ...entry.toObject(),
        user: populatedSharedWith.find(
          (u) => u._id.toString() === entry.user.toString()
        ),
      }));
    }
return res.json({ success: true, sharedWith: sharedUsers });
   
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  shareFilesFolder,
  getSharedWithMeFolders,
  removeSharedFolder,
  shareUserDetails,
};
