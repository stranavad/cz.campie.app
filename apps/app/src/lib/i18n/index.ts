import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';

import { config } from '@/config';
import { defaultNamespace, resources } from '@/lib/i18n/resources';

// Resources are bundled, so initialising synchronously means no render ever sees missing texts.
await i18next.use(initReactI18next).init({
  lng: 'cs',
  fallbackLng: 'cs',
  resources,
  defaultNS: defaultNamespace,
  initAsync: false,
  interpolation: {
    // React escapes rendered text already.
    escapeValue: false,
    defaultVariables: { productName: config.productName, platformDomain: config.platformDomain },
  },
});

z.config(z.locales.cs());
