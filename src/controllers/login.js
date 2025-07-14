const {ERPURL} = require('../config/ErpURL');


const logout = (req, res, next) => {
  if (req.cookies.token) {
    // Clear the cookie named 'token'
    res.clearCookie('token');

    // Optionally destroy the session if using session middleware
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return next(err);
        } else {
          return res.redirect(`${ERPURL}`); 
        }
      });
    } else {
      return res.redirect(`${ERPURL}`); 
    }
  } else {
    // If no token cookie, just redirect
    return res.redirect(`${ERPURL}`); 
  }
};

module.exports = {
  logout 
}