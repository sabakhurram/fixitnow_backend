const supabase = require('../config/supabase');

const createAmcContract = async (req, res) => {
  try {
    const userId = req.user.uid;

    const {
      full_name,
      phone,
      email,
      installation_type,
      system_size,
      plan,
      contract_duration,
      contract_start_date,
      service_address,
      city,
      preferred_day,
      preferred_time,
      additional_notes,
      info_confirmed,
      terms_agreed,
      charges_understood
    } = req.body;

    // Required fields
    if (!full_name || !phone || !email || !plan || !contract_duration ||
        !contract_start_date || !service_address || !city ||
        !preferred_day || !preferred_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!info_confirmed || !terms_agreed || !charges_understood) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm the information and agree to all terms'
      });
    }

    const { data, error } = await supabase
      .from('amc_contracts')
      .insert([{
        user_id: userId,
        full_name,
        phone,
        email,
        installation_type,
        system_size,
        plan,
        contract_duration,
        contract_start_date,
        service_address,
        city,
        preferred_day,
        preferred_time,
        additional_notes,
        info_confirmed,
        terms_agreed,
        charges_understood
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create AMC contract'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'AMC contract submitted successfully',
      data
    });

  } catch (err) {
    console.error('Unexpected error in createAmcContract:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};
const getAMCs = async(req,res)=>{

try{

const userId = req.user.uid;


const {data,error}=await supabase
.from("amc_contracts")
.select("*")
.eq("user_id",userId)
.order("created_at",{ascending:false});


if(error){

return res.status(500).json({
 success:false,
 message:error.message
});

}


return res.status(200).json({
 success:true,
 data
});


}
catch(error){

return res.status(500).json({
 success:false,
 message:error.message
});

}

};
module.exports={
 createAmcContract,
 getAMCs
}