const express = require('express');
const multer = require('multer');
const ftp = require('basic-ftp');
const mongoose = require('mongoose');
const FolderModel = require('../model/File');
const UserModel = require('../model/users');
const { Readable } = require('stream');
const CreateFolder = require('../model/folder')
require('dotenv').config();

const app = express();

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Multer Configuration (for memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const acceptedMimeTypes = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/gif'
    ];

    if (!acceptedMimeTypes.includes(file.mimetype)) {
      cb(new Error(`${file.originalname} is invalid. Only accept PDF, Word, Excel, and image files.`), false);
    } else {
      cb(null, true);
    }
  }
}).any(); // Accept multiple files

// Define FTP Credentials for Different QNAP Devices
const ftpCredentials = {
  qnap1: {
    Finance: {
      host: process.env.FTP_HOST_FINANCE,
      user: process.env.FTP_USER_FINANCE,
      password: process.env.FTP_PASSWORD_FINANCE,
    },
  },
  qnap2: {
    Insurance: {
      host: process.env.FTP_HOST_INSURANCE,
      user: process.env.FTP_USER_INSURANCE,
      password: process.env.FTP_PASSWORD_INSURANCE,
    },
  },
  qnap3: {
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
  }
};

// Function to Select the Correct QNAP Device Based on Department
const getQnapCredentials = (department) => {
  if (ftpCredentials.qnap1[department]) return ftpCredentials.qnap1[department];
  if (ftpCredentials.qnap2[department]) return ftpCredentials.qnap2[department];
  if (ftpCredentials.qnap3[department]) return ftpCredentials.qnap3[department];
  throw new Error(`No FTP server found for department: ${department}`);
};


// Function to Check FTP Connection
const checkQnapConnection = async (department) => {
  const client = new ftp.Client();
  try {
    const qnapServer = getQnapCredentials(department);
    await client.access(qnapServer);
    console.log(`✅ QNAP connected for department: ${department}`);
    return true;
  } catch (err) {
    console.error(`❌ QNAP connection failed for department: ${department}`, err);
    return false;
  } finally {
    client.close();
  }
};

// Function to Upload File to FTP (QNAP)
const uploadFileToFTP = async (fileStream, remoteFilePath, department) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    const isConnected = await checkQnapConnection(department);
    if (!isConnected) throw new Error(`QNAP for ${department} is not connected.`);

    const qnapServer = getQnapCredentials(department);
    await client.access(qnapServer);

    // Extract dir and file name
    const remoteDir = remoteFilePath.substring(0, remoteFilePath.lastIndexOf('/'));
    const fileName = remoteFilePath.substring(remoteFilePath.lastIndexOf('/') + 1);

    console.log("🔧 Ensuring directory path:", remoteDir);

    // STEP-BY-STEP navigate and ensure folders
    const folders = remoteDir.split('/');
    for (const folder of folders) {
      if (folder.trim()) {
        try {
          await client.ensureDir(folder);
        } catch (err) {
          console.warn(`⚠️ Folder ${folder} might already exist:`, err.message);
        }
      }
    }

    // ✅ We're now inside remoteDir (e.g., Finance/testing 2)
    // ⛔ DO NOT `cd` again into the full path — you're already there

    await client.uploadFrom(fileStream, fileName);
    console.log(`✅ Uploaded ${fileName} to ${remoteDir}`);
    return `Uploaded to ${remoteDir}/${fileName}`;
   
  } catch (err) {
    console.error(`❌ Failed to upload ${remoteFilePath}:`, err);
    throw new Error(`Failed to upload ${fileName}`);
  } finally {
    client.close();
  }
};

// Handle File Upload
const handleFileUpload = (req) => {
  return new Promise((resolve, reject) => {
    upload(req, null, async (err) => {
      if (err) {
        return reject(err);
      }
      try {
        const uploadType = req.body.uploadType;
        if (!uploadType) {
          return reject(new Error('Upload type is missing.'));
        }

        let path = req.body.path;
        path = decodeURIComponent(path);
        if (!path) {
          return reject(new Error('Folder path is missing.'));
        }

        const userId = req.session.userId;
        const user = await UserModel.findById(userId);
        if (!user) {
          return reject(new Error('User not found.'));
        }

        const parentFolder = await CreateFolder.findOne({ path });
        if (!parentFolder) {
          return reject(new Error('Folder not found.'));
        }

        const department = parentFolder.department;

        const processFolder = async (files, parentPath, folderName, linkedFolderID) => {
          if (!files || files.length === 0) throw new Error('No files to process.');

          const fileData = [];

          for (const file of files) {
            const remoteFileName = `${parentPath}/${file.originalname}`;
            try {
              const fileStream = Readable.from(file.buffer);
              await uploadFileToFTP(fileStream, remoteFileName, department);

              fileData.push({
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: remoteFileName,
                uploadedBy: userId,
                department: user.department,
              });
            } catch (err) {
              throw new Error(`Failed to upload ${file.originalname}`);
            }
          }

          await FolderModel.create({
            folderName,
            uploadType,
            uploadedBy: userId,
            files: fileData,
            linkedFolder: linkedFolderID,
          });
        };

        if (uploadType === 'Folder') {
          const folderName = req.body.folderName;
          const folderPath = `${path}/${folderName}`;
          await processFolder(req.files, folderPath, folderName, parentFolder._id);
        } else {
          await processFolder(req.files, path, '', parentFolder._id);
        }

        resolve(parentFolder._id); // success
      } catch (error) {
        reject(error);
      }
    });
  });
};


module.exports = handleFileUpload;
