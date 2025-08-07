import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes (requires valid token)
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("❌ No token provided in request headers");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user to req.user without password
    req.user = await User.findById(decoded.id || decoded.userId).select("-password");

    if (!req.user) {
      console.warn("❌ Token decoded, but user not found in DB");
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    console.log(`🔐 Authenticated user: ${req.user.email}`);
    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    return res.status(401).json({ error: "Token is invalid or expired" });
  }
};

// Optional middleware to restrict to admins only
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.warn(`🚫 Admin Access Denied for: ${req.user?.email || "Unknown user"}`);
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }

  console.log(`✅ Admin Access Granted: ${req.user.email}`);
  next();
};
