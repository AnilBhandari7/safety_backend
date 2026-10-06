const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) => {
  const payload = { userId: user._id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const signup = async ({ name, email, phone, password }) => {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new Error("Email already in use");

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) throw new Error("Phone number already in use");

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({ name, email, phone, passwordHash, role: "employee" });
  await user.save();

  // Return token + sanitised user (toJSON strips passwordHash)
  const token = signToken(user);
  return { token, user: user.toJSON() };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Invalid email or password");

  const token = signToken(user);
  return { token, user: user.toJSON() };
};

module.exports = { signup, login };
