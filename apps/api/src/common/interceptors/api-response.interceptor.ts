import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';
import type { ApiResponse } from '../types/api-response.type';

@Injectable()
export class ApiResponseInterceptor<TData> implements NestInterceptor<TData, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<TData>): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile || response.headersSent) {
          return data;
        }

        if (isAlreadyEnveloped(data)) {
          return data;
        }

        return {
          status: 'success',
          message: 'OK',
          data,
        };
      }),
    );
  }
}

function isAlreadyEnveloped(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    'data' in value
  );
}
