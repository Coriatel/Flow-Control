import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const parsed = schema.parse(data);

      // Replace the original data with parsed/transformed data
      req[source] = parsed;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(err => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        });

        next(new AppError(messages.join('; '), 400));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Combined validation for multiple sources
 */
export const validateRequest = (options: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (options.body) {
        req.body = options.body.parse(req.body);
      }
      if (options.query) {
        req.query = options.query.parse(req.query) as any;
      }
      if (options.params) {
        req.params = options.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(err => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        });
        next(new AppError(messages.join('; '), 400));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Safe parse - returns result without throwing
 * Useful when you want to handle validation errors differently
 */
export const safeParse = <T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, error: messages.join('; ') };
    }
    return { success: false, error: 'Validation failed' };
  }
};
