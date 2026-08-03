const supabase = require('../config/supabase');

const syncUser = async (req, res) => {
  const { uid, email, name } = req.user;

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: uid,
        email: email,
        display_name: name || null,
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase syncUser database error:', error);
      return res.status(500).json({ error: 'Database sync failure', details: error.message });
    }

    return res.status(200).json({
      message: 'User synced successfully',
      user: data
    });
  } catch (err) {
    console.error('syncUser controller error:', err);
    return res.status(500).json({ error: 'Internal server error during sync' });
  }
};

const getUserProfile = async (req, res) => {
  const { uid } = req.user;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return res.status(404).json({ error: 'User profile not found. Please sync first.' });
      }
      console.error('Supabase getUserProfile database error:', error);
      return res.status(500).json({ error: 'Database fetch failure', details: error.message });
    }

    return res.status(200).json({ user: data });
  } catch (err) {
    console.error('getUserProfile controller error:', err);
    return res.status(500).json({ error: 'Internal server error during profile retrieval' });
  }
};

const checkAdminStatus = async (req, res) => {
  try {

    const uid = req.user.uid;

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

console.log("Firebase UID:", uid);
console.log("Database user:", data);
    if (error) {
      return res.status(500).json({
        message: error.message
      });
    }


    if (data.role === "admin") {

      return res.json({
        isAdmin: true
      });

    }


    return res.json({
      isAdmin: false
    });


  } catch(error) {

    return res.status(500).json({
      message: error.message
    });

  }
};

module.exports = {
  syncUser,
  getUserProfile,
  checkAdminStatus
};
