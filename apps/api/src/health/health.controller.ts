import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
};

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'API health check endpoint used by infrastructure load balancers.',
    schema: {
      example: {
        status: 'success',
        message: 'OK',
        data: {
          status: 'ok',
        },
      },
    },
  })
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
