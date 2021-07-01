import express, {NextFunction} from 'express';
import {body, validationResult} from 'express-validator';
import {RequestValidationError} from "../errors/request-validation-error";
import {User} from "../models/user";
import {BadRequestError} from "../errors/bad-request-error";
import jwt from "jsonwebtoken";

const router = express.Router()

router.post('/api/users/signup', [
    body('email').isEmail().withMessage("Email must be valid"),
    body('password').trim().isLength({min: 4, max: 20}).withMessage("Password must be between 4 and 20 characters")
], async (req: express.Request, res: express.Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        next(new RequestValidationError(errors.array()))
    }
    const {email, password} = req.body;

    const existingUser = await User.findOne({email});

    if (existingUser) {
        return next(new BadRequestError("Email in use"));
    }

    const user = User.build({email, password});
    await user.save();

    //Generate JsonWebToken
    const userJwt = jwt.sign({
        id: user.id,
        email: user.email
    }, 'SECRET');

    // set cookie
    req.session = {
        jwt: userJwt
    };

    res.status(201).send(user);
});


export {router as signupRouter}
