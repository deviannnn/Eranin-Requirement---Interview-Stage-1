const createError = require('http-errors');
const bcrypt = require('bcrypt');
const jwtUtils = require('../utils/jwt');
const mailUtils = require('../utils/mail');
const userData = require('../users.json');

let validRefreshTokens = {};

const generateTokenPair = (user, remainingTime = null) => {
    const accessToken = jwtUtils.generateToken({ id: user.id, roleId: user.roleId }, 'access');
    const refreshToken = jwtUtils.generateToken({ id: user.id, roleId: user.roleId }, 'refresh', remainingTime);
    return { accessToken, refreshToken };
};

const sendVerificationEmail = async (user) => {
    try {
        const mfaToken = jwtUtils.generateToken({ id: user.id }, 'mfa');
        const url = `${process.env.FRONT_END_BASE_URL}/#!/verify-login?token=${mfaToken}`;

        const { mailRecipient, subject, content } = mailUtils.composeVerifyMail(user, url);
        await mailUtils.sendEmail(mailRecipient, subject, content);
    } catch (err) {
        throw new Error('Failed to send verification email');
    }
};

const login = async (req, res, next) => {
    try {
        const { gmail, password } = req.body;

        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmail || !gmailRegex.test(gmail)) {
            return next(createError(400, 'Invalid gmail format.'));
        }
        if (!password) {
            return next(createError(400,'Password is required.'));
        }

        const user = userData.find(user => user.gmail === gmail);
        if (!user || !bcrypt.compareSync(password, user.password))
            return next(createError(400, 'Invalid gmail or password'));

        if (user.enableMFA) {
            await sendVerificationEmail(user);
            return res.status(200).json({
                success: true,
                message: 'Verification email sent!',
                data: { enableMFA: true }
            });
        }

        const { accessToken, refreshToken } = generateTokenPair(user);
        validRefreshTokens[refreshToken] = true;

        return res.status(200).json({
            success: true,
            message: 'Login successfully!',
            data: { enableMFA: false, accessToken, refreshToken }
        });
    } catch (error) {
        return next(error);
    }
}

const verifyLogin = (req, res, next) => {
    try {
        const verifyToken = jwtUtils.extractToken(req);
        if (!verifyToken) return next(createError(401, 'No verify token provided!'));

        let decoded;
        try {
            decoded = jwtUtils.decodeToken(verifyToken, 'mfa');
        } catch (error) {
            return next(createError(401, 'Invalid or expired token'));
        }

        const user = userData.find(user => user.id === decoded.id);
        if (!user) return next(createError(404, 'User\'s account not found'));

        const { accessToken, refreshToken } = generateTokenPair(user);
        validRefreshTokens[refreshToken] = true;

        return res.status(200).json({
            success: true,
            message: 'Login successfully!',
            data: { accessToken, refreshToken }
        });
    } catch (error) {
        return next(error);
    }
}

const refresh = (req, res, next) => {
    try {
        // Lấy refresh token từ request headers hoặc body
        const oldToken = jwtUtils.extractToken(req);
        if (!oldToken) return next(createError(401, 'No refresh token provided!'));

        // Kiểm tra refresh token có trong danh sách hợp lệ không
        if (!validRefreshTokens[oldToken]) {
            return next(createError(401, 'Invalid or expired refresh token'));
        }

        let decoded;
        try {
            // Giải mã refresh token
            decoded = jwtUtils.decodeToken(oldToken, 'refresh');
        } catch (error) {
            return next(createError(401, 'Invalid or expired refresh token'));
        }

        // Tìm người dùng trong cơ sở dữ liệu dựa trên ID trong refresh token
        const user = userData.find(user => user.id === decoded.id);
        if (!user) return next(createError(404, 'User\'s account not found'));

        // Tính toán thời gian còn lại của refresh token
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = decoded.exp - currentTime + "s";
        console.log(decoded, remainingTime);

        const { accessToken, refreshToken } = generateTokenPair(user, remainingTime);

        // Xóa refresh token cũ khỏi danh sách
        delete validRefreshTokens[oldToken];

        // Lưu refresh token mới vào danh sách hợp lệ
        validRefreshTokens[refreshToken] = true;

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully!',
            data: { accessToken, refreshToken }
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = { login, verifyLogin, refresh }