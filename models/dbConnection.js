const  mongoose = require('mongoose');
// const DB_URL = process.env.DB_URL;

// mongoose.connect(DB_URL).then(() => {
//     console.log("Database connected");
//   }).catch((err) => {
//     console.log(err);
//   });

// module.exports = mongoose


const DB_URL = process.env.NODE_ENV === 'prod' ? process.env.DB_URL : process.env.DB_URL;

mongoose.connect(DB_URL)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

module.exports = mongoose;