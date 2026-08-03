const { getAuth } = require('firebase-admin/auth');
const supabase = require("../config/supabase");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken; // Contains uid, email, name, picture etc.
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    return res.status(403).json({
      error: 'Forbidden: Invalid or expired token',
      details: error.message,
      code: error.code
    });
  }
};
const verifyAdmin = async (req, res, next) => {
  try {
    const uid = req.user.uid;

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (error || !data) {
      return res.status(403).json({
        error: "Access denied: User not found",
      });
    }

    if (data.role !== "admin") {
      return res.status(403).json({
        error: "Access denied: Admin privileges required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin verification error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  verifyFirebaseToken,
  verifyAdmin,
};
