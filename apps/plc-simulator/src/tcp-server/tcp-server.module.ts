import { Module, Global } from '@nestjs/common';
import { TcpServerService } from './tcp-server.service';

@Global()
@Module({
  providers: [TcpServerService],
  exports: [TcpServerService],
})
export class TcpServerModule {}
