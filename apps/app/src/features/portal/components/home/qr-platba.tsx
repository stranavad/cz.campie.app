import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// A QR platba a banking app reads, drawn in the browser from its payload. Its box is sized up front, so
// nothing moves when the image arrives.
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

  return image === null ? (
    <span aria-hidden="true" className="size-40 rounded-xl bg-card" />
  ) : (
    <img src={image} alt={t('qr')} width={160} height={160} className="size-40 rounded-xl" />
  );
}
