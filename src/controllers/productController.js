const supabase = require("../config/supabase");

const getProducts = async (req, res) => {
    try {

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Supabase getProducts database error:",
                error
            );

            return res.status(500).json({
                error: "Database fetch failure",
                details: error.message
            });
        }

        return res.status(200).json({
            products: data
        });

    } catch (error) {

        console.error(
            "getProducts controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while fetching products"
        });
    }
};
const getPublicProducts = async (req, res) => {
    try {

        const { data, error } = await supabase
            .from("products")
            .select(
                "id, name, category, price, stock, image, description"
            )
            .order("created_at", { ascending: false });

        if (error) {

            console.error(
                "Get public products database error:",
                error
            );

            return res.status(500).json({
                error: "Failed to fetch products"
            });
        }

        return res.status(200).json({
            products: data
        });

    } catch (error) {

        console.error(
            "Get public products controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};
const createProduct = async (req, res) => {
    try {

        const {
            name,
            category,
            price,
            stock,
            image,
            description
        } = req.body;


        // Basic validation

        if (
            !name ||
            !category ||
            price === undefined ||
            stock === undefined
        ) {
            return res.status(400).json({
                error: "Name, category, price and stock are required."
            });
        }


        const { data, error } = await supabase
            .from("products")
            .insert([
                {
                    name: name.trim(),
                    category,
                    price: Number(price),
                    stock: Number(stock),
                    image: image || null,
                    description: description || null
                }
            ])
            .select()
            .single();


        if (error) {

            console.error(
                "Supabase createProduct database error:",
                error
            );

            return res.status(500).json({
                error: "Failed to create product",
                details: error.message
            });
        }


        return res.status(201).json({
            message: "Product created successfully",
            product: data
        });


    } catch (error) {

        console.error(
            "createProduct controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while creating product"
        });

    }
};
const updateProduct = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            name,
            category,
            price,
            stock,
            image,
            description
        } = req.body;


        // Basic validation

        if (
            !name ||
            !category ||
            price === undefined ||
            stock === undefined
        ) {
            return res.status(400).json({
                error: "Name, category, price and stock are required."
            });
        }


        const { data, error } = await supabase
            .from("products")
            .update({
                name: name.trim(),
                category,
                price: Number(price),
                stock: Number(stock),
                image: image || null,
                description: description || null,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();


        if (error) {

            console.error(
                "Supabase updateProduct database error:",
                error
            );

            return res.status(500).json({
                error: "Failed to update product",
                details: error.message
            });
        }


        if (!data) {

            return res.status(404).json({
                error: "Product not found"
            });

        }


        return res.status(200).json({
            message: "Product updated successfully",
            product: data
        });


    } catch (error) {

        console.error(
            "updateProduct controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while updating product"
        });

    }
};
const deleteProduct = async (req, res) => {
    try {

        const { id } = req.params;


        const { data, error } = await supabase
            .from("products")
            .delete()
            .eq("id", id)
            .select()
            .single();


        if (error) {

            console.error(
                "Supabase deleteProduct database error:",
                error
            );

            return res.status(500).json({
                error: "Failed to delete product",
                details: error.message
            });
        }


        if (!data) {

            return res.status(404).json({
                error: "Product not found"
            });

        }


        return res.status(200).json({
            message: "Product deleted successfully",
            product: data
        });


    } catch (error) {

        console.error(
            "deleteProduct controller error:",
            error
        );

        return res.status(500).json({
            error: "Internal server error while deleting product"
        });

    }
};
module.exports = {
    getProducts,
    getPublicProducts,
    createProduct,
    updateProduct,
        deleteProduct
};