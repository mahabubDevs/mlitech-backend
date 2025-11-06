import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import { jwtHelper } from '../../helpers/jwtHelper';
import ApiError from '../../errors/ApiErrors';

const auth = (...roles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
        }

        // strip "Bearer " if present, otherwise use raw token
        const token = tokenWithBearer.startsWith('Bearer ')
            ? tokenWithBearer.slice(7)
            : tokenWithBearer;

        // verify token
        const verifyUser = jwtHelper.verifyToken(
            token,
            config.jwt.jwt_secret as Secret
        );

        // 🔹 set _id for controller
        req.user = {
            _id: verifyUser.id,      // now _id is available
            role: verifyUser.role,
            email: verifyUser.email
        };

        // check roles
        if (roles.length && !roles.includes(verifyUser.role)) {
            throw new ApiError(StatusCodes.FORBIDDEN, "You don't have permission to access this API");
        }

        next();

    } catch (error) {
        next(error);
    }
};

export default auth;
