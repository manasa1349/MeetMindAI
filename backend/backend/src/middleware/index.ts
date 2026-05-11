import { Request, Response, NextFunction } from 'express';

// Middleware for logging requests
export const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

// Middleware for handling errors
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
};

// Middleware for checking authentication
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // Implement authentication logic here
    const token = req.headers['authorization'];
    if (token) {
        // Verify token and proceed
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
};