import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { SimEquipmentType, SimulatorProfile } from './profile.types';
import { SorterEngineConfig, DEFAULT_ENGINE_CONFIG } from '../sorter-engine/sorter-engine.types';
import { SorterEngineService } from '../sorter-engine/sorter-engine.service';

const PROFILES: SimulatorProfile[] = [
  {
    type: SimEquipmentType.PARCEL,
    name: '소포구분기',
    profile: 'PROFILE_A',
    config: {
      ...DEFAULT_ENGINE_CONFIG,
      inductionCount: 2,
      chuteCount: 100,
      inductionIntervalMs: 1500,
    },
  },
  {
    type: SimEquipmentType.LARGE_LETTER,
    name: '대형통상구분기',
    profile: 'PROFILE_A',
    config: {
      ...DEFAULT_ENGINE_CONFIG,
      inductionCount: 2,
      chuteCount: 80,
      inductionIntervalMs: 1000,
    },
  },
  {
    type: SimEquipmentType.SMALL_LETTER,
    name: '소형통상구분기',
    profile: 'PROFILE_B',
    config: {
      ...DEFAULT_ENGINE_CONFIG,
      inductionCount: 4,
      chuteCount: 200,
      inductionIntervalMs: 200,
    },
  },
  {
    type: SimEquipmentType.DELIVERY_ROUTE,
    name: '집배순로구분기',
    profile: 'PROFILE_B',
    config: {
      ...DEFAULT_ENGINE_CONFIG,
      inductionCount: 4,
      chuteCount: 200,
      inductionIntervalMs: 200,
    },
  },
];

@Injectable()
export class ProfileService {
  private logger = createLogger({ service: 'profile' });
  private activeProfile?: SimulatorProfile;

  constructor(private readonly sorterEngine: SorterEngineService) {}

  getProfiles(): SimulatorProfile[] {
    return PROFILES;
  }

  getActiveProfile(): SimulatorProfile | undefined {
    return this.activeProfile;
  }

  applyProfile(type: SimEquipmentType): SimulatorProfile {
    const profile = PROFILES.find((p) => p.type === type);
    if (!profile) {
      throw new Error(`Unknown profile type: ${type}`);
    }
    this.sorterEngine.updateConfig(profile.config);
    this.activeProfile = profile;
    this.logger.info(`Profile applied: ${profile.name} (${profile.type})`);
    return profile;
  }
}
