import { OrderStatus } from '@prisma/client';

/**
 * Order status state machine — defines which transitions are valid.
 * Enforce server-side on every status update; reject anything not on this list.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  ACCEPTED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Who can trigger which transition.
 * 'buyer' = only the buyer on that order, 'seller' = only the seller, 'both' = either side.
 */
export const TRANSITION_AUTHORIZATION: Record<string, 'buyer' | 'seller' | 'both'> = {
  'PENDING->ACCEPTED': 'seller',
  'PENDING->CANCELLED': 'both',
  'ACCEPTED->IN_PROGRESS': 'seller',
  'ACCEPTED->CANCELLED': 'both',
  'IN_PROGRESS->DELIVERED': 'seller',
  'DELIVERED->COMPLETED': 'buyer',
};

/**
 * Pagination defaults
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
