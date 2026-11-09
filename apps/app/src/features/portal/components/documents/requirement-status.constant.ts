import type { RequirementState } from '@repo/schema/checklist';

// The badge colour of a child's state for a document requirement.
export const REQUIREMENT_STATUS_BADGES = {
  missing: 'warning',
  pending: 'neutral',
  approved: 'success',
  returned: 'danger',
  cleared: 'neutral',
} as const satisfies Record<RequirementState, 'warning' | 'neutral' | 'success' | 'danger'>;
