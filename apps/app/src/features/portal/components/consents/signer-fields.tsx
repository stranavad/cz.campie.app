import { useTranslation } from 'react-i18next';

import { LabelledInput } from '@/features/portal/components/edit/labelled-input';

interface SignerFieldsProps {
  name: string;
  place: string;
  onName: (name: string) => void;
  onPlace: (place: string) => void;
}

// The typed signature: who signs, and where.
export function SignerFields({ name, place, onName, onPlace }: SignerFieldsProps) {
  const { t } = useTranslation('portal');

  return (
    <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2.5">
      <LabelledInput
        label={t('consents.signerName')}
        value={name}
        autoComplete="name"
        onChange={(event) => onName(event.target.value)}
      />
      <LabelledInput
        label={t('consents.signerPlace')}
        value={place}
        onChange={(event) => onPlace(event.target.value)}
      />
    </div>
  );
}
