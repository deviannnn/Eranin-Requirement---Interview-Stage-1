const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middlewares/auth');

const AuthController = require('../controller/auth.controller');
const ProductController = require('../controller/product.controller');

router.post('/auth/login', AuthController.login);
router.post('/auth/verify-login', AuthController.verifyLogin);
router.post('/auth/refresh-token', AuthController.refresh);

router.use(authenticate);

// router.post('/users/logout');
router.get('/products', ProductController.getAllProducts);

module.exports = router;
