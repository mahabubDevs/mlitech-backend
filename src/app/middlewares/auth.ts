import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import { jwtHelper } from '../../helpers/jwtHelper';
import ApiError from '../../errors/ApiErrors';
import { User } from '../modules/user/user.model';

const auth = (...roles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
        }

        // strip "Bearer " if present
        const token = tokenWithBearer.startsWith('Bearer ')
            ? tokenWithBearer.slice(7)
            : tokenWithBearer;

        // verify JWT token
        const verifyUser: any = jwtHelper.verifyToken(
            token,
            config.jwt.jwt_secret as Secret
        );

        // ✅ Fetch user from DB
        const user = await User.findById(verifyUser.id);
        if (!user) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
        }

        // ✅ Single device check
        if (user.latestToken !== token) {
            throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                'You are logged in from another device'
            );
        }

        // 🔹 Attach user info to req for controllers
        req.user = {
            _id: user._id,
            role: user.role,
            email: user.email,
            isSubMerchant: user.isSubMerchant,
            merchantId: user.merchantId,
        };

        // ✅ Role-based access
        if (roles.length && !roles.includes(user.role as string)) {
            throw new ApiError(StatusCodes.FORBIDDEN, "You don't have permission to access this API");
        }

        next();

    } catch (error) {
        next(error);
    }
};

export default auth;
