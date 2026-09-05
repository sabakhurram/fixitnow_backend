const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, verifyAdmin } = require('../middleware/auth');
const {
  getSiteReviews,
  getProductReviews,
  createReview,
  getAllReviewsAdmin,
  updateReviewAdmin,
  deleteReviewAdmin
} = require('../controllers/reviewController');

// Public routes
router.get('/site', getSiteReviews);
router.get('/product/:productId', getProductReviews);

// Submission route (optional auth - verifies if token sent)
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return verifyFirebaseToken(req, res, next);
  }
  next();
}, createReview);

// Admin management routes
router.get('/admin', verifyFirebaseToken, verifyAdmin, getAllReviewsAdmin);
router.put('/admin/:id', verifyFirebaseToken, verifyAdmin, updateReviewAdmin);
router.delete('/admin/:id', verifyFirebaseToken, verifyAdmin, deleteReviewAdmin);

module.exports = router;
