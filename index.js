require("dotenv").config(); // ✅ Must be at the top

const express = require("express");
const authRouter = require("./routes/authRouter");
const cors = require("cors");
const Routercontact = require("./routes/contactRouter");
const winston = require('winston');
const logger = require("./config/logger");
const groupRouter = require("./routes/groupRouter");
const contactAssignGroupRouter = require("./routes/contactAssignGroupRouter");
const path = require('path');
require("./models/dbConnection"); // Ensure this runs
const adminRouter = require("./routes/admin/adminRouter");
const app = express();
const PORT = process.env.PORT;

// ✅ Middleware setup
app.use(express.json());

app.use(
    cors({
        origin: [process.env.FRONTEND_URL],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
    );

// Your error-handling middleware
app.use((err, req, res, next) => {
    // Log the error message and stack trace using the logger from logger.js
    logger.error(`${err.message}\n${err.stack}`);

    // Send a generic response
    res.status(500).json({ message: 'Something went wrong!' });
});

//app.use('./uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// ✅ Use auth routes correctly
app.use("/auth", authRouter);
app.use("/contacts", Routercontact);
app.use("/groups", groupRouter);
app.use("/assigncontactgroup", contactAssignGroupRouter);
app.use("/admin", adminRouter);

app.get('/test',(req,res)=>{
    res.status(201).json({ message: 'Event created successfully'});
})

// For testing and debugging
app.get('/error', (req, res) => {
    // This will trigger an error that gets caught by the error-handling middleware
    throw new Error('This is a test error!');
});
  
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
