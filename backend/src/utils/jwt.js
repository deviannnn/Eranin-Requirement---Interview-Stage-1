require('dotenv').config();
const jwt = require('jsonwebtoken');

const TOKEN = {
    mfa: {
        secret: process.env.JWT_SECRET_MFA,
        expiresIn: '30s',
        algorithm: 'HS256'
    },
    access: {
        secret: process.env.JWT_SECRET_ACCESSTOKEN,
        expiresIn: '1m',
        algorithm: 'HS256'
    },
    refresh: {
        secret: process.env.JWT_SECRET_REFRESHTOKEN,
        expiresIn: '10m',
        algorithm: 'HS256'
    }
};

const generateToken = (payload, type, time = null) => {
    try {
        const tokenConfig = TOKEN[type];
        if (!tokenConfig) throw new Error('Invalid token type');

        const { secret, algorithm } = tokenConfig;
        const expiresIn = time || tokenConfig.expiresIn;

        return jwt.sign(payload, secret, { algorithm, expiresIn });
    } catch (error) {
        console.error('Error generating JWT:', error.message);
        throw error;
    }
};

const extractToken = (req) => {
    if (req.query && req.query.token) {
        return (req.query).token;
    } else if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
}

const decodeToken = (token, type) => {
    try {
        const tokenConfig = TOKEN[type];
        if (!tokenConfig) throw new Error('Invalid token type');
        return jwt.verify(token, tokenConfig.secret);
    } catch (error) {
        console.error('Error decoding token:', error.message);
        throw error;
    }
};

module.exports = { generateToken, extractToken, decodeToken };