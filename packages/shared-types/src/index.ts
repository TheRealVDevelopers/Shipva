export * from './primitives.js';
export * from './rbac.js';
export * from './users.js';
export * from './vehicles.js';
export * from './customers.js';
export * from './drivers.js';
export * from './bookings.js';
export * from './bids.js';
export * from './transporters.js';
export * from './fleet.js';
export * from './posts.js';
export * from './connections.js';

/** Collection name constants — single source for both client and server. */
export const Collections = {
  users: 'users',
  customers: 'customers',
  drivers: 'drivers',
  bookings: 'bookings',
  bids: 'bids',
  transporters: 'transporters',
  fleetVehicles: 'fleetVehicles',
  fleetDrivers: 'fleetDrivers',
  loadPosts: 'loadPosts',
  truckPosts: 'truckPosts',
  connections: 'connections',
  zones: 'zones',
  ratings: 'ratings',
  notifications: 'notifications',
  auditLogs: 'auditLogs',
  counters: 'counters',
  config: 'config',
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
