import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ProblemDetails } from '../types/problem-details.type';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = exception instanceof HttpException ? exception.getResponse() : undefined;

    const problem: ProblemDetails = {
      type: `https://datashare.local/problems/${status}`,
      title: getProblemTitle(status, exceptionBody),
      status,
      detail: getProblemDetail(exceptionBody),
      instance: request.url,
      errors: getValidationErrors(exceptionBody),
    };

    response.type('application/problem+json').status(status).json(problem);
  }
}

function getProblemTitle(status: number, body: unknown): string {
  if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }

  return status >= 500 ? 'Internal Server Error' : 'Request Error';
}

function getProblemDetail(body: unknown): string | undefined {
  if (typeof body === 'string') {
    return body;
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message;
    return Array.isArray(message) ? message.join('; ') : String(message);
  }

  return undefined;
}

function getValidationErrors(body: unknown): Record<string, string[]> | undefined {
  if (typeof body !== 'object' || body === null || !('message' in body) || !Array.isArray(body.message)) {
    return undefined;
  }

  return {
    validation: body.message.map(String),
  };
}
