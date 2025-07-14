const UserModel = require('../model/users');
const {ERPURL} = require('../config/ErpURL');
const CreateFolder = require('../model/folder');
const FileModel = require('../model/File');
const Share = require('../model/share');
const home = async (req, res) => {
  try {
    let currentPath = req.query.path || '/'; // Default to root path if not provided
    // Set the current path in the session for later use
    req.session.currentPath = currentPath;
    currentPath = decodeURIComponent(currentPath);
    console.log(currentPath);
    
    // Check if user is logged in
    if (!req.session.userId) {
      return res.redirect(`${ERPURL}`); 
    }

    // Fetch the logged-in user details from the database
    const user = await UserModel.findById(req.session.userId);

    if (!user) {
      req.flash("error", "User Not Found!");
      return res.status(404).send("User not found");
    }

    req.flash("success", "Login successful!");
    return res.render('welcome.ejs', { user, currentPath });
  } catch (error) {
    req.flash("error", "Internal Server Error");
    return res.redirect(`${ERPURL}`); 
  }
};

// const login = (req, res) => {
//   return res.render('./authentication/login.ejs');
// };

// const register = (req, res) => {
//   return res.render('./authentication/register.ejs', { messages: req.flash() });
// };
const welcome = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("error", "Session expired or user not logged in");
      return res.redirect(`${ERPURL}`);
    }

    const user = await UserModel.findById(req.session.userId);
    if (!user) {
      req.flash("error", "User Not Found!");
      return res.status(404).send("User not found");
    }

    // Count total folders
    const totalFolders = await CreateFolder.countDocuments();

    // Count total files (assuming you have a File model)
    const totalFiles = await FileModel.countDocuments();

    // Count shared folders
    const sharedFolders = await Share.countDocuments({ folderId: { $ne: null } });

    // Count shared files
    const sharedFiles = await Share.countDocuments({ fileId: { $ne: null } });

    req.flash("success", "Login successful!");
    return res.render('index.ejs', {
      messages: req.flash(),
      user,
      stats: {
        totalFolders,
        totalFiles,
        sharedFolders,
        sharedFiles
      }
    });

  } catch (error) {
    console.error("Error loading user:", error.message);
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  getHome: home,
  getWelcome: welcome,
};
