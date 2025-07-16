const ftpCredentials = {
  qnap1: {
    Finance: {
      host: process.env.FTP_HOST_FINANCE,
      user: process.env.FTP_USER_FINANCE,
      password: process.env.FTP_PASSWORD_FINANCE,
    },
    HRAD: {
      host: process.env.FTP_HOST_HRAD,
      user: process.env.FTP_USER_HRAD,
      password: process.env.FTP_PASSWORD_HRAD,
    },
    'Information Technology': {
      host: process.env.FTP_HOST_IT,
      user: process.env.FTP_USER_IT,
      password: process.env.FTP_PASSWORD_IT,
    },
  },
  qnap2: {
    Insurance: {
      host: process.env.FTP_HOST_INSURANCE,
      user: process.env.FTP_USER_INSURANCE,
      password: process.env.FTP_PASSWORD_INSURANCE,
    },
    'Credit & Investment': {
      host: process.env.FTP_HOST_CREDIT,
      user: process.env.FTP_USER_CREDIT,
      password: process.env.FTP_PASSWORD_CREDIT,
    },
  },
  qnap3: {
    Management: {
      host: process.env.FTP_HOST_MANAGEMENT,
      user: process.env.FTP_USER_MANAGEMENT,
      password: process.env.FTP_PASSWORD_MANAGEMENT,
    },
    'Internal Audit': {
      host: process.env.FTP_HOST_AUDIT,
      user: process.env.FTP_USER_AUDIT,
      password: process.env.FTP_PASSWORD_AUDIT,
    },
  },
  qnap4: {
    'Company Secretary': {
      host: process.env.FTP_HOST_SECRETARY,
      user: process.env.FTP_USER_SECRETARY,
      password: process.env.FTP_PASSWORD_SECRETARY,
    },
    Marketing: {
      host: process.env.FTP_HOST_MARKETING,
      user: process.env.FTP_USER_MARKETING,
      password: process.env.FTP_PASSWORD_MARKETING,
    },
  },
  qnap5: {
    Compliance: {
      host: process.env.FTP_HOST_COMPLIANCE,
      user: process.env.FTP_USER_COMPLIANCE,
      password: process.env.FTP_PASSWORD_COMPLIANCE,
    },
    'Corporate Strategy & Business Development': {
      host: process.env.FTP_HOST_CSBD,
      user: process.env.FTP_USER_CSBD,
      password: process.env.FTP_PASSWORD_CSBD,
    },
    Branch: {
      host: process.env.FTP_HOST_BRANCH,
      user: process.env.FTP_USER_BRANCH,
      password: process.env.FTP_PASSWORD_BRANCH,
    },
  },
};
module.exports = ftpCredentials;