import { createFileRoute } from '@tanstack/react-router';

import { AuditLogPage } from '@/features/organisation-settings';

export const Route = createFileRoute('/platform/historie')({ component: AuditLogPage });
