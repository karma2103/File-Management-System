const express = require("express");
const session = require('express-session');
const { requireAuth } = require('../middleware/logincheck');
const flash = require('connect-flash');

const router = express.Router();
const homeController = require("../controllers/home");
const uploadController = require("../controllers/upload");
const shareController  = require("../controllers/shareController");
const searchController = require("../controllers/searchController");
const APIController = require("../controllers/api/API");
const AuthController = require("../controllers/api/Auth");
const CommitteeController = require("../controllers/Committe");
const loginController = require("../controllers/login");

router.use(express.json())
router.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));
router.use(flash());
router.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});
let routes = app => {
  //Auth 
  router.get("/Uploads", requireAuth, homeController.getHome); 
  router.get('/welcome', homeController.getWelcome);
  router.post("/multiple-upload", requireAuth, uploadController.multipleUpload);
  // router.get('/',requireAuth, uploadController.getScan)
  router.get('/folder/:folderId',requireAuth, uploadController.getFolderContents)
  // router.get('/files/:fileId',requireAuth, uploadController.getFileFromQNAP)
  router.post('/create-folder',requireAuth, uploadController.createFolder)
  router.get("/checking", requireAuth, uploadController.checkFolder)
  router.get("/testcheck/:id", requireAuth, uploadController.testCheck);
  router.get("/view/:fileId", requireAuth, uploadController.viewFileFromQNAP);

  //sharing
  router.post("/folder/share", requireAuth, shareController.shareFilesFolder);
  router.get('/sharing', requireAuth, shareController.getSharedWithMeFolders);
  router.get('/shared-users/:type/:id', requireAuth, shareController.shareUserDetails);
  router.post("/stop-share", requireAuth, shareController.removeSharedFolder);
  router.get('/shared-files/:fileId', requireAuth, shareController.ShareFilesView);

  //search
  router.get("/DeepSearch", requireAuth, searchController.showSearchPage);

  // API Autjentication
  router.post('/api/v1/login', APIController.authLogin);
  router.get("/password", AuthController.GetAuth )
  router.get("/logout",loginController.logout); 
  
  //add Committees
  router.post('/AddGroup', requireAuth, CommitteeController.AddGroupMembers);
  router.get('/committees', requireAuth, CommitteeController.ViewCommittee);
  router.get('/addCommittee', requireAuth, CommitteeController.addCommittee);
  router.get('/editGroup/:id', requireAuth, CommitteeController.editGroup);
  router.post('/committee-groups/:id/edit', requireAuth, CommitteeController.postEditGroup);

  return app.use("/", router);
};

module.exports = routes;