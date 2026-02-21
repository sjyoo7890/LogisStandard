import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'plc-simulator',
      timestamp: new Date().toISOString(),
    };
  }
}
