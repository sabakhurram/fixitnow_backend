const supabase = require('../config/supabase');
const {
  sendCustomerReminderEmail,
  sendTechnicianAssignmentEmail
} = require('../services/emailService');
const { createInternalNotification } = require('./notificationController');

// Map a raw service row from Supabase into a unified service object
const mapServiceRow = (row, type) => {
  let title = "Solar Service";
  let prefix = "SRV";
  let urgency = "Normal";

  if (type === 'inspection') {
    title = `Solar Inspection (${row.property_type || "System"})`;
    prefix = "INS";
    urgency = "Standard";
  } else if (type === 'repair') {
    title = `Solar Repair - ${row.issue_category || "Diagnostic"}`;
    prefix = "REP";
    urgency = row.urgency || "Medium";
  } else if (type === 'amc') {
    title = `AMC Service - ${row.plan || "Annual"} Plan`;
    prefix = "AMC";
    urgency = "Scheduled";
  }

  const shortId = row.id ? String(row.id).slice(0, 6).toUpperCase() : "000000";

  return {
    id: row.id,
    ticketNumber: `#${prefix}-${shortId}`,
    serviceType: type,
    title,
    customerName: row.full_name || "Valued Customer",
    customerEmail: row.email || "",
    customerPhone: row.phone || "",
    address: row.street_address || row.address || row.service_address || "",
    city: row.city || "",
    propertyType: row.property_type || row.installation_type || "",
    preferredDate: row.preferred_date || row.contract_start_date || row.created_at,
    preferredTime: row.preferred_time || "",
    urgency,
    status: (row.status || "assigned").toLowerCase(),
    additionalNotes: row.additional_notes || row.problem_description || "",
    resolutionNotes: row.resolution_notes || "",
    partsUsed: row.parts_used || "",
    userId: row.user_id || null,
    technicianId: row.technician_id || null,
    completedAt: row.completed_at || null,
    createdAt: row.created_at || new Date().toISOString()
  };
};

// GET /api/technician/assigned-services
const getAssignedServices = async (req, res) => {
  try {
    const techId = req.user.uid;
    const { type = 'all', status = 'all', urgency = 'all', sortBy = 'date', order = 'asc', search = '' } = req.query;

    const queries = [];

    if (type === 'all' || type === 'inspection' || type === 'inspections') {
      queries.push(
        supabase.from('inspections').select('*').eq('technician_id', techId)
          .then(res => (res.data || []).map(r => mapServiceRow(r, 'inspection')))
      );
    }
    if (type === 'all' || type === 'repair' || type === 'repairs') {
      queries.push(
        supabase.from('repairs').select('*').eq('technician_id', techId)
          .then(res => (res.data || []).map(r => mapServiceRow(r, 'repair')))
      );
    }
    if (type === 'all' || type === 'amc' || type === 'amc_contracts') {
      queries.push(
        supabase.from('amc_contracts').select('*').eq('technician_id', techId)
          .then(res => (res.data || []).map(r => mapServiceRow(r, 'amc')))
      );
    }

    const results = await Promise.all(queries);
    let allServices = results.flat();

    // 1. Filter by Status
    if (status !== 'all') {
      const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
      allServices = allServices.filter(s => {
        const sStatus = s.status.toLowerCase().replace(/\s+/g, '_');
        return sStatus === normalizedStatus;
      });
    }

    // 2. Filter by Urgency
    if (urgency !== 'all') {
      allServices = allServices.filter(s => s.urgency.toLowerCase() === urgency.toLowerCase());
    }

    // 3. Search Filter
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      allServices = allServices.filter(s =>
        s.customerName.toLowerCase().includes(query) ||
        s.customerPhone.toLowerCase().includes(query) ||
        s.customerEmail.toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query) ||
        s.city.toLowerCase().includes(query) ||
        s.ticketNumber.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query)
      );
    }

    // 4. Sorting
    allServices.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date' || sortBy === 'preferredDate') {
        const dateA = new Date(a.preferredDate || a.createdAt).getTime();
        const dateB = new Date(b.preferredDate || b.createdAt).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'urgency') {
        const weight = { urgent: 3, high: 3, medium: 2, normal: 1, standard: 1, scheduled: 1 };
        const wA = weight[a.urgency.toLowerCase()] || 1;
        const wB = weight[b.urgency.toLowerCase()] || 1;
        comparison = wB - wA;
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else {
        // Default created_at
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return order === 'desc' ? -comparison : comparison;
    });

    return res.status(200).json({
      success: true,
      count: allServices.length,
      services: allServices
    });
  } catch (err) {
    console.error("getAssignedServices error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/technician/services/:type/:id/status
const updateAssignedServiceStatus = async (req, res) => {
  try {
    const techId = req.user.uid;
    let { type, id } = req.params;
    const { status, resolution_notes, parts_used } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    let tableName = 'inspections';
    if (type.includes('repair')) tableName = 'repairs';
    else if (type.includes('amc')) tableName = 'amc_contracts';

    const normalizedStatus = status.toLowerCase().trim().replace(/\s+/g, '_');

    const updatePayload = {
      status: normalizedStatus
    };

    if (resolution_notes !== undefined) updatePayload.resolution_notes = resolution_notes;
    if (parts_used !== undefined) updatePayload.parts_used = parts_used;
    if (normalizedStatus === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    // Verify technician owns the ticket
    const { data: existing, error: findError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ success: false, message: "Service ticket not found." });
    }

    // Allow assignment updates if technician owns it or user is admin
    if (existing.technician_id && existing.technician_id !== techId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized: You are not assigned to this service." });
    }

    const { data: updated, error: updateError } = await supabase
      .from(tableName)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    // Notify customer about status transition
    if (existing.user_id) {
      await createInternalNotification({
        recipient_id: existing.user_id,
        is_global: false,
        title: `Service Status Updated to ${status.toUpperCase()}`,
        message: `Your solar ${type} ticket status has been marked as "${status}" by the technician.`,
        type: 'status_change',
        link: '/dashboard'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Service status updated to ${status}.`,
      service: mapServiceRow(updated, type)
    });
  } catch (err) {
    console.error("updateAssignedServiceStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/technician/customers (Technician's own customer directory)
const getTechnicianCustomers = async (req, res) => {
  try {
    const techId = req.user.uid;

    const [insRes, repRes, amcRes] = await Promise.all([
      supabase.from('inspections').select('*').eq('technician_id', techId),
      supabase.from('repairs').select('*').eq('technician_id', techId),
      supabase.from('amc_contracts').select('*').eq('technician_id', techId)
    ]);

    const allTickets = [
      ...(insRes.data || []).map(r => mapServiceRow(r, 'inspection')),
      ...(repRes.data || []).map(r => mapServiceRow(r, 'repair')),
      ...(amcRes.data || []).map(r => mapServiceRow(r, 'amc'))
    ];

    // Group services by customer email or user_id
    const customerMap = {};

    for (const ticket of allTickets) {
      const key = ticket.customerEmail || ticket.userId || ticket.customerName;
      if (!customerMap[key]) {
        customerMap[key] = {
          customerId: ticket.userId || key,
          name: ticket.customerName,
          email: ticket.customerEmail,
          phone: ticket.customerPhone,
          address: ticket.address,
          city: ticket.city,
          propertyType: ticket.propertyType,
          totalServices: 0,
          activeServices: 0,
          completedServices: 0,
          lastServiceDate: ticket.preferredDate,
          services: []
        };
      }

      customerMap[key].totalServices += 1;
      if (ticket.status === 'completed') {
        customerMap[key].completedServices += 1;
      } else if (ticket.status !== 'cancelled') {
        customerMap[key].activeServices += 1;
      }

      customerMap[key].services.push({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        serviceType: ticket.serviceType,
        title: ticket.title,
        status: ticket.status,
        date: ticket.preferredDate,
        time: ticket.preferredTime,
        notes: ticket.additionalNotes
      });
    }

    const customersList = Object.values(customerMap);

    return res.status(200).json({
      success: true,
      count: customersList.length,
      customers: customersList
    });
  } catch (err) {
    console.error("getTechnicianCustomers error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/technician/reminders/send (Dispatches email via Brevo + logs)
const sendServiceReminder = async (req, res) => {
  try {
    const techId = req.user.uid;
    const {
      customer_id,
      customer_email,
      customer_name,
      service_id,
      service_type = 'inspection',
      reminder_type = 'Upcoming Visit Reminder',
      custom_message = '',
      scheduled_date = '',
      scheduled_time = '',
      service_title = ''
    } = req.body;

    if (!customer_email) {
      return res.status(400).json({ success: false, message: "Customer email is required." });
    }

    // Fetch technician's display name
    const { data: techData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', techId)
      .maybeSingle();

    const technicianName = techData?.display_name || "FixItNow Technical Team";

    // 1. Send transactional email through Brevo
    let emailSent = false;
    let emailWarning = null;

    try {
      await sendCustomerReminderEmail({
        email: customer_email,
        customerName: customer_name,
        technicianName,
        reminderType: reminder_type,
        customMessage: custom_message,
        scheduledDate: scheduled_date,
        scheduledTime: scheduled_time,
        serviceTitle: service_title
      });
      emailSent = true;
    } catch (emailErr) {
      console.warn("Brevo email dispatch warning:", emailErr.message);
      emailWarning = emailErr.message;
    }

    // 2. Log in service_reminders table (defensive if table is not yet created)
    try {
      await supabase.from('service_reminders').insert([{
        technician_id: techId,
        customer_id: customer_id || techId,
        customer_email,
        customer_name,
        service_id,
        service_type,
        reminder_type,
        custom_message,
        status: emailSent ? 'Sent' : 'Logged (Brevo IP Unauthorised)'
      }]);
    } catch (logErr) {
      console.warn("Reminder logging skipped:", logErr.message);
    }

    // 3. Create in-app notification if customer_id is a registered UID
    if (customer_id) {
      await createInternalNotification({
        recipient_id: customer_id,
        is_global: false,
        title: reminder_type,
        message: custom_message || `You have a scheduled service visit on ${scheduled_date || 'soon'}.`,
        type: 'info',
        link: '/dashboard'
      });
    }

    if (!emailSent) {
      return res.status(200).json({
        success: true,
        warning: true,
        message: `Reminder recorded and in-app notification created! (Live email blocked by Brevo IP security: Authorize IP ${req.ip || 'in Brevo'} at https://app.brevo.com/security/authorised_ips).`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Reminder email successfully dispatched to ${customer_email}.`
    });
  } catch (err) {
    console.error("sendServiceReminder error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/technician/dashboard-stats
const getTechnicianDashboardStats = async (req, res) => {
  try {
    const techId = req.user.uid;

    const [insRes, repRes, amcRes, revRes] = await Promise.all([
      supabase.from('inspections').select('id, status, preferred_date, completed_at, created_at, full_name').eq('technician_id', techId),
      supabase.from('repairs').select('id, status, preferred_time, completed_at, created_at, full_name').eq('technician_id', techId),
      supabase.from('amc_contracts').select('id, status, contract_start_date, completed_at, created_at, full_name').eq('technician_id', techId),
      supabase.from('technician_reviews').select('rating').eq('technician_id', techId)
    ]);

    const all = [
      ...(insRes.data || []).map(r => ({ ...r, type: 'inspection' })),
      ...(repRes.data || []).map(r => ({ ...r, type: 'repair' })),
      ...(amcRes.data || []).map(r => ({ ...r, type: 'amc' }))
    ];

    const totalAssigned = all.length;
    const completed = all.filter(r => (r.status || '').toLowerCase() === 'completed').length;
    const inProgress = all.filter(r => (r.status || '').toLowerCase() === 'in_progress').length;
    const pending = all.filter(r => (r.status || '').toLowerCase() === 'assigned' || (r.status || '').toLowerCase() === 'pending').length;
    const activeJobs = inProgress + pending;

    const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 100;

    // Calculate rating
    const reviews = revRes.data || [];
    let avgRating = 5.0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
      avgRating = Number((sum / reviews.length).toFixed(1));
    }

    // Recent completed history
    const history = all
      .filter(r => (r.status || '').toLowerCase() === 'completed')
      .sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at))
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        activeJobs,
        completedJobs: completed,
        pendingJobs: pending,
        inProgressJobs: inProgress,
        completionRate,
        averageRating: avgRating,
        totalReviews: reviews.length,
        recentHistory: history
      }
    });
  } catch (err) {
    console.error("getTechnicianDashboardStats error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/technician/my-reviews (Customer feedback left for this technician)
const getTechnicianReviews = async (req, res) => {
  try {
    const techId = req.user.uid;

    const { data, error } = await supabase
      .from('technician_reviews')
      .select('*')
      .eq('technician_id', techId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("getTechnicianReviews table not ready:", error.message);
      return res.status(200).json({ success: true, reviews: [], averageRating: 5.0, count: 0 });
    }

    const reviews = data || [];
    let avg = 5.0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
      avg = Number((sum / reviews.length).toFixed(1));
    }

    return res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: avg,
      reviews
    });
  } catch (err) {
    console.error("getTechnicianReviews error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/services/:type/:id/assign (Admin assigns technician)
const assignTechnicianToService = async (req, res) => {
  try {
    let { type, id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id) {
      return res.status(400).json({ success: false, message: "Technician ID is required." });
    }

    let tableName = 'inspections';
    if (type.includes('repair')) tableName = 'repairs';
    else if (type.includes('amc')) tableName = 'amc_contracts';

    // 1. Fetch technician profile details
    const { data: techUser, error: techError } = await supabase
      .from('users')
      .select('id, display_name, email')
      .eq('id', technician_id)
      .single();

    if (techError || !techUser) {
      return res.status(404).json({ success: false, message: "Technician profile not found." });
    }

    // 2. Assign technician to ticket in Supabase
    const { data: updatedService, error: updateError } = await supabase
      .from(tableName)
      .update({
        technician_id: technician_id,
        status: 'assigned'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    const mapped = mapServiceRow(updatedService, type);

    // 3. Notify technician via in-app notification
    await createInternalNotification({
      recipient_id: technician_id,
      is_global: false,
      target_role: 'technician',
      title: "New Service Assigned",
      message: `You have been assigned to ${mapped.title} for ${mapped.customerName}.`,
      type: 'assignment',
      link: '/technician/dashboard'
    });

    // 4. Notify customer via in-app notification
    if (mapped.userId) {
      await createInternalNotification({
        recipient_id: mapped.userId,
        is_global: false,
        title: "Technician Assigned to Your Service",
        message: `${techUser.display_name} has been assigned to your ${type} request.`,
        type: 'info',
        link: '/dashboard'
      });
    }

    // 5. Send email notification to technician via Brevo
    try {
      await sendTechnicianAssignmentEmail({
        email: techUser.email,
        technicianName: techUser.display_name,
        customerName: mapped.customerName,
        serviceType: type,
        serviceAddress: mapped.address + (mapped.city ? `, ${mapped.city}` : ''),
        scheduledDate: mapped.preferredDate,
        scheduledTime: mapped.preferredTime
      });
    } catch (e) {
      console.warn("Assignment email warning:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Service successfully assigned to ${techUser.display_name}.`,
      service: mapped,
      technician: techUser
    });
  } catch (err) {
    console.error("assignTechnicianToService error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAssignedServices,
  updateAssignedServiceStatus,
  getTechnicianCustomers,
  sendServiceReminder,
  getTechnicianDashboardStats,
  getTechnicianReviews,
  assignTechnicianToService
};
