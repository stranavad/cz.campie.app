import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// A QR platba a banking app reads, drawn in the browser from its payload.
export function QrPlatba({ payload }: { payload: string }) {
  const { t } = useTranslation('portal');
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let current = true;

    void QRCode.toDataURL(payload, { margin: 2, errorCorrectionLevel: 'M', width: 320 }).then((url) => {
      if (current) {
        setImage(url);
      }
    });

    return () => {
      current = false;
    };
  }, [payload]);

  return image === null ? null : <img src={image} alt={t('qr')} className="size-40" />;
}
