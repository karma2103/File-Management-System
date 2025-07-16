const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },  // renamed here
  name: String,
  email: String,
  employee_code: String,
  department: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
