import { createFileRoute } from '@tanstack/react-router';

import { DataProcessingAgreementPage } from '@/features/legal';

export const Route = createFileRoute('/platform/zpracovatelska-smlouva')({ component: DataProcessingAgreementPage });
