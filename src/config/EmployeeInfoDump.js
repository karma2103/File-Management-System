const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../model/users'); // Adjust path

mongoose.connect('mongodb+srv://karmatshew471:DMS@cluster0.fmyq3j6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function importFromAPI() {
  try {
    const res = await axios.get('http://172.16.40.36:8000/api/allemployee');
    const employees = res.data.data;

    if (!Array.isArray(employees)) {
      throw new Error('API did not return an array');
    }

    const cleanEmployees = employees.filter(emp => emp.employee_id);

    for (const emp of cleanEmployees) {
      // Rename fields here
      const doc = {
        employeeId: emp.employee_id,    // renamed
        name: emp.name,
        email: emp.email,
        employee_code: emp.employee_code,
        department: emp.departments,    // renamed
      };

      await User.updateOne(
        { employeeId: emp.employee_id }, // match by renamed key!
        { $set: doc },
        { upsert: true }
      );
    }

    console.log(`✅ Upserted ${cleanEmployees.length} employees successfully.`);
  } catch (err) {
    console.error('❌ Error importing employees:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

importFromAPI();
