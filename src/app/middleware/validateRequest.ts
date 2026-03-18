import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodObject) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Handle form-data with data field
        if (req.body && req.body.data && typeof req.body.data === 'string') {
            try {
                req.body = JSON.parse(req.body.data);
            } catch (e) {
                // If parsing fails, continue with current body
            }
        }

        const parsedResult = zodSchema.safeParse(req.body || {});

        if (!parsedResult.success) {
            return next(parsedResult.error);
        }

        req.body = parsedResult.data;
        next();
    };
};
