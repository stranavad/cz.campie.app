import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface QrCodeProps {
  payload: string;
  alt: string;
}

// A QR code drawn in the browser from its payload, dark on white with a quiet zone, so phones read it in
// either theme. Its box is sized up front, so nothing moves when the image arrives.
export function QrCode({ payload, alt }: QrCodeProps) {
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
    <span aria-hidden="true" className="size-40 shrink-0 rounded-xl bg-card" />
  ) : (
    <img src={image} alt={alt} width={160} height={160} className="size-40 shrink-0 rounded-xl" />
  );
}
