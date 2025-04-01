const  mongoose = require('mongoose');
// const DB_URL = process.env.DB_URL;

// mongoose.connect(DB_URL).then(() => {
//     console.log("Database connected");
//   }).catch((err) => {
//     console.log(err);
//   });

// module.exports = mongoose


const DB_URL = process.env.NODE_ENV === 'prod' ? process.env.DB_URL : process.env.DB_URL_LOCAL;


if (!DB_URL) {
  console.error("Error: DB_URL is not defined. Please check your environment variables.");
}

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 50000,  // Increased timeout for server selection
  socketTimeoutMS: 45000,          // Increased socket timeout
})
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message || err);
  });

module.exports = mongoose;