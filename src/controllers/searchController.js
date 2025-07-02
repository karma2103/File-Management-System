const FolderModel = require("../model/File");
const CreateFolder = require("../model/folder");
const UserModel = require("../model/users");

async function deepSearchWithFilter(folderId, keyword, department) {
  keyword = keyword.toLowerCase();
  const matches = [];

  const baseFolder = await CreateFolder.findById(folderId).lean();
  if (!baseFolder || baseFolder.department !== department) return [];

  const entries = await FolderModel.find({ linkedFolder: folderId })
    .populate("uploadedBy");

  for (const entry of entries) {
    // Safely check folder name
    if (
      entry.folderName &&
      entry.folderName.toLowerCase().includes(keyword)
    ) {
      matches.push({
        type: "folder",
        name: entry.folderName,
        date: entry.date,
        uploadedBy: entry.uploadedBy?.username || "N/A",
        department: baseFolder.department,
      });
    }

    // Safely check files
    for (const file of entry.files || []) {
      const originalNameMatch =
        file.originalname &&
        file.originalname.toLowerCase().includes(keyword);
      const filenameMatch =
        file.filename &&
        file.filename.toLowerCase().includes(keyword);

      if (originalNameMatch || filenameMatch) {
        matches.push({
          type: "file",
          name: file.originalname || file.filename,
          filename: file.filename,
          date: file.date,
          uploadedBy: entry.uploadedBy?.username || "N/A",
          department: baseFolder.department,
        });
      }
    }

    // Recurse deeper
    const childMatches = await deepSearchWithFilter(
      entry._id,
      keyword,
      department
    );
    matches.push(...childMatches);
  }

  return matches;
}

async function deepSearchInDepartment(department, keyword) {
  const topLevelFolders = await CreateFolder.find({ department }).lean();
  const allMatches = [];

  for (const folder of topLevelFolders) {
    const matches = await deepSearchWithFilter(folder._id, keyword, department);
    allMatches.push(...matches);
  }

  return allMatches;
}

const showSearchPage = async (req, res) => {
  try {
    const user = await UserModel.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User not found!");
      return res.redirect("/login");
    }

    const { keyword } = req.query;
    const department = user.department;

    if (!keyword || !department) {
      return res.render("DeepSearch.ejs", { matches: [], keyword, user });
    }

    const matches = await deepSearchInDepartment(department, keyword);

    res.render("DeepSearch.ejs", {
      matches,
      keyword,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error during search");
  }
};

module.exports = {
  showSearchPage,
};
