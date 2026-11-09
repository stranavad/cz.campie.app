import { TentIcon } from 'lucide-react';

import type { PublicCamp } from '@repo/schema/camps';

interface CampCardPictureProps {
  camp: PublicCamp;
}

// The top of a Camp's card: its photo, else its logo on its accent, else a tent.
export function CampCardPicture({ camp }: CampCardPictureProps) {
  if (camp.photoUrl !== null) {
    return <img src={camp.photoUrl} alt="" height={150} className="h-37.5 w-full bg-brand object-cover" />;
  }

  return (
    <span className="flex h-37.5 items-center justify-center bg-brand text-brand-foreground">
      {camp.logoUrl === null ? (
        <TentIcon aria-hidden="true" className="size-10" />
      ) : (
        <img
          src={camp.logoUrl}
          alt=""
          height={80}
          className="h-20 w-auto max-w-[70%] rounded-2xl bg-logo-plate object-contain p-2"
        />
      )}
    </span>
  );
}
