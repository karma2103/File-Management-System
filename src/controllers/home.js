const UserModel = require('../model/users');

const home = async (req, res) => {
  try {
    let currentPath = req.query.path || '/'; // Default to root path if not provided
    // Set the current path in the session for later use
    req.session.currentPath = currentPath;
    currentPath = decodeURIComponent(currentPath);
    console.log(currentPath);
    
    // Check if user is logged in
    if (!req.session.userId) {
      return res.redirect('/login'); 
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
    return res.redirect('/login');
  }
};

const login = (req, res) => {
  return res.render('./authentication/login.ejs');
};

const register = (req, res) => {
  return res.render('./authentication/register.ejs', { messages: req.flash() });
};

const welcome = async (req, res) => {
  const user = await UserModel.findById(req.session.userId);
  if (!user) {
    req.flash("error", "User Not Found!");
    return res.status(404).send("User not found");
  }
  req.flash("success", "Login successful!");

  return res.render('index.ejs', { messages: req.flash(), user });
};

module.exports = {
  getHome: home,
  getLogin: login,
  getWelcome: welcome,
  getRegister: register,
};
