const express = require("express");
const router = express.Router();
const axios = require('axios');
const User = require('../../model/users');
const {jwtDecode} = require('jwt-decode'); // default import
const cookies = require('cookie-parser');
router.use(cookies());

const GetAuth = async (req, res) => {
  const username = req.query.username;
  const password = req.query.password;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Send POST request to the login API
    const response = await axios.post('http://172.16.16.195:4000/api/v1/login', {
      username,
      password
    });

    // Assuming the API returns an access token
    const accessToken = response.data.data.accessToken;

    // Set the cookie correctly
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Decode the token we just got
    const decoded = jwtDecode(accessToken);

    const userInfo = {
      employeeId: decoded.employee_id || decoded.employeeId,
      name: decoded.name,
      email: decoded.email,
      employeeCode: decoded.employee_code || decoded.employeeCode,
      department: decoded.department,
    };

    // Update or create user in DB
    const user = await User.findOneAndUpdate(
      { employeeId: userInfo.employeeId },
      userInfo,
      { new: true, upsert: true }
    );

    // Save user id in session
    req.session.userId = user._id;

    // Redirect to welcome page
    return res.redirect("/welcome");

  } catch (err) {
    console.error(err.message);

    if (err.response) {
      return res.status(err.response.status).json({
        error: err.response.data
      });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  GetAuth,
};
