const supabase = require("../config/supabase");

const getOverview = async (req, res) => {
    try {

        /*
        ============================================
        1. TOTAL CUSTOMERS
        ============================================
        */

        const { count: customerCount, error: customerError } =
            await supabase
                .from("users")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq("role", "user");


        if (customerError) {
            console.error(
                "Overview customer count error:",
                customerError
            );

            return res.status(500).json({
                error: "Failed to fetch customer statistics"
            });
        }


        /*
        ============================================
        2. TOTAL PRODUCTS
        ============================================
        */

        const { count: productCount, error: productError } =
            await supabase
                .from("products")
                .select("id", {
                    count: "exact",
                    head: true
                });


        if (productError) {
            console.error(
                "Overview product count error:",
                productError
            );

            return res.status(500).json({
                error: "Failed to fetch product statistics"
            });
        }


        /*
        ============================================
        3. SERVICE REQUEST COUNTS
        ============================================
        */

        const [
            inspectionsResult,
            repairsResult,
            amcResult
        ] = await Promise.all([

            supabase
                .from("inspections")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            supabase
                .from("repairs")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            supabase
                .from("amc_contracts")
                .select("id", {
                    count: "exact",
                    head: true
                })

        ]);


        if (
            inspectionsResult.error ||
            repairsResult.error ||
            amcResult.error
        ) {

            console.error(
                "Overview service count error:",
                inspectionsResult.error ||
                repairsResult.error ||
                amcResult.error
            );

            return res.status(500).json({
                error: "Failed to fetch service statistics"
            });
        }


        const inspectionCount =
            inspectionsResult.count || 0;

        const repairCount =
            repairsResult.count || 0;

        const amcCount =
            amcResult.count || 0;


        const totalServiceRequests =
            inspectionCount +
            repairCount +
            amcCount;


        /*
        ============================================
        4. MONTHLY CUSTOMER GROWTH
        ============================================
        */

        const { data: customers, error: customersError } =
            await supabase
                .from("users")
                .select("created_at")
                .eq("role", "user")
                .order("created_at", {
                    ascending: true
                });


        if (customersError) {

            console.error(
                "Overview customer chart error:",
                customersError
            );

            return res.status(500).json({
                error: "Failed to fetch customer growth data"
            });
        }


        const monthlyCustomers = Array.from(
            { length: 12 },
            (_, index) => ({
                month: new Date(
                    2026,
                    index,
                    1
                ).toLocaleString("en-US", {
                    month: "short"
                }),
                customers: 0
            })
        );


        customers.forEach((customer) => {

            const date =
                new Date(customer.created_at);

            const month =
                date.getMonth();

            monthlyCustomers[month].customers += 1;

        });


        const currentMonth =
            new Date().getMonth();

        const currentMonthCustomers =
            monthlyCustomers[currentMonth].customers;


        /*
        ============================================
        5. SERVICE REQUEST STATUS
        ============================================
        */

        const [
            inspectionStatusesResult,
            repairStatusesResult,
            amcStatusesResult
        ] = await Promise.all([

            supabase
                .from("inspections")
                .select("status"),

            supabase
                .from("repairs")
                .select("status"),

            supabase
                .from("amc_contracts")
                .select("status")

        ]);


        if (
            inspectionStatusesResult.error ||
            repairStatusesResult.error ||
            amcStatusesResult.error
        ) {

            console.error(
                "Overview service status error:",
                inspectionStatusesResult.error ||
                repairStatusesResult.error ||
                amcStatusesResult.error
            );

            return res.status(500).json({
                error: "Failed to fetch service request status"
            });
        }


        const serviceStatus = {
            Completed: 0,
            "In Progress": 0,
            Pending: 0,
            Cancelled: 0
        };


        /*
        Inspection statuses
        */

        inspectionStatusesResult.data.forEach(
            (request) => {

                if (request.status === "completed") {
                    serviceStatus.Completed++;
                }

                else if (
                    request.status === "scheduled"
                ) {
                    serviceStatus["In Progress"]++;
                }

                else if (
                    request.status === "pending"
                ) {
                    serviceStatus.Pending++;
                }

                else if (
                    request.status === "cancelled"
                ) {
                    serviceStatus.Cancelled++;
                }

            }
        );


        /*
        Repair statuses
        */

        repairStatusesResult.data.forEach(
            (request) => {

                if (request.status === "completed") {
                    serviceStatus.Completed++;
                }

                else if (
                    request.status === "diagnosed" ||
                    request.status === "in_progress"
                ) {
                    serviceStatus["In Progress"]++;
                }

                else if (
                    request.status === "pending"
                ) {
                    serviceStatus.Pending++;
                }

                else if (
                    request.status === "cancelled"
                ) {
                    serviceStatus.Cancelled++;
                }

            }
        );


        /*
        AMC statuses
        */

        amcStatusesResult.data.forEach(
            (request) => {

                if (request.status === "completed") {
                    serviceStatus.Completed++;
                }

                else if (
                    request.status === "active"
                ) {
                    serviceStatus["In Progress"]++;
                }

                else if (
                    request.status === "pending"
                ) {
                    serviceStatus.Pending++;
                }

                else if (
                    request.status === "cancelled"
                ) {
                    serviceStatus.Cancelled++;
                }

            }
        );


        /*
        ============================================
        6. RECENT ACTIVITY
        ============================================
        */

        const [
            recentCustomersResult,
            recentInspectionsResult,
            recentRepairsResult,
            recentAmcResult,
             recentOrdersResult

        ] = await Promise.all([

            supabase
                .from("users")
                .select(
                    "id, display_name, created_at"
                )
                .eq("role", "user")
                .order("created_at", {
                    ascending: false
                })
                .limit(5),

            supabase
                .from("inspections")
                .select(
                    "id, full_name, created_at, status"
                )
                .order("created_at", {
                    ascending: false
                })
                .limit(5),

            supabase
                .from("repairs")
                .select(
                    "id, full_name, created_at, status"
                )
                .order("created_at", {
                    ascending: false
                })
                .limit(5),

            supabase
                .from("amc_contracts")
                .select(
                    "id, full_name, created_at, status"
                )
                .order("created_at", {
                    ascending: false
                })
                .limit(5),
                supabase
    .from("orders")
    .select(
        "id, shipping_name, total_amount, created_at, status"
    )
    .order("created_at", {
        ascending: false
    })
    .limit(5)
                

        ]);


        if (
            recentCustomersResult.error ||
            recentInspectionsResult.error ||
            recentRepairsResult.error ||
            recentAmcResult.error ||
             recentOrdersResult.error ||
             recentOrdersResult.error
        ) {

            console.error(
                "Overview recent activity error:",
                recentCustomersResult.error ||
                recentInspectionsResult.error ||
                recentRepairsResult.error ||
                recentAmcResult.error
            );

            return res.status(500).json({
                error: "Failed to fetch recent activity"
            });
        }


        const activities = [];


        /*
        Customer activities
        */

        recentCustomersResult.data.forEach(
            (customer) => {

                activities.push({
                    type: "customer",
                    title: "New customer registered",
                    description:
                        `${customer.display_name || "A customer"} created an account`,
                    created_at: customer.created_at
                });

            }
        );


        /*
        Inspection activities
        */

        recentInspectionsResult.data.forEach(
            (request) => {

                activities.push({
                    type: "service",
                    title: "New service request",
                    description:
                        `${request.full_name} requested an inspection`,
                    created_at: request.created_at
                });

            }
        );


        /*
        Repair activities
        */

        recentRepairsResult.data.forEach(
            (request) => {

                activities.push({
                    type: "service",
                    title: "New service request",
                    description:
                        `${request.full_name} requested a repair`,
                    created_at: request.created_at
                });

            }
        );


        /*
        AMC activities
        */

        recentAmcResult.data.forEach(
            (request) => {

                activities.push({
                    type: "service",
                    title: "New service request",
                    description:
                        `${request.full_name} requested an AMC`,
                    created_at: request.created_at
                });

            }
        );

/*
Order activities
*/

recentOrdersResult.data.forEach(
    (order) => {

        activities.push({
            type: "order",
            title: "New order received",
            description:
                `${order.shipping_name || "A customer"} placed an order for Rs. ${Number(order.total_amount || 0).toLocaleString()}`,
            created_at: order.created_at
        });

    }
);
        /*
        Sort everything by newest activity
        */

        activities.sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        );


        const recentActivity =
            activities.slice(0, 6);


        /*
        ============================================
        FINAL RESPONSE
        ============================================
        */

        return res.status(200).json({

            stats: {
                customers: customerCount || 0,
                products: productCount || 0,
                serviceRequests:
                    totalServiceRequests
            },

            customerChart: {
                monthly: monthlyCustomers,
                thisMonth:
                    currentMonthCustomers
            },

            serviceChart: {
                total: totalServiceRequests,

                statuses: [
                    {
                        name: "Completed",
                        value:
                            serviceStatus.Completed
                    },
                    {
                        name: "In Progress",
                        value:
                            serviceStatus["In Progress"]
                    },
                    {
                        name: "Pending",
                        value:
                            serviceStatus.Pending
                    },
                    {
                        name: "Cancelled",
                        value:
                            serviceStatus.Cancelled
                    }
                ]
            },

            recentActivity

        });

    } catch (error) {

        console.error(
            "getOverview controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while fetching overview"
        });

    }
};


module.exports = {
    getOverview
};