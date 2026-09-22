const { getAuth } = require('firebase-admin/auth');
const supabase = require("../config/supabase");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: No token provided'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);

    req.user = decodedToken;

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


const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
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

      if (!allowedRoles.includes(data.role)) {
        return res.status(403).json({
          error: "Access denied: Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      console.error("Role verification error:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  };
};


const verifyAdmin = requireRole("admin");


module.exports = {
  verifyFirebaseToken,
  requireRole,
  verifyAdmin,
};