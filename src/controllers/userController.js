const supabase = require('../config/supabase');
const admin = require('../config/firebase');
const { getAuth } = require('firebase-admin/auth');
const { sendWelcomeEmail } = require('../services/emailService');
const syncUser = async (req, res) => {
  const { uid, email, name } = req.user;

  try {
    // Check if the user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (findError) {
      console.error('Supabase user lookup error:', findError);

      return res.status(500).json({
        error: 'Database lookup failure',
        details: findError.message
      });
    }

    // Existing user → don't create again and don't send welcome email
    if (existingUser) {
      return res.status(200).json({
        message: 'User already exists',
        user: existingUser
      });
    }

    // New user → create account
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: uid,
        email: email,
        display_name: name || null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase syncUser database error:', error);

      return res.status(500).json({
        error: 'Database sync failure',
        details: error.message
      });
    }

    // Send welcome email only for a newly created user
    try {
      await sendWelcomeEmail({
        email: data.email,
        name: data.display_name
      });

      console.log('Welcome email sent to:', data.email);
    } catch (emailError) {
      // Email failure should not prevent account creation
      console.error(
        'Welcome email failed:',
        emailError.message
      );
    }

    return res.status(201).json({
      message: 'User created and synced successfully',
      user: data
    });

  } catch (err) {
    console.error('syncUser controller error:', err);

    return res.status(500).json({
      error: 'Internal server error during sync'
    });
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
const getAllTechnicians = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, role, created_at')
      .eq('role', 'technician')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAllTechnicians database error:', error);

      return res.status(500).json({
        error: 'Failed to fetch technicians',
        details: error.message
      });
    }

    return res.status(200).json({
      technicians: data
    });

  } catch (err) {
    console.error('getAllTechnicians controller error:', err);

    return res.status(500).json({
      error: 'Internal server error while fetching technicians'
    });
  }
};
const createTechnician = async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    // Validate required fields
    if (!email || !password || !display_name) {
      return res.status(400).json({
        error: 'Email, password, and display name are required'
      });
    }

    // Create Firebase authentication account
   const firebaseUser = await getAuth().createUser({
      email,
      password,
      displayName: display_name
    });

    // Create corresponding Supabase user record
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: firebaseUser.uid,
        email: email,
        display_name: display_name,
        role: 'technician'
      })
      .select('id, email, display_name, role, created_at')
      .single();

    if (error) {
      console.error('Technician database insert error:', error);

      // Roll back Firebase account if Supabase insert fails
      try {
     await getAuth().deleteUser(firebaseUser.uid);
      } catch (deleteError) {
        console.error(
          'Failed to rollback Firebase technician account:',
          deleteError.message
        );
      }

      return res.status(500).json({
        error: 'Failed to create technician profile',
        details: error.message
      });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: data.email,
        name: data.display_name
      });

      console.log('Technician welcome email sent to:', data.email);

    } catch (emailError) {
      // Email failure should not undo account creation
      console.error(
        'Technician welcome email failed:',
        emailError.message
      );
    }

    return res.status(201).json({
      message: 'Technician created successfully',
      technician: data
    });

  } catch (err) {
    console.error('createTechnician controller error:', err);

    // Firebase validation errors
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({
        error: 'A Firebase account with this email already exists'
      });
    }

    if (err.code === 'auth/invalid-email') {
      return res.status(400).json({
        error: 'Invalid email address'
      });
    }

    if (err.code === 'auth/weak-password') {
      return res.status(400).json({
        error: 'Password is too weak'
      });
    }

    return res.status(500).json({
      error: 'Internal server error while creating technician'
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
  getCustomerActivityDetails,
    getAllTechnicians,
  createTechnician
};
