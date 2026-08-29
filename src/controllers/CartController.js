const supabase = require("../config/supabase");

// Get current user's cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.uid;

        const { data, error } = await supabase
            .from("cart_items")
            .select(`
                id,
                user_id,
                product_id,
                quantity,
                created_at,
                updated_at,
                products (
                    id,
                    name,
                    category,
                    price,
                    stock,
                    image,
                    description
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Supabase getCart error:", error);

            return res.status(500).json({
                error: "Failed to fetch cart."
            });
        }

        const cartItems = data.map((item) => ({
            id: item.product_id,
            cartItemId: item.id,
            name: item.products.name,
            category: item.products.category,
            price: item.products.price,
            stock: item.products.stock,
            image: item.products.image,
            description: item.products.description,
            quantity: item.quantity
        }));

        return res.status(200).json({
            cartItems
        });

    } catch (error) {
        console.error("getCart controller error:", error);

        return res.status(500).json({
            error: "Internal server error while fetching cart."
        });
    }
};


// Add product to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user.uid;

        const {
            productId,
            quantity = 1
        } = req.body;

        if (!productId) {
            return res.status(400).json({
                error: "Product ID is required."
            });
        }

        const requestedQuantity = Number(quantity);

        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {
            return res.status(400).json({
                error: "Quantity must be at least 1."
            });
        }


        // Get product
        const { data: product, error: productError } =
            await supabase
                .from("products")
                .select("*")
                .eq("id", productId)
                .single();

        if (productError || !product) {
            return res.status(404).json({
                error: "Product not found."
            });
        }


        // Check existing cart item
        const { data: existingItem, error: existingError } =
            await supabase
                .from("cart_items")
                .select("*")
                .eq("user_id", userId)
                .eq("product_id", productId)
                .maybeSingle();

        if (existingError) {
            console.error(
                "Supabase existing cart item error:",
                existingError
            );

            return res.status(500).json({
                error: "Failed to check cart."
            });
        }


        const newQuantity = existingItem
            ? existingItem.quantity + requestedQuantity
            : requestedQuantity;


        // Don't allow cart quantity above available stock
        if (newQuantity > Number(product.stock)) {
            return res.status(400).json({
                error: `Only ${product.stock} units of '${product.name}' are available.`
            });
        }


        let data;
        let error;


        if (existingItem) {

            const result = await supabase
                .from("cart_items")
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existingItem.id)
                .select()
                .single();

            data = result.data;
            error = result.error;

        } else {

            const result = await supabase
                .from("cart_items")
                .insert({
                    user_id: userId,
                    product_id: productId,
                    quantity: requestedQuantity
                })
                .select()
                .single();

            data = result.data;
            error = result.error;
        }


        if (error) {
            console.error(
                "Supabase addToCart error:",
                error
            );

            return res.status(500).json({
                error: "Failed to add product to cart."
            });
        }


        return res.status(200).json({
            message: "Product added to cart.",
            cartItem: data
        });

    } catch (error) {
        console.error("addToCart controller error:", error);

        return res.status(500).json({
            error: "Internal server error while adding to cart."
        });
    }
};


// Update cart quantity
const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { productId } = req.params;
        const { quantity } = req.body;

        const newQuantity = Number(quantity);

        if (
            !Number.isInteger(newQuantity) ||
            newQuantity < 1
        ) {
            return res.status(400).json({
                error: "Quantity must be at least 1."
            });
        }


        // Check product stock
        const { data: product, error: productError } =
            await supabase
                .from("products")
                .select("stock")
                .eq("id", productId)
                .single();

        if (productError || !product) {
            return res.status(404).json({
                error: "Product not found."
            });
        }


        if (newQuantity > Number(product.stock)) {
            return res.status(400).json({
                error: `Only ${product.stock} units are available.`
            });
        }


        const { data, error } = await supabase
            .from("cart_items")
            .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId)
            .eq("product_id", productId)
            .select()
            .single();


        if (error) {
            console.error(
                "Supabase updateCartQuantity error:",
                error
            );

            return res.status(500).json({
                error: "Failed to update cart quantity."
            });
        }


        return res.status(200).json({
            message: "Cart quantity updated.",
            cartItem: data
        });

    } catch (error) {
        console.error(
            "updateCartQuantity controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while updating cart."
        });
    }
};


// Remove one product from cart
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { productId } = req.params;

        const { data, error } = await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId)
            .eq("product_id", productId)
            .select()
            .single();

        if (error) {
            console.error(
                "Supabase removeFromCart error:",
                error
            );

            return res.status(500).json({
                error: "Failed to remove product from cart."
            });
        }

        return res.status(200).json({
            message: "Product removed from cart.",
            cartItem: data
        });

    } catch (error) {
        console.error(
            "removeFromCart controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while removing cart item."
        });
    }
};


// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const userId = req.user.uid;

        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId);

        if (error) {
            console.error(
                "Supabase clearCart error:",
                error
            );

            return res.status(500).json({
                error: "Failed to clear cart."
            });
        }

        return res.status(200).json({
            message: "Cart cleared successfully."
        });

    } catch (error) {
        console.error(
            "clearCart controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while clearing cart."
        });
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
};