import { SorterEngineConfig } from '../sorter-engine/sorter-engine.types';

export enum SimEquipmentType {
  PARCEL = 'PARCEL',
  LARGE_LETTER = 'LARGE_LETTER',
  SMALL_LETTER = 'SMALL_LETTER',
  DELIVERY_ROUTE = 'DELIVERY_ROUTE',
}

export interface SimulatorProfile {
  type: SimEquipmentType;
  name: string;
  profile: 'PROFILE_A' | 'PROFILE_B';
  config: SorterEngineConfig;
}
