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
    "Information Technology": {
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
    "Credit & Investment": {
      host: process.env.FTP_HOST_CREDIT,
      user: process.env.FTP_USER_CREDIT,
      password: process.env.FTP_PASSWORD_CREDIT,
    },
    Compliance: {
      host: process.env.FTP_HOST_COMPLIANCE,
      user: process.env.FTP_USER_COMPLIANCE,
      password: process.env.FTP_PASSWORD_COMPLIANCE,
    },
  },
  qnap3: {
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
  },
  qnap4: {
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
    "Corporate Strategy & Business Development": {
      host: process.env.FTP_HOST_CSBD,
      user: process.env.FTP_USER_CSBD,
      password: process.env.FTP_PASSWORD_CSBD,
    },
  },
  qnap5: {
    Phuentsholing: {
      host: process.env.FTP_HOST_PHUENTSHOLING,
      user: process.env.FTP_USER_PHUENTSHOLING,
      password: process.env.FTP_PASSWORD_PHUENTSHOLING,
    },
    Wangdue: {
      host: process.env.FTP_HOST_WANGDUE,
      user: process.env.FTP_USER_WANGDUE,
      password: process.env.FTP_PASSWORD_WANGDUE,
    },
    Paro: {
      host: process.env.FTP_HOST_PARO,
      user: process.env.FTP_USER_PARO,
      password: process.env.FTP_PASSWORD_PARO,
    },
    Gelephu: {
      host: process.env.FTP_HOST_GELEPHU,
      user: process.env.FTP_USER_GELEPHU,
      password: process.env.FTP_PASSWORD_GELEPHU,
    },
    Babesa: {
      host: process.env.FTP_HOST_BABESA,
      user: process.env.FTP_USER_BABESA,
      password: process.env.FTP_PASSWORD_BABESA,
    },
    "Thimphu City": {
      host: process.env.FTP_HOST_THIMPHU_CITY,
      user: process.env.FTP_USER_THIMPHU_CITY,
      password: process.env.FTP_PASSWORD_THIMPHU_CITY,
    },
    "Paro Lango": {
      host: process.env.FTP_HOST_PARO_LANG0,
      user: process.env.FTP_USER_PARO_LANG0,
      password: process.env.FTP_PASSWORD_PARO_LANG0,
    },
    "Samdrup Jongkhar": {
      host: process.env.FTP_HOST_SAMDRUP_JONGKHAR,
      user: process.env.FTP_USER_SAMDRUP_JONGKHAR,
      password: process.env.FTP_PASSWORD_SAMDRUP_JONGKHAR,
    },
    Mongar: {
      host: process.env.FTP_HOST_MONGAR,
      user: process.env.FTP_USER_MONGAR,
      password: process.env.FTP_PASSWORD_MONGAR,
    },
    Bumthang: {
      host: process.env.FTP_HOST_BUMTHANG,
      user: process.env.FTP_USER_BUMTHANG,
      password: process.env.FTP_PASSWORD_BUMTHANG,
    },
    Trashigang: {
      host: process.env.FTP_HOST_TRASHIGANG,
      user: process.env.FTP_USER_TRASHIGANG,
      password: process.env.FTP_PASSWORD_TRASHIGANG,
    },
    Tsirang: {
      host: process.env.FTP_HOST_TSIRANG,
      user: process.env.FTP_USER_TSIRANG,
      password: process.env.FTP_PASSWORD_TSIRANG,
    },
    Trongsa: {
      host: process.env.FTP_HOST_TRONGSA,
      user: process.env.FTP_USER_TRONGSA,
      password: process.env.FTP_PASSWORD_TRONGSA,
    },
    Samtse: {
      host: process.env.FTP_HOST_SAMTSE,
      user: process.env.FTP_USER_SAMTSE,
      password: process.env.FTP_PASSWORD_SAMTSE,
    },
    Zhemgang: {
      host: process.env.FTP_HOST_ZHEMGANG,
      user: process.env.FTP_USER_ZHEMGANG,
      password: process.env.FTP_PASSWORD_ZHEMGANG,
    },
    Nganglam: {
      host: process.env.FTP_HOST_NGANGLAM,
      user: process.env.FTP_USER_NGANGLAM,
      password: process.env.FTP_PASSWORD_NGANGLAM,
    },
    Khuruthang: {
      host: process.env.FTP_HOST_KHURUTHANG,
      user: process.env.FTP_USER_KHURUTHANG,
      password: process.env.FTP_PASSWORD_KHURUTHANG,
    },
    Gedu: {
      host: process.env.FTP_HOST_GEDU,
      user: process.env.FTP_USER_GEDU,
      password: process.env.FTP_PASSWORD_GEDU,
    },
    Haa: {
      host: process.env.FTP_HOST_HAA,
      user: process.env.FTP_USER_HAA,
      password: process.env.FTP_PASSWORD_HAA,
    },
    Trashiyangtse: {
      host: process.env.FTP_HOST_TRASHIYANGTSE,
      user: process.env.FTP_USER_TRASHIYANGTSE,
      password: process.env.FTP_PASSWORD_TRASHIYANGTSE,
    },
    Dagapela: {
      host: process.env.FTP_HOST_DAGAPELA,
      user: process.env.FTP_USER_DAGAPELA,
      password: process.env.FTP_PASSWORD_DAGAPELA,
    },
    Tashichhoeling: {
      host: process.env.FTP_HOST_TASHICHHOELING,
      user: process.env.FTP_USER_TASHICHHOELING,
      password: process.env.FTP_PASSWORD_TASHICHHOELING,
    },
  },
};
module.exports = {
  ftpCredentials
};