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
const getAllCustomers = async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'user')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('getAllCustomers database error:', error);

            return res.status(500).json({
                error: 'Failed to fetch customers',
                details: error.message
            });
        }

        return res.status(200).json({
            customers: data
        });

    } catch (err) {

        console.error('getAllCustomers controller error:', err);

        return res.status(500).json({
            error: 'Internal server error while fetching customers'
        });

    }
};

const getCustomerActivityDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
    const userEmail = user?.email || "";

    let [repairsRes, inspectionsRes, amcRes, ordersRes] = await Promise.all([
      supabase.from('repairs').select('*').eq('user_id', id),
      supabase.from('inspections').select('*').eq('user_id', id),
      supabase.from('amc_contracts').select('*').eq('user_id', id),
      supabase.from('orders').select('*').eq('user_id', id)
    ]);

    let repairs = repairsRes.data || [];
    let inspections = inspectionsRes.data || [];
    let amc = amcRes.data || [];
    let orders = ordersRes.data || [];

    if (userEmail) {
      if (repairs.length === 0) {
        const { data } = await supabase.from('repairs').select('*').eq('email', userEmail);
        if (data && data.length > 0) repairs = data;
      }
      if (inspections.length === 0) {
        const { data } = await supabase.from('inspections').select('*').eq('email', userEmail);
        if (data && data.length > 0) inspections = data;
      }
      if (amc.length === 0) {
        const { data } = await supabase.from('amc_contracts').select('*').eq('email', userEmail);
        if (data && data.length > 0) amc = data;
      }
      if (orders.length === 0) {
        const { data } = await supabase.from('orders').select('*').eq('email', userEmail);
        if (data && data.length > 0) orders = data;
      }
    }

    return res.status(200).json({
      success: true,
      repairs,
      inspections,
      amc,
      orders
    });
  } catch (err) {
    console.error("getCustomerActivityDetails error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  syncUser,
  getUserProfile,
  checkAdminStatus,
  getAllCustomers,
  getCustomerActivityDetails
};
