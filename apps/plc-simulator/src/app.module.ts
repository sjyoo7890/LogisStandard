import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TcpServerModule } from './tcp-server/tcp-server.module';
import { HeartbeatModule } from './heartbeat/heartbeat.module';
import { SorterEngineModule } from './sorter-engine/sorter-engine.module';
import { CommandHandlerModule } from './command-handler/command-handler.module';
import { ProfileModule } from './profile/profile.module';
import { ScenarioModule } from './scenario/scenario.module';
import { GatewayModule } from './gateway/gateway.module';
import { SimulationController } from './simulation-controller/simulation.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TcpServerModule,
    HeartbeatModule,
    SorterEngineModule,
    CommandHandlerModule,
    ProfileModule,
    ScenarioModule,
    GatewayModule,
  ],
  controllers: [AppController, SimulationController],
  providers: [AppService],
})
export class AppModule {}
