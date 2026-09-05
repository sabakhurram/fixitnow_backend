const supabase = require('../config/supabase');

// Get all approved site/service reviews (where product_id IS NULL)
const getSiteReviews = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .is('product_id', null)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, reviews: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all approved product reviews for a specific product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, reviews: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Post a new review (site or product)
const createReview = async (req, res) => {
  try {
    const userId = req.user ? req.user.uid : null;
    const { author_name, author_email, rating, comment, product_id } = req.body;

    if (!author_name || !rating || !comment) {
      return res.status(400).json({ success: false, message: "Missing required fields (author_name, rating, comment)" });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        user_id: userId,
        product_id: product_id || null,
        author_name,
        author_email: author_email || null,
        rating: Number(rating),
        comment,
        is_approved: true // Auto-approved by default
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(201).json({ success: true, review: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Get all reviews (including pending/unapproved)
const getAllReviewsAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, reviews: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Update/Approve a review
const updateReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { author_name, rating, comment, is_approved } = req.body;

    const updates = {};
    if (author_name !== undefined) updates.author_name = author_name;
    if (rating !== undefined) updates.rating = Number(rating);
    if (comment !== undefined) updates.comment = comment;
    if (is_approved !== undefined) updates.is_approved = Boolean(is_approved);
    updates.updated_at = new Date();

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, review: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Delete a review
const deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSiteReviews,
  getProductReviews,
  createReview,
  getAllReviewsAdmin,
  updateReviewAdmin,
  deleteReviewAdmin
};
