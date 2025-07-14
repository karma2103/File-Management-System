const FolderModel = require("../model/File");
const UserModel = require("../model/users");
const ShareModel = require("../model/share");
const CommitteeGroup = require("../model/Committee");
const CreateFolder = require("../model/folder");
const ftp = require("basic-ftp");
const mime = require("mime-types");
const { PDFDocument } = require("pdf-lib");
const stream = require("stream");

const ftpCredentials = {
  Finance: {
    host: process.env.FTP_HOST_FINANCE,
    user: process.env.FTP_USER_FINANCE,
    password: process.env.FTP_PASSWORD_FINANCE,
  },
  Insurance: {
    host: process.env.FTP_HOST_INSURANCE,
    user: process.env.FTP_USER_INSURANCE,
    password: process.env.FTP_PASSWORD_INSURANCE,
  },
  investment: {
    host: process.env.FTP_HOST_LOAN,
    user: process.env.FTP_USER_LOAN,
    password: process.env.FTP_PASSWORD_LOAN,
  },
  ppf_gf: {
    host: process.env.FTP_HOST_PPF_GF,
    user: process.env.FTP_USER_PPF_GF,
    password: process.env.FTP_PASSWORD_PPF_GF,
  },
};
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
//controller to share files and folders
const shareFilesFolder = async (req, res) => {
  const { id, access, shareWithUserId, shareWithGroupId, type, redirectUrl } =
    req.body;

  const backTo = redirectUrl || "/checking";
  const sharerId = req.session.userId;

  try {
    if (!shareWithUserId && !shareWithGroupId) {
      req.flash("error", "Please select a user or group to share with.");
      return res.redirect(backTo);
    }

    if (!["file", "folder"].includes(type)) {
      req.flash("error", "Invalid share type.");
      return res.redirect(backTo);
    }

    let folder = null;
    let file = null;

    if (type === "folder") {
      folder = await FolderModel.findById(id);
    } else {
      folder = await FolderModel.findOne({ "files._id": id });
      if (folder) {
        file = folder.files.id(id);
      }
    }

    if (!folder || (type === "file" && !file)) {
      req.flash("error", `${type === "folder" ? "Folder" : "File"} not found.`);
      return res.redirect(backTo);
    }

    const uploaderId =
      type === "folder"
        ? folder.uploadedBy?.toString()
        : file.uploadedBy?.toString();

    if (
      shareWithUserId &&
      shareWithUserId === sharerId &&
      uploaderId === sharerId
    ) {
      req.flash(
        "error",
        `You cannot share the ${type} with yourself as the owner.`
      );
      return res.redirect(backTo);
    }

    // Validate access level based on your schema
    const validAccessValues = ["write", "NoDownload"];
    const sanitizedAccess = validAccessValues.includes(access)
      ? access
      : "write"; // default to 'write' if invalid (since schema doesn't include 'read')

    let shareDoc = await ShareModel.findOne({
      folderId: type === "folder" ? folder._id : null,
      fileId: type === "file" ? file._id : null,
      sharedBy: sharerId,
    });

    const isAlreadyShared = shareDoc?.sharedWith?.some((entry) => {
      return (
        (shareWithUserId && entry.userId?.toString() === shareWithUserId) ||
        (shareWithGroupId && entry.groupId?.toString() === shareWithGroupId)
      );
    });

    if (isAlreadyShared) {
      req.flash(
        "info",
        `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } is already shared with this user/group.`
      );
      return res.redirect(backTo);
    }

    if (!shareDoc) {
      shareDoc = new ShareModel({
        fileId: type === "file" ? file._id : null,
        folderId: type === "folder" ? folder._id : null,
        sharedBy: sharerId,
        sharedWith: [],
      });
    }

    shareDoc.sharedWith.push({
      ...(shareWithUserId ? { userId: shareWithUserId } : {}),
      ...(shareWithGroupId ? { groupId: shareWithGroupId } : {}),
      access: sanitizedAccess,
      sharedAt: new Date(),
    });

    await shareDoc.save();

    req.flash(
      "success",
      `${type.charAt(0).toUpperCase() + type.slice(1)} shared successfully.`
    );
    return res.redirect(backTo);
  } catch (err) {
    console.error("Error in shareFilesFolder:", err);
    req.flash("error", "An error occurred while sharing.");
    return res.redirect(backTo);
  }
};

//controller to remove shared folder or file
const removeSharedFolder = async (req, res) => {
  const { itemId, itemType, userId, groupId, redirectUrl } = req.body;
  const backTo = decodeURIComponent(redirectUrl || "/checking");

  try {
    // Validate input
    if (!itemId || !itemType || (!userId && !groupId)) {
      req.flash("error", "Invalid request parameters");
      return res.redirect(backTo);
    }

    // Prepare base query depending on itemType
    const query =
      itemType === "folder"
        ? { folderId: itemId }
        : itemType === "file"
        ? { fileId: itemId }
        : null;

    if (!query) {
      req.flash("error", "Invalid item type");
      return res.redirect(backTo);
    }

    // Pull the specific userId or groupId from sharedWith array
    const pullQuery = {};
    if (userId) pullQuery.userId = userId;
    if (groupId) pullQuery.groupId = groupId;

    await ShareModel.updateOne(query, {
      $pull: { sharedWith: pullQuery },
    });

    // Optionally delete the ShareModel document if sharedWith is empty
    const updatedShare = await ShareModel.findOne(query);
    if (updatedShare && updatedShare.sharedWith.length === 0) {
      await ShareModel.deleteOne(query);
    }

    req.flash("success", "Sharing access removed successfully");
    return res.redirect(backTo);
  } catch (err) {
    console.error("Error removing shared access:", err);
    req.flash("error", "Server error occurred while removing access");
    return res.redirect(backTo);
  }
};

//function to get the user details of shared file and folder
const shareUserDetails = async (req, res) => {
  const { type, id } = req.params;

  try {
    let shareDoc;

    if (type === "folder") {
      shareDoc = await ShareModel.findOne({ folderId: id }).lean();
    } else if (type === "file") {
      shareDoc = await ShareModel.findOne({ fileId: id }).lean();
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    if (!shareDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Share data not found" });
    }

    const userIds = shareDoc.sharedWith
      .filter((entry) => entry.userId)
      .map((entry) => entry.userId);

    const groupIds = shareDoc.sharedWith
      .filter((entry) => entry.groupId)
      .map((entry) => entry.groupId);

    const users = await UserModel.find({ _id: { $in: userIds } }).select(
      "name department"
    );
    const groups = await CommitteeGroup.find({ _id: { $in: groupIds } }).select(
      "groupName"
    );

    const sharedWith = shareDoc.sharedWith.map((entry) => {
      const user = users.find((u) => u._id.equals(entry.userId));
      const group = groups.find((g) => g._id.equals(entry.groupId));

      return {
        user: user || null,
        group: group || null,
        access: entry.access,
        sharedAt: entry.sharedAt,
      };
    });

    return res.json({ success: true, sharedWith });
  } catch (err) {
    console.error("Error in shareUserDetails:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
//controller to get all shared folders and files with the user

// controllers/shareController.js
const getSharedWithMeFolders = async (req, res) => {
  try {
    const user = req.session.userId?.toString();

    if (!user) {
      return res.status(401).send("Unauthorized");
    }

    const shares = await ShareModel.find({})
      .populate("sharedBy", "name email")
      .populate("sharedWith.userId", "name email")
      .populate("sharedWith.groupId", "groupName members")
      .lean();

    const sharedItems = [];

    for (const share of shares) {
      const isFolder = !!share.folderId;
      const isFile = !!share.fileId;

      let itemData = null;
      let type = null;

      if (isFolder) {
        itemData = await FolderModel.findById(share.folderId).lean();
        type = "folder";
      } else if (isFile) {
        itemData = await FolderModel.findOne(
          { "files._id": share.fileId },
          { "files.$": 1, folderName: 1, createdBy: 1, department: 1 }
        )
          .populate("uploadedBy", "name")
          .lean();

        if (itemData?.files?.length > 0) {
          itemData = {
            ...itemData.files[0],
            folderName: itemData.folderName,
            parentId: itemData._id,
          };
          type = "file";
        }
      }

      if (!itemData) continue;

      // Check if the logged-in user is shared WITH (directly or group member)
      const sharedToUser = share.sharedWith.some((sw) => {
        const sharedWithUser = sw.userId?._id?.toString() === user;

        const sharedWithGroupMember =
          sw.groupId &&
          Array.isArray(sw.groupId.members) &&
          sw.groupId.members.map((m) => m.toString()).includes(user);

        return sharedWithUser || sharedWithGroupMember;
      });

      // Check if logged-in user is the one who shared this
      const sharedByUser = share.sharedBy?._id?.toString() === user;

      // Show the item only if user is either the sharer or a recipient
      if (sharedToUser || sharedByUser) {
        let sharedWith = [];

        if (sharedByUser) {
          // Sharer sees all sharedWith entries
          sharedWith = share.sharedWith.map((sw) => {
            let recipient = "Unknown";
            if (sw.groupId && sw.groupId.groupName) {
              recipient = `${sw.groupId.groupName} (Group)`;
            } else if (sw.userId && sw.userId.name) {
              recipient = sw.userId.name;
            }
            return {
              to: recipient,
              access: sw.access,
              sharedAt: sw.sharedAt,
            };
          });
        } else {
          // Recipients see only their relevant shares
          sharedWith = share.sharedWith
            .filter((sw) => {
              const isUser = sw.userId?._id?.toString() === user;
              const isGroupMember =
                sw.groupId &&
                Array.isArray(sw.groupId.members) &&
                sw.groupId.members.map((m) => m.toString()).includes(user);
              return isUser || isGroupMember;
            })
            .map((sw) => {
              let recipient = "Unknown";
              if (sw.groupId && sw.groupId.groupName) {
                recipient = `${sw.groupId.groupName} (Group)`;
              } else if (sw.userId && sw.userId.name) {
                recipient = sw.userId.name;
              }
              return {
                to: recipient,
                access: sw.access,
                sharedAt: sw.sharedAt,
              };
            });
        }

        sharedItems.push({
          _id: isFolder ? share.folderId : share.fileId,
          name: isFolder
            ? itemData.folderName
            : itemData.originalname || "Unnamed File",
          type,
          sharedBy: share.sharedBy?.name || "Unknown",
          sharedWith,
          parentId: isFile ? itemData.parentId : null,
        });
      }
    }

    res.render("sharing", {
      sharedItems,
      message:
        sharedItems.length === 0
          ? "No files or folders shared with you or shared by you."
          : null,
      user,
      getFileIcon,
    });
  } catch (err) {
    console.error("Error in getSharedItemsForUser:", err);
    res.status(500).send("Server Error");
  }
};

//View the share file
const ShareFilesView = async (req, res) => {
  const fileId = req.params.fileId;
  const loggedInUserId = req.session.userId;
  const client = new ftp.Client();

  try {
    const user = await UserModel.findById(loggedInUserId);
    if (!user) return res.status(404).send("User not found");

    const folder = await FolderModel.findOne({ "files._id": fileId }).populate(
      "linkedFolder"
    );
    if (!folder) return res.status(404).send("File not found");

    const file = folder.files.id(fileId);
    if (!file) return res.status(404).send("File not found");

    const folderPath = folder.linkedFolder?.path;
    const folderDept = folder.linkedFolder?.department;

    if (!folderPath || !folderDept)
      return res.status(500).send("Folder path/department missing");

    const ftpConfig = ftpCredentials[folderDept];
    if (!ftpConfig)
      return res
        .status(404)
        .send(`FTP config missing for department: ${folderDept}`);

    const remoteFilePath = `/${folderPath}/${file.originalname}`;
    const mimeType =
      mime.lookup(file.originalname) || "application/octet-stream";

    const share = await ShareModel.findOne({
      file: fileId,
      sharedTo: loggedInUserId,
    });

    const accessLevel = share?.access || "write"; // default to write

    // FTP download
    await client.access(ftpConfig);

    const writableStream = new stream.PassThrough();
    const fileBufferPromise = new Promise((resolve, reject) => {
      const chunks = [];
      writableStream.on("data", (chunk) => chunks.push(chunk));
      writableStream.on("end", () => resolve(Buffer.concat(chunks)));
      writableStream.on("error", reject);
    });

    await client.downloadTo(writableStream, remoteFilePath);
    const fileBuffer = await fileBufferPromise;

    if (mimeType === "application/pdf") {
      const pdfDoc = await PDFDocument.load(fileBuffer, {
        ignoreEncryption: true,
      });
      const newPdfDoc = await PDFDocument.create();
      const pages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page) => newPdfDoc.addPage(page));
      const newBuffer = await newPdfDoc.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${file.originalname}"`
      );
      return res.send(Buffer.from(newBuffer));
    }

    // For non-PDFs
    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      'inline; filename="' + file.originalname + '"'
    );

    if (accessLevel === "NoDownload") {
      return res
        .status(403)
        .send("You do not have permission to download this file.");
    }

    return res.send(fileBuffer);
  } catch (err) {
    console.error("Error:", err);
    if (!res.headersSent) res.status(500).send("Internal Server Error");
  } finally {
    client.close();
  }
};

//based on share access level, return the file or folder

module.exports = {
  shareFilesFolder,
  getSharedWithMeFolders,
  removeSharedFolder,
  shareUserDetails,
  ShareFilesView,
};
