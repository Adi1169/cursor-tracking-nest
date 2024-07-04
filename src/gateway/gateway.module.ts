import { Module } from '@nestjs/common';
import { CursorGateway } from './cursor.gateway';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
  ],
  providers: [CursorGateway],
})
export class GatewayModule {}
