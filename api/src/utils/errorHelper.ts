// errorHelper.ts
import type { ErrorCode, ErrorMessage } from './errorsMap';
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: ErrorMessage;
    details?: any;
  };
  timestamp: string;
}
export const errorResponseHelper = (code: ErrorCode, message: ErrorMessage, details?: any): ErrorResponse => {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };
};
