const supabase = require('../config/supabase');

// Helper to push a notification safely from anywhere in the backend
const createInternalNotification = async ({
  recipient_id = null,
  is_global = false,
  target_role = 'all',
  title,
  message,
  type = 'info',
  link = null
}) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id,
        is_global,
        target_role,
        title,
        message,
        type,
        link,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.warn("createInternalNotification warn:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("createInternalNotification failed:", err.message);
    return null;
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Fetch user's role to match global role-targeted alerts
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', uid)
      .maybeSingle();

    const userRole = userData?.role || 'user';

    // Fetch personal notifications + global notifications matching role
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`recipient_id.eq.${uid},and(is_global.eq.true,target_role.in.('all','${userRole}'))`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table might not exist yet if migration isn't run
      console.warn("getNotifications error:", error.message);
      return res.status(200).json({ success: true, notifications: [] });
    }

    return res.status(200).json({
      success: true,
      notifications: data || []
    });
  } catch (err) {
    console.error("getNotifications controller error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/:id/read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, notification: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/mark-all-read
const markAllAsRead = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', uid);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/notifications/broadcast (Admin only)
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type = 'info', target_role = 'all', link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required." });
    }

    const created = await createInternalNotification({
      is_global: true,
      target_role,
      title,
      message,
      type,
      link
    });

    return res.status(201).json({
      success: true,
      message: "Broadcast notification published successfully.",
      notification: created
    });
  } catch (err) {
    console.error("broadcastNotification error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createInternalNotification,
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  broadcastNotification
};
