import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to sanitize MongoDB queries by removing any keys starting with $ 
 * in req.body, req.query, and req.params.
 * This prevents NoSQL injection attacks where attackers try to use operators 
 * like $gt, $ne, $where etc.
 */
export const sanitizeMongo = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (key.startsWith('$')) {
          console.warn(`[SECURITY] MongoDB operator injection attempt detected and blocked: ${key}`);
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
};
