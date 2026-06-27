import type { AuditableBase, StorageRef } from './primitives.js';
import type { Role } from './rbac.js';

export interface User extends AuditableBase {
  uid: string;
  email?: string;
  phone: string;
  displayName: string;
  photo?: StorageRef;
  /** READ-ONLY mirror of the custom claim. Never trust on the server. */
  role: Role;
  status: 'active' | 'inactive';
}
