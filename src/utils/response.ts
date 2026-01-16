/**
 * Response Utilities
 * Standardized API response helpers (DRY)
 */

import { Response } from 'express';

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  static error(res: Response, message: string, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  static notFound(res: Response, resource = 'Resource') {
    return res.status(404).json({
      success: false,
      error: `${resource} not found`,
    });
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      error: message,
    });
  }

  static badRequest(res: Response, message: string) {
    return res.status(400).json({
      success: false,
      error: message,
    });
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      error: message,
    });
  }
}
