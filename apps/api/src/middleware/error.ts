import { Context, Next } from 'hono';
import { AppError, fromZodError } from '../lib/error';
import { env } from '../lib/env';

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    const requestId = c.get('requestId') || 'unknown';

    if (error instanceof AppError) {
      const response = c.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
        },
        error.statusCode,
      );
      return response;
    }

    if (error instanceof Error) {
      const zodError = error as unknown as { constructor: { name: string }; issues?: unknown[] };
      if (zodError.constructor.name === 'ZodError' || error.message.includes('Validation')) {
        const validationError = fromZodError(error as unknown as import('zod').ZodError);
        const response = c.json(
          {
            success: false,
            error: {
              code: validationError.code,
              message: validationError.message,
              requestId,
            },
          },
          validationError.statusCode,
        );
        return response;
      }
    }

    console.error('Unhandled error:', error);

    const response = c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: isProduction ? 'An unexpected error occurred' : (error as Error).message,
          requestId,
        },
      },
      500,
    );
    return response;
  }
}

const isProduction = env.NODE_ENV === 'production';
