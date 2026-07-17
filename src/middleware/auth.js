const { getAuth } = require('firebase-admin/auth');

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

module.exports = { verifyFirebaseToken };
