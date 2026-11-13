const supabase = require('../config/supabase');
const { createInternalNotification } = require('./notificationController');

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

// Customer: Submit a review/rating for an assigned technician
const createTechnicianReview = async (req, res) => {
  try {
    const customerId = req.user ? req.user.uid : null;
    const {
      technician_id,
      service_type = 'inspection',
      service_id,
      rating,
      review_text,
      author_name
    } = req.body;

    if (!technician_id || !rating) {
      return res.status(400).json({ success: false, message: "Technician ID and rating are required." });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const { data, error } = await supabase
      .from('technician_reviews')
      .insert([{
        customer_id: customerId,
        technician_id,
        service_type,
        service_id,
        rating: numericRating,
        review_text: review_text || "",
        author_name: author_name || req.user?.name || "Customer"
      }])
      .select()
      .single();

    if (error) {
      console.error("createTechnicianReview error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }

    // Alert technician of new feedback
    await createInternalNotification({
      recipient_id: technician_id,
      is_global: false,
      target_role: 'technician',
      title: `New Customer Review (${numericRating} ★)`,
      message: `A customer has submitted a ${numericRating}-star review for your ${service_type} service.`,
      type: 'info',
      link: '/technician/dashboard'
    });

    return res.status(201).json({
      success: true,
      message: "Technician review submitted successfully.",
      review: data
    });
  } catch (err) {
    console.error("createTechnicianReview error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: View all technician reviews
const getAllTechnicianReviewsAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('technician_reviews')
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

module.exports = {
  getSiteReviews,
  getProductReviews,
  createReview,
  getAllReviewsAdmin,
  updateReviewAdmin,
  deleteReviewAdmin,
  createTechnicianReview,
  getAllTechnicianReviewsAdmin
};
