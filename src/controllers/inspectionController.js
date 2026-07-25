const supabase = require('../config/supabase');

const createInspection = async (req, res) => {
  try {
    const userId = req.user.uid; // comes from your Firebase auth middleware

    const {
      full_name,
      phone,
      email,
      property_type,
      roof_type,
      roof_access,
      electricity_bill_url,
      electricity_provider,
      preferred_date,
      preferred_time,
      additional_notes,
      info_confirmed,
      terms_agreed
    } = req.body;

    if (!full_name || !phone || !email || !property_type || !roof_type ||
        !roof_access || !preferred_date || !preferred_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!info_confirmed || !terms_agreed) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm the information and agree to terms'
      });
    }

    const { data, error } = await supabase
      .from('inspections')
      .insert([{
        user_id: userId,
        full_name,
        phone,
        email,
        property_type,
        roof_type,
        roof_access,
        electricity_bill_url,
        electricity_provider,
        preferred_date,
        preferred_time,
        additional_notes,
        info_confirmed,
        terms_agreed
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create inspection request'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Inspection request submitted successfully',
      data
    });

  } catch (err) {
    console.error('Unexpected error in createInspection:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

module.exports = { createInspection };