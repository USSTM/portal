import * as migration_20261002_172314_baseline from './20261002_172314_baseline';

export const migrations = [
  {
    up: migration_20261002_172314_baseline.up,
    down: migration_20261002_172314_baseline.down,
    name: '20261002_172314_baseline'
  },
];
