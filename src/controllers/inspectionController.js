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
      electricity_provider,
      preferred_date,
      preferred_time,
      additional_notes,
      info_confirmed,
      terms_agreed
    } = req.body;
const electricityBillUrl = req.file ? req.file.path : null;
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
        electricity_bill_url: electricityBillUrl,
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
const getInspections = async(req,res)=>{

try{

const userId = req.user.uid;


const {data,error}=await supabase
.from("inspections")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false});


if(error){
 return res.status(500).json({
  success:false,
  message:error.message
 });
}


res.status(200).json({
 success:true,
 data
});


}
catch(error){

res.status(500).json({
 success:false,
 message:error.message
});

}

};
const getAllInspections = async (req, res) => {
    try {

        const { data, error } = await supabase
            .from("inspections")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Supabase getAllInspections error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch inspection requests"
            });
        }

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "getAllInspections controller error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
module.exports={
 createInspection,
 getInspections,
     getAllInspections

}