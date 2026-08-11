const supabase = require('../config/supabase');

const createRepair = async (req, res) => {
    console.log("BODY:", req.body);
  console.log("FILES:", req.files);
  try {
    const userId = req.user.uid;

    const {
      full_name,
      phone,
      email,
      installation_type,
      system_size,
      issue_category,
      problem_description,
      problem_started,
      system_status,
      inverter_brand,
      inverter_error_code,
      battery_installed,
      battery_brand,
      battery_issue_description,
      photo_urls,
      video_url,
      address,
      city,
      preferred_time,
      additional_notes,
      info_confirmed,
      charges_may_apply_agreed
    } = req.body;

    // Required fields
    if (!full_name || !phone || !email || !issue_category ||
        !problem_description || !address || !preferred_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!info_confirmed || !charges_may_apply_agreed) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm the information and agree to the terms'
      });
    }
    const photoUrls = req.files?.images
  ? req.files.images.map(file => file.path)
  : null;


const videoUrl = req.files?.video
  ? req.files.video[0].path
  : null;

    // Conditional validation: if battery_installed is true, require battery details
    if (battery_installed === true && (!battery_brand || !battery_issue_description)) {
      return res.status(400).json({
        success: false,
        message: 'Battery brand and issue description are required when battery is installed'
      });
    }

    const { data, error } = await supabase
      .from('repairs')
      .insert([{
        user_id: userId,
        full_name,
        phone,
        email,
        installation_type,
        system_size,
        issue_category,
        problem_description,
        problem_started,
        system_status,
        inverter_brand,
        inverter_error_code,
        battery_installed,
        battery_brand: battery_installed ? battery_brand : null,
        battery_issue_description: battery_installed ? battery_issue_description : null,
        photo_urls: photoUrls,
        video_url: videoUrl,
    
        address,
        city,
        preferred_time,
        additional_notes,
        info_confirmed,
        charges_may_apply_agreed
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create repair request'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Repair request submitted successfully',
      data
    });

  } catch (err) {
    console.error('Unexpected error in createRepair:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
  console.log(req.files);
};
const getRepairs = async (req,res)=>{

  try {

    const userId = req.user.uid;


    const { data, error } = await supabase
      .from("repairs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending:false
      });


    if(error){

      return res.status(500).json({
        success:false,
        message:error.message
      });

    }


    return res.status(200).json({
      success:true,
      data:data
    });


  } catch(error){

    console.log(error);

    return res.status(500).json({
      success:false,
      message:"Server error"
    });

  }

};
const getAllRepairs = async (req, res) => {
    try {

        const { data, error } = await supabase
            .from("repairs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Supabase getAllRepairs error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch repair requests"
            });
        }

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "getAllRepairs controller error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
module.exports = {
 createRepair,
 getRepairs,
 getAllRepairs
};