const supabase = require("../config/supabase");

// Place a new product order
const createOrder = async (req, res) => {
    try {
        const {
            email,
            shippingName,
            shippingAddress,
            phone,
            paymentMethod,
            items,
            totalAmount
        } = req.body;

        const userId = req.user.uid;

        if (!email || !shippingName || !shippingAddress || !phone || !items || !items.length || !totalAmount) {
            return res.status(400).json({ error: "Missing required shipping or items fields." });
        }

        // 1. Verify stock and calculate verified totals
        for (const item of items) {
            const { data: product, error: prodErr } = await supabase
                .from("products")
                .select("*")
                .eq("id", item.id)
                .single();

            if (prodErr || !product) {
                return res.status(404).json({ error: `Product with ID ${item.id} not found.` });
            }

            if (Number(product.stock) < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${item.quantity}.`
                });
            }
        }

        // 2. Deduct stock from the database
        for (const item of items) {
            const { data: product } = await supabase
                .from("products")
                .select("stock")
                .eq("id", item.id)
                .single();

            const newStock = Number(product.stock) - item.quantity;

            await supabase
                .from("products")
                .update({ stock: newStock })
                .eq("id", item.id);
        }

        // 3. Create the order record in database
        const { data: order, error: orderErr } = await supabase
            .from("orders")
            .insert({
                user_id: userId,
                email,
                shipping_name: shippingName,
                shipping_address: shippingAddress,
                phone,
                payment_method: paymentMethod || "Cash on Delivery",
                total_amount: totalAmount,
                status: "Pending",
                items: items // Storing full items description array in JSONB
            })
            .select()
            .single();

        if (orderErr) {
            console.error("Supabase createOrder database error:", orderErr);
            return res.status(500).json({
                error: "Failed to save order in the database.",
                details: orderErr.message
            });
        }

        return res.status(201).json({
            message: "Order placed successfully.",
            order
        });

    } catch (error) {
        console.error("createOrder controller error:", error);
        return res.status(500).json({ error: "Internal server error while creating order." });
    }
};

// Retrieve orders for the authenticated user
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.uid;

        const { data: orders, error } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase getUserOrders database error:", error);
            return res.status(500).json({ error: "Database error fetching user orders." });
        }

        return res.status(200).json({ orders });

    } catch (error) {
        console.error("getUserOrders controller error:", error);
        return res.status(500).json({ error: "Internal server error fetching orders." });
    }
};

// Admin: Retrieve all orders
const getAdminOrders = async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase getAdminOrders database error:", error);
            return res.status(500).json({ error: "Database error fetching all orders." });
        }

        return res.status(200).json({ orders });

    } catch (error) {
        console.error("getAdminOrders controller error:", error);
        return res.status(500).json({ error: "Internal server error fetching admin orders." });
    }
};
// Admin: Get sales summary for dashboard
const getSalesSummary = async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from("orders")
            .select("total_amount, status, created_at")
            .neq("status", "Cancelled")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Supabase getSalesSummary database error:", error);

            return res.status(500).json({
                error: "Database error fetching sales summary."
            });
        }

        const monthlySales = {};

        orders.forEach((order) => {
            const date = new Date(order.created_at);

            const month = date.toLocaleString("en-US", {
                month: "short"
            });

            const year = date.getFullYear();

            const key = `${year}-${date.getMonth()}`;

            if (!monthlySales[key]) {
                monthlySales[key] = {
                    month,
                    year,
                    sales: 0
                };
            }

            monthlySales[key].sales += Number(order.total_amount) || 0;
        });

        const salesData = Object.values(monthlySales).map((item) => ({
            month: item.month,
            sales: item.sales
        }));

        const totalSales = orders.reduce(
            (total, order) =>
                total + (Number(order.total_amount) || 0),
            0
        );

        return res.status(200).json({
            totalSales,
            salesData
        });

    } catch (error) {
        console.error("getSalesSummary controller error:", error);

        return res.status(500).json({
            error: "Internal server error fetching sales summary."
        });
    }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Status value is required." });
        }

        const { data: order, error } = await supabase
            .from("orders")
            .update({ status, updated_at: new Date() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Supabase updateOrderStatus database error:", error);
            return res.status(500).json({ error: "Database error updating order status." });
        }

        return res.status(200).json({
            message: "Order status updated successfully.",
            order
        });

    } catch (error) {
        console.error("updateOrderStatus controller error:", error);
        return res.status(500).json({ error: "Internal server error updating status." });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getAdminOrders,
       getSalesSummary,
    updateOrderStatus
};
