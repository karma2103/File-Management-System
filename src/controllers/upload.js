const handleFileUpload = require("../middleware/upload");
const FolderModel = require("../model/File");
const UserModel = require("../model/users");
const ftp = require("basic-ftp");
const CommitteeGroup = require("../model/Committee");
require("dotenv").config();
const Folder = require("../model/folder");
const mime = require("mime-types");
const Share = require("../model/share");
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
  loan: {
    host: process.env.FTP_HOST_LOAN,
    user: process.env.FTP_USER_LOAN,
    password: process.env.FTP_PASSWORD_LOAN,
  },
  ppf_gf: {
    host: process.env.FTP_HOST_PPF_GF,
    user: process.env.FTP_USER_PPF_GF,
    password: process.env.FTP_PASSWORD_PPF_GF,
  },
  "Information Technology": {
    host: process.env.FTP_HOST_IT,
    user: process.env.FTP_USER_IT,
    password: process.env.FTP_PASSWORD_IT,
  },
  HRAD: {
    host: process.env.FTP_HOST_HRAD,
    user: process.env.FTP_USER_HRAD,
    password: process.env.FTP_PASSWORD_HRAD,
  },
  "Credit & Investment": {
    host: process.env.FTP_HOST_CREDIT,
    user: process.env.FTP_USER_CREDIT,
    password: process.env.FTP_PASSWORD_CREDIT,
  },
  Management: {
    host: process.env.FTP_HOST_MANAGEMENT,
    user: process.env.FTP_USER_MANAGEMENT,
    password: process.env.FTP_PASSWORD_MANAGEMENT,
  },
  "Internal Audit": {
    host: process.env.FTP_HOST_AUDIT,
    user: process.env.FTP_USER_AUDIT,
    password: process.env.FTP_PASSWORD_AUDIT,
  },
  "Company Secretary": {
    host: process.env.FTP_HOST_SECRETARY,
    user: process.env.FTP_USER_SECRETARY,
    password: process.env.FTP_PASSWORD_SECRETARY,
  },
  Marketing: {
    host: process.env.FTP_HOST_MARKETING,
    user: process.env.FTP_USER_MARKETING,
    password: process.env.FTP_PASSWORD_MARKETING,
  },
  Compliance: {
    host: process.env.FTP_HOST_COMPLIANCE,
    user: process.env.FTP_USER_COMPLIANCE,
    password: process.env.FTP_PASSWORD_COMPLIANCE,
  },
  "Corporate Strategy & Business Development": {
    host: process.env.FTP_HOST_CSBD,
    user: process.env.FTP_USER_CSBD,
    password: process.env.FTP_PASSWORD_CSBD,
  },
  Branch: {
    host: process.env.FTP_HOST_BRANCH,
    user: process.env.FTP_USER_BRANCH,
    password: process.env.FTP_PASSWORD_BRANCH,
  },
};

const multipleUpload = async (req, res) => {
  try {
    const folderID = await handleFileUpload(req);

    const path = encodeURIComponent(req.body.path);

    // Construct URL with folderID and path query param
    const dynamicURL = `/testcheck/${folderID}?path=${path}`;
    return res.redirect(dynamicURL);
  } catch (error) {
    console.error(error);

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      req.flash("error", "Too many files to upload.");
      return res.status(400).redirect(req.headers.referer || "/checking");
    }

    req.flash("error", error.message || "Error when trying to upload files.");
    return res.status(500).redirect(req.headers.referer || "/checking");
  }
};

//for size calculation
const formatFileSize = (size) => {
  if (size === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return parseFloat((size / Math.pow(1024, i)).toFixed(2)) + " " + units[i];
};

// for files counnt
const countFolder = () => {
  const count = 0;
  const folderData = FolderModel.find();
  folderData.forEach((folderElement) => {
    if (folderElement.uploadType == "Folder") {
      count++;
    }
  });
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

const getScan = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const loggedInUserId = req.session.userId;
    const user = await UserModel.findById(loggedInUserId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/upload");
    }

    const loggedInUserDepartment = user.department;

    const usersInSameDepartment = await UserModel.find({
      department: loggedInUserDepartment,
      _id: { $ne: loggedInUserId },
    });

    const userIdsInSameDepartment = usersInSameDepartment.map(
      (user) => user._id
    );

    const folders = await FolderModel.find({
      $or: [
        { uploadedBy: loggedInUserId },
        { uploadedBy: { $in: userIdsInSameDepartment } },
      ],
    })
      .populate("uploadedBy", "username department")
      .populate("files.uploadedBy", "username department")
      .skip(skip)
      .limit(limit);

    // Calculate file count for each folder
    folders.forEach((folder) => {
      folder.fileCount = folder.files.length;
    });

    const count = await FolderModel.countDocuments({
      $or: [
        { uploadedBy: loggedInUserId },
        { uploadedBy: { $in: userIdsInSameDepartment } },
      ],
    });
    const totalPages = Math.ceil(count / limit);

    return res.render("SaveScan", {
      limit,
      folders,
      currentPage: page,
      totalPages,
      loggedInUserId,
      formatFileSize,
      getFileIcon,
      user,
    });
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getFolderContents = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const totalItems = await FolderModel.countDocuments();

    const loggedInUserId = req.session.userId;
    const user = await UserModel.findById(loggedInUserId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/upload");
    }

    const folderId = req.params.folderId;
    const folder = await FolderModel.findById(folderId)
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "ame department")
      .populate("files.uploadedBy", "name department");
    // console.log(folder);
    if (!folder) {
      return res.status(404).render("error", { message: "Folder not found" });
    }

    res.render("eachFiles.ejs", {
      folder,
      formatFileSize,
      getFileIcon,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      user,
    });
  } catch (err) {
    console.error("Error fetching folder contents:", err);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const createFolder = async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    if (!req.body || !req.body.folderName) {
      return res.status(400).json({ error: "Folder name is required." });
    }

    const { folderName } = req.body;

    // Sanitize folder name
    const sanitizeFolderName = (name) =>
      name.replace(/[\\/:*?"<>|]/g, "").trim();
    const sanitizedFolderName = sanitizeFolderName(folderName);

    if (!sanitizedFolderName) {
      return res.status(400).json({ error: "Invalid folder name." });
    }

    const loggedInUserId = req.session.userId;
    if (!loggedInUserId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User not logged in." });
    }

    const user = await UserModel.findById(loggedInUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const department = user.department;
    const ftpConfig = ftpCredentials[department];
    if (!ftpConfig) {
      return res.status(404).json({ error: "Department not configured." });
    }

    await client.access(ftpConfig);

    // Ensure the directory exists
    const folderPath = `${department}/${sanitizedFolderName}`;
    await client.ensureDir(folderPath);

    console.log(
      `✅ Folder '${sanitizedFolderName}' created successfully in ${department}.`
    );

    // Save folder in MongoDB
    const newFolder = new Folder({
      folderName: sanitizedFolderName,
      createdBy: loggedInUserId,
      department,
      path: folderPath,
    });

    await newFolder.save();
    req.flash(
      "success",
      `Folder '${sanitizedFolderName}' created successfully.`
    );
    res.status(201).json({
      message: `Folder '${sanitizedFolderName}' created successfully.`,
      folderId: newFolder._id,
      folderPath,
    });
  } catch (err) {
    console.error("❌ Error creating folder:", err);
    res
      .status(500)
      .json({ error: "Failed to create folder.", details: err.message });
  } finally {
    client.close();
  }
};

//testing
const checkFolder = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const totalItems = await FolderModel.countDocuments();

    const loggedInUserId = req.session.userId;
    const user = await UserModel.findById(loggedInUserId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/upload");
    }

    const folders = await Folder.find({
      $or: [{ createdBy: loggedInUserId }],
    })
      .populate("createdBy", "name department")
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalItems / limit);

    return res.render("check", {
      limit,
      folders,
      currentPage: page,
      totalPages,
      loggedInUserId,
      user,
    });
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const testCheck = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalItems = await FolderModel.countDocuments();
    const folderId = req.params.id;

    const allUsers = await UserModel.find({}).select("user name department");
    const allgroups = await CommitteeGroup.find({}).select("groupName");

    const loggedInUserId = req.session.userId;
    const user = await UserModel.findById(loggedInUserId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/upload");
    }

    const parentFolder = await Folder.findById(folderId);
    if (!parentFolder) return res.status(404).send("Folder not found");

    // 1. Get child folders with files
    const folders = await FolderModel.find({ linkedFolder: parentFolder._id })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy")
      .populate("files.uploadedBy")
      .lean();

    // 2. Get all shares for this parent folder's children
    const folderIds = folders.map((f) => f._id);
    const fileIds = folders.flatMap((f) => f.files.map((file) => file._id));

    const shares = await Share.find({
      $or: [{ folderId: { $in: folderIds } }, { fileId: { $in: fileIds } }],
    })
      .populate("sharedWith.userId")
      .populate("sharedWith.groupId")
      .lean();

    // 3. Attach sharing info to folders and files
    folders.forEach((folder) => {
      const shareEntry = shares.find(
        (s) => s.folderId?.toString() === folder._id.toString()
      );
      folder.sharedWith = shareEntry ? shareEntry.sharedWith : [];

      folder.files = folder.files.map((file) => {
        const fileShare = shares.find(
          (s) => s.fileId?.toString() === file._id.toString()
        );
        file.sharedWith = fileShare ? fileShare.sharedWith : [];
        return file;
      });
    });

    res.render("eachFiles copy.ejs", {
      folder: folders,
      getFileIcon,
      formatFileSize,
      user,
      allUsers,
      allgroups,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      userSessionId: req.session.userId,
    });
  } catch (err) {
    console.error("❌ Error in testCheck:", err);
    res.status(500).send("Internal server error");
  }
};

const logDownload = async (fileId, userId) => {
  try {
    // First try: Look for Share with fileId
    let share = await Share.findOne({ fileId });
    if (share) {
      return;
    }

    // If not found by fileId, try finding folder that contains the fileId
    if (!share) {
      const folderDoc = await FolderModel.findOne({ "files._id": fileId });
      if (!folderDoc) {
        return;
      }

      // Now try finding Share by folderId
      share = await Share.findOne({ folderId: folderDoc._id });
      if (!share) {
        return;
      }
    }
    // Log download only if not already logged
    const alreadyLogged = share.downloadedBy.some(
      (entry) => entry.userId.toString() === userId.toString()
    );

    if (!alreadyLogged) {
      share.downloadedBy.push({ userId, downloadedAt: new Date() });
      await share.save();
    } else {
      return;
    }
  } catch (err) {
    console.error("🔥 Error logging download:", err);
  }
};


const viewFileFromQNAP = async (req, res) => {
  const fileId = req.params.fileId;
  const loggedInUserId = req.session.userId;
  const client = new ftp.Client();

  try {
    const user = await UserModel.findById(loggedInUserId);
    if (!user) return res.status(404).send("User not found");

    const department = user.department;
    const ftpConfig = ftpCredentials[department];
    if (!ftpConfig) return res.status(404).send("Department not configured");

    const folder = await FolderModel.findOne({ "files._id": fileId }).populate("linkedFolder");
    if (!folder) return res.status(404).send("File not found in database");

    const file = folder.files.id(fileId);
    if (!file) return res.status(404).send("File not found");

    // Log the download
    await logDownload(file._id, loggedInUserId);

    // Construct full path: /<linkedFolder.path>/<folder.folderName>/<file.originalname>
    const folderPath = `${folder.linkedFolder?.path || ""}/${folder.folderName || ""}`.replace(/\/+/g, "/");

    if (!folderPath) return res.status(500).send("Folder path missing");

    const remoteFilePath = `/${folderPath}/${file.originalname}`.replace(/\/+/g, "/").trim();
    console.log(`Downloading file: ${remoteFilePath}`);

    const mimeType = mime.lookup(file.originalname) || "application/octet-stream";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${file.originalname}"`);

    await client.access(ftpConfig);
    await client.downloadTo(res, remoteFilePath);
  } catch (err) {
    console.error("Error retrieving file:", err);
    if (!res.headersSent) res.status(500).send("Internal Server Error");
  } finally {
    client.close();
  }
};


module.exports = {
  multipleUpload,
  getScan,
  getFolderContents,
  createFolder,
  checkFolder,
  testCheck,
  viewFileFromQNAP,
};
