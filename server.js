const twilio = require('twilio');

// Twilio credentials
const accountSid = 'ACfda1f7fa302cb3dd05ab3ad600d4e95f';
const authToken = '7dd075405f39c71456211bbf092926b0';
const client = require('twilio')(accountSid, authToken);

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Enable CORS (allow cross-origin requests)
app.use(cors());

// Parse incoming request bodies in JSON format
app.use(bodyParser.json());

// Create MySQL database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",      // MySQL username
  password: "Tishank@1812",  // MySQL password
  database: "Attendance"  // Database name
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    return;
  }
  console.log("Connected to the MySQL database.");
});

// Endpoint to check employee QR code and update attendance
app.post("/check-in", (req, res) => {
  const { employee_id } = req.body;

  // Query to find the employee by their QRCode
  const checkEmployeeQuery = `SELECT * FROM EmployeeDetail WHERE EmployeeID = ?`;

  db.query(checkEmployeeQuery, [employee_id], (err, result) => {
    if (err) {
      console.error("Error querying the database:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = result[0];
    const employeePhone = employee.PhoneNumber;

    // Send employee details to WhatsApp
    client.messages.create({
      from: 'whatsapp:+14155238886',  // Your Twilio WhatsApp number
      to: `whatsapp:+91${employeePhone}`,  // Employee's WhatsApp number
      body: `Hello ${employee.FullName}, you've successfully checked in. Your details are: EmployeeID: ${employee.EmployeeID}, Name: ${employee.FullName}, Email: ${employee.Email}`
    }).then(message => {
      console.log(`WhatsApp message sent to EmployeeID: ${employee.EmployeeID}`);
    }).catch(err => {
      console.error(`Failed to send WhatsApp message to EmployeeID: ${employee.EmployeeID}`, err);
    });

    // Employee found, update attendance status
    const updateAttendanceQuery = `UPDATE EmployeeDetail SET checked_in = 1 WHERE EmployeeID = ?`;

    db.query(updateAttendanceQuery, [employee_id], (err, updateResult) => {
      if (err) {
        console.error("Error updating attendance:", err);
        return res.status(500).json({ message: "Attendance update failed" });
      }

      res.status(200).json({ message: "Employee checked in successfully" });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
