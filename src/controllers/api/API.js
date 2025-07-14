const {jwtDecode} = require('jwt-decode');
const User = require('../../model/users'); 

const authLogin = async (req, res) => {
  const { username, password } = req.query;
  console.log(username, password);
  
  const { accessToken } = req.body?.data || {};
  try {
    const decoded = jwtDecode(accessToken);

    const userInfo = {
      employeeId: decoded.employee_id,
      name: decoded.name,
      email: decoded.email,
      employeeCode: decoded.employee_code,
      department: decoded.department,
    };
    const user = await User.findOneAndUpdate(
      { employeeId: userInfo.employeeId },
      userInfo,
      { new: true, upsert: true }
    );
   req.session.userId = user._id;
    res.redirect('/welcome');
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = {
  authLogin,
};
