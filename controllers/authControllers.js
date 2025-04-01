

const UserModel = require("../models/UserModel");
const bcrypt = require('bcryptjs');
//const { authenticateWithGoogle } = require("../utils/googleAuth");
const { sendToken } = require("../utils/sendtoken");


const registerNormalUser = async (req, res) => {
    try {
        const { name, email, password, type, phoneNumber, countryName, countryCode, dialCode , about} = req.body;
        console.log("Registering normal user:", req.body);

        // Ensure the email is in lowercase for comparison
        const normalizedEmail = email.toLowerCase();
        //console.log("Normalized Email:", normalizedEmail);

        // Check if email is already taken
        const existingUser = await UserModel.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({ status:'400', message: 'Email is already registered' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ status: '400', message: 'Password must be at least 6 characters long' });
        }

        // Phone number slicing logic
        //let phoneNumberSlice = phoneNumber.slice(3); // Removes the country code (first three characters)

        let countryCode1 = "+";  // You might want to append the "+" before the dialCode
        let dialCodeContact = `${countryCode1}${dialCode}`;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new UserModel({
            name,
            email: normalizedEmail,  // Storing normalized email
            password: hashedPassword,
            phone_number: phoneNumber,  // Storing sliced phone number (without country code)
            country_name: countryName,
            country_code: countryCode,
            dial_code: dialCodeContact,
            type: type || 'USER', // Default to 'USER' if not provided
            about: about || 'About me',
        });

        // Save user to the database
        await newUser.save();

        return res.status(201).json({
            status: '201',
            message: 'User registered successfully',
            user: newUser,
        });
    } catch (error) {
        console.error('❌ User Registration Failed:', error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Update User Profile Data

// const updateUserProfile = async (req, res) => {
//     console.log("Updating user profile data:", req.body);
//     try {
//         const { name, email, phone_number, country_name, country_code, dial_code , about} = req.body;
//         const userId = req.user.id; // Assuming the user ID is provided in the URL params

//         //console.log("Updating user data:", req.body);

//         // Ensure the email is in lowercase for comparison
//         const normalizedEmail = email.toLowerCase();
//         console.log("Normalized Email:", normalizedEmail);

//         // Find the user by ID
//         const user = await UserModel.findById(userId);

//         if (!user) {
//             return res.status(404).json({ status: '404', message: 'User not found' });
//         }

//         // Check if the email is being changed and if the new email is already registered
//         if (normalizedEmail !== user.email) {
//             const existingUser = await UserModel.findOne({ email: normalizedEmail });
//             if (existingUser) {
//                 return res.status(400).json({ status: '400', message: 'Email is already registered' });
//             }
//         }

//         // Update the user details
//         user.name = name || user.name;
//         user.about = about || user.about;
//         user.email = normalizedEmail || user.email;
//         user.phone_number = phone_number || user.phone_number;
//         user.country_name = country_name || user.country_name;
//         user.country_code = country_code || user.country_code;
//         user.dial_code = dial_code || user.dial_code;

//         // Save the updated user data
//         await user.save();

//         return res.status(200).json({
//             status: '200',
//             message: 'User profile updated successfully',
//             user: user,
//         });
//     } catch (error) {
//         console.error('❌ User Update Failed:', error.message);
//         return res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

const updateUserProfile = async (req, res) => {
    console.log("Updating user profile data:", req.body);
    try {
        const { name, email, phone_number, country_name, country_code, dial_code, about } = req.body;
        const userId = req.user.id; // Assuming the user ID is provided in the JWT token

        // Check if a file was uploaded and generate file URL if present
        let fileUrl = req.body.profile_image || null;  // Check for existing file in body or multer (upload single)
        if (req.file) {
            fileUrl = `uploads/${req.file.filename}`;  // Set the file URL based on multer upload path
        }

        // Ensure the email is in lowercase for comparison
        const normalizedEmail = email.toLowerCase();
        //console.log("Normalized Email:", normalizedEmail);

        // Find the user by ID
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ status: '404', message: 'User not found' });
        }

        // Check if the email is being changed and if the new email is already registered
        if (normalizedEmail !== user.email) {
            const existingUser = await UserModel.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ status: '400', message: 'Email is already registered' });
            }
        }

        // Update the user details
        user.name = name || user.name;
        user.about = about || user.about;
        user.email = normalizedEmail || user.email;
        user.phone_number = phone_number || user.phone_number;
        user.country_name = country_name || user.country_name;
        user.country_code = country_code || user.country_code;
        user.dial_code = dial_code || user.dial_code;

        // If a new profile image is uploaded, update the profile_image field
        if (fileUrl) {
            user.profile_image = fileUrl;
        }

        // Save the updated user data
        await user.save();

        return res.status(200).json({
            status: '200',
            message: 'User profile updated successfully',
            user: user,
        });
    } catch (error) {
        console.error('❌ User Update Failed:', error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
const loginUserNormal = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find the user by email
        const user = await UserModel.findOne({ email });
        
        
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate and send the JWT token (If JWT is being used)
        const token = sendToken(user);

        // Return only the necessary information (user details without the password)
        const userResponse = {
            _id: user._id,
            email: user.email,
            name: user.name, // Add any other fields you want to send back, except password
            // Avoid returning sensitive fields like 'password', 'salt', etc.
        };

        // Send response with a success message and the token
        return res.status(200).json({
            message: "Login successful",
            user: userResponse,  // Send the sanitized user info
            token: token,         // Send the generated JWT token
        });
    } catch (error) {
        console.error("❌ Login failed:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


/*const registerGoogleUser = async (req, res) => {
    try {
        const { googleId, name, email, image, type } = req.body;
        console.log("Registering user with Google:", req.body);

        // Check if Google ID is already registered
        const existingGoogleUser = await UserModel.findOne({ googleId });

        if (existingGoogleUser) {
            return res.status(400).json({ message: 'Google account is already registered' });
        }

        // Create a new Google user
        const newGoogleUser = new UserModel({
            googleId,
            name,
            email,
            image,
            type: type || 'USER', // Default to 'USER' if not provided
        });

        // Save the Google user to the database
        await newGoogleUser.save();

        return res.status(201).json({
            message: 'User registered with Google successfully',
            user: newGoogleUser,
        });
    } catch (error) {
        console.error('❌ Google User Registration Failed:', error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};*/

/*const googleLogin = async (req, res) => {
   //console.log("Google Login Request:", req.body);
    try {
        const { code } = req.body;
        const result = await authenticateWithGoogle(code);

        if (!result.success) {
            return res.status(500).json({ message: "Google authentication failed", error: result.error });
        }
      
        return res.status(200).json({
            message: "Success",
            user: result.objmaster,
            token: result.token,
        });
    } catch (error) {
        console.error("❌ Google Login Failed:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};*/




const userinfo = async (req, res) => {
    
    try {
        // ✅ Ensure `req.user` is available from authentication middleware
        if (!req.user) {
            return res.status(401).json({ message: "❌ Unauthorized: User not authenticated" });
        }

        const { _id, email } = req.user; // Extract `_id` & `email` from `req.user`

        // ✅ Check if user exists in DB with both `_id` and `email`
        const user = await UserModel.findOne({ _id, email }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "❌ User not found" });
        }

        //console.log("✅ Retrieved User:", user);

        return res.status(200).json({
            message: "✅ User info retrieved successfully",
            user,
        });
    } catch (error) {
        console.error("❌ Error fetching user info:", error.message);
        return res.status(500).json({ message: "❌ Server Error", error: error.message });
    }
};

// Email Notification

const updateUserNotificationSettings = async (req, res) => {
    console.log("Updating user notification settings:", req.body);
    try {
        const { emailNotifications, birthdayNotifications, profileUpdateNotifications } = req.body;
        const userId = req.user.id; // Assuming the user ID is provided in the JWT token

        // Find the user by ID
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ status: '404', message: 'User not found' });
        }

        // Update the notification settings if provided
        if (typeof emailNotifications === 'boolean') {
            user.emailNotifications = emailNotifications;
        }

        if (typeof birthdayNotifications === 'boolean') {
            user.birthdayNotifications = birthdayNotifications;
        }

        if (typeof profileUpdateNotifications === 'boolean') {
            user.profileUpdateNotifications = profileUpdateNotifications;
        }

        // Save the updated user data
        await user.save();

        return res.status(200).json({
            status: '200',
            message: 'User notification settings updated successfully',
            user: user,
        });
    } catch (error) {
        console.error('❌ Notification Update Failed:', error.message);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// For Update New Password

const updatePasswordNewPassword = async (req, res) => {
    try {
      const { newPassword, renewPassword } = req.body;
      //console.log("Updating user password:", req.body);
      const userId = req.user.id; // Assuming the user ID is in the JWT token
      //console.log("Updating user password:", req.body + userId);
      // Validate new password and re-entered password
      if (newPassword !== renewPassword) {
        return res.status(400).json({ status: '400', message: 'Passwords do not match' });
      }
  
      // Check if password is valid (length, etc.)
      if (newPassword.length < 6) {
        return res.status(400).json({ status: '400', message: 'Password must be at least 6 characters' });
      }
  
      // Find user by ID
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ status: '404', message: 'User not found' });
      }
  
      // Hash the new password before saving it
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the password in the database
      user.password = hashedPassword;
  
      // Save the updated user data
      await user.save();
  
      return res.status(200).json({
        status: '200',
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('❌ Password Update Failed:', error.message);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

module.exports = { userinfo , registerNormalUser , loginUserNormal , updateUserProfile , updateUserNotificationSettings, updatePasswordNewPassword};
