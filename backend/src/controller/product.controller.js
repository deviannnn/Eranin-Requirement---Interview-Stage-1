const productData = require('../products.json');

const getAllProducts = (req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: productData
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = { getAllProducts };