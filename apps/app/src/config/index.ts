import { env } from '@/config/env';

export const config = {
  productName: env.VITE_PRODUCT_NAME,
  platformDomain: env.VITE_PLATFORM_DOMAIN,
};
