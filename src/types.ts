/**
 * Canonical domain types live in `player/utils/types`; this module re-exports
 * them so existing imports keep working and there is a single definition.
 */
export type {
  AuthUser,
  UserRow,
  Program,
  Track,
  Comment,
  SearchResults,
  CreateUserInput,
  MeUpdateInput,
  TrackUpdateInput,
} from './player/utils/types';
