import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Verification from "../models/verification.model.js";
import { sendEmail } from "../utils/sendEmail.utils.js";
import aj from "../utils/arcjet.utils.js";

const registerUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const decision = await aj.protect(req, { email });
    console.log("Arcjet decision", decision);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid email address" }));
      }
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      name,
      password: hashedPassword,
    });

    await newUser.save();

    const verificationToken = jwt.sign(
      { userId: newUser._id, purpose: "emailVerification" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await Verification.create({
      userId: newUser._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailBody = `
      <h1>Welcome to TaskPro</h1>
      <p>Hi ${name},</p>
      <p>Thank you for registering with TaskPro. Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>If you did not create an account, please ignore this email.</p>
    `;
    const emailSubject = "Verify Your Email - TaskPro";

    const isEmailSent = await sendEmail(email, emailSubject, emailBody);

    if (!isEmailSent) {
      return res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
      });
    }

    res.status(201).json({
      message:
        "Verification email sent successfully to your email. Please check and verify your email to continue",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      const existingVerification = await Verification.findOne({
        userId: user._id,
      });

      if (existingVerification && existingVerification.expiresAt > new Date()) {
        return res.status(400).json({
          message:
            "Email not verified. Please check your email for verification link.",
        });
      } else {
        await Verification.findByIdAndDelete(existingVerification._id);

        const VerificationToken = jwt.sign(
          { userId: user._id, purpose: "emailVerification" },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        await Verification.create({
          userId: user._id,
          token: VerificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const emailBody = `
      <h1>Welcome to TaskPro</h1>
      <p>Hi ${name},</p>
      <p>Thank you for registering with TaskPro. Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>If you did not create an account, please ignore this email.</p>
    `;
        const emailSubject = "Verify Your Email - TaskPro";

        const isEmailSent = await sendEmail(email, emailSubject, emailBody);

        if (!isEmailSent) {
          return res.status(500).json({
            message:
              "Failed to send verification email. Please try again later.",
          });
        }

        res.status(201).json({
          message:
            "Verification email sent successfully to your email. Please check and verify your email to continue",
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, purpose: "login" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    await user.save();

    const userData = user.toObject();
    delete userData.password; // Remove password from user data

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { userId, purpose } = payload;
    if (purpose !== "emailVerification") {
      return res.status(400).json({ message: "Invalid token purpose" });
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });
    if (!verification) {
      return res.status(400).json({ message: "Unauthorized user" });
    }

    const isTokenExpired = verification.expiresAt < new Date();
    if (isTokenExpired) {
      return res.status(400).json({ message: "Token has expired" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    user.isEmailVerified = true;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isEmailVerified) {
      return res.status(400).json({
        message:
          "Email not verified. Please verify your email before resetting password.",
      });
    }

    const existingVerification = await Verification.findOne({
      userId: user._id,
    });
    if (existingVerification && existingVerification.expiresAt > new Date()) {
      return res.status(400).json({
        message:
          "A password reset request is already pending. Please check your email.",
      });
    }

    if (existingVerification && existingVerification.expiresAt < new Date()) {
      await Verification.findByIdAndDelete(existingVerification._id);
    }

    const resetPasswordToken = jwt.sign(
      { userId: user._id, purpose: "resetPassword" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    await Verification.create({
      userId: user._id,
      token: resetPasswordToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    const emailBody = `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
    const emailSubject = "Reset Your Password - TaskPro";

    const isEmailSent = await sendEmail(email, emailSubject, emailBody);

    if (!isEmailSent) {
      return res.status(500).json({
        message: "Failed to send password reset email. Please try again later.",
      });
    }

    res.status(200).json({
      message:
        "Password reset email sent successfully. Please check your email to reset your password.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyResetPasswordTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, purpose } = payload;
    if (purpose !== "resetPassword") {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const verification = await Verification.findOne({
      userId,
      token,
    });
    if (!verification) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const isTokenExpired = verification.expiresAt < new Date();
    if (isTokenExpired) {
      return res.status(401).json({
        message: "Token Expired",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(401).json({
        message: "Passwords do not match",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password Reset Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  registerUser,
  loginUser,
  verifyEmail,
  resetPasswordRequest,
  verifyResetPasswordTokenAndResetPassword,
};
