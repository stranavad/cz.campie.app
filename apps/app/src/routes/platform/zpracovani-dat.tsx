import { createFileRoute } from '@tanstack/react-router';

import { DataPage } from '@/features/legal';

export const Route = createFileRoute('/platform/zpracovani-dat')({ component: DataPage });
