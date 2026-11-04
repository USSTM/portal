import * as migration_20261002_172314_baseline from './20261002_172314_baseline';
import * as migration_20261023_185542_add_content_managers from './20261023_185542_add_content_managers';
import * as migration_20261023_185557_remove_users from './20261023_185557_remove_users';
import * as migration_20261023_191509_add_clubs_directory_block from './20261023_191509_add_clubs_directory_block';
import * as migration_20261023_191526_remove_student_groups from './20261023_191526_remove_student_groups';
import * as migration_20261103_175743_read_board_from_portal from './20261103_175743_read_board_from_portal';
import * as migration_20261103_175839_remove_board_history from './20261103_175839_remove_board_history';

export const migrations = [
  {
    up: migration_20261002_172314_baseline.up,
    down: migration_20261002_172314_baseline.down,
    name: '20261002_172314_baseline',
  },
  {
    up: migration_20261023_185542_add_content_managers.up,
    down: migration_20261023_185542_add_content_managers.down,
    name: '20261023_185542_add_content_managers',
  },
  {
    up: migration_20261023_185557_remove_users.up,
    down: migration_20261023_185557_remove_users.down,
    name: '20261023_185557_remove_users',
  },
  {
    up: migration_20261023_191509_add_clubs_directory_block.up,
    down: migration_20261023_191509_add_clubs_directory_block.down,
    name: '20261023_191509_add_clubs_directory_block',
  },
  {
    up: migration_20261023_191526_remove_student_groups.up,
    down: migration_20261023_191526_remove_student_groups.down,
    name: '20261023_191526_remove_student_groups',
  },
  {
    up: migration_20261103_175743_read_board_from_portal.up,
    down: migration_20261103_175743_read_board_from_portal.down,
    name: '20261103_175743_read_board_from_portal',
  },
  {
    up: migration_20261103_175839_remove_board_history.up,
    down: migration_20261103_175839_remove_board_history.down,
    name: '20261103_175839_remove_board_history'
  },
];
