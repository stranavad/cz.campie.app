import { useTranslation } from 'react-i18next';

import type { ConsentItem } from '@repo/schema/consents';

interface ConsentPreviewProps {
  title: string;
  introduction: string;
  items: readonly ConsentItem[];
  withdrawable: boolean;
  fileUrl: string | null;
}

// A Consent as guardians will read it, its answers shown but not taken.
export function ConsentPreview({ title, introduction, items, withdrawable, fileUrl }: ConsentPreviewProps) {
  const { t } = useTranslation('camps');

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4 text-sm">
      <h4 className="text-base font-semibold">{title}</h4>
      {introduction === '' ? null : <p className="whitespace-pre-line">{introduction}</p>}
      {fileUrl === null ? null : (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="self-start underline">
          {t('consents.readPdf')}
        </a>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1">
            <p className="whitespace-pre-line">{item.text}</p>
            {item.kind === 'must_agree' ? (
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" disabled />
                {t('consents.agree')}
              </label>
            ) : null}
            {item.kind === 'yes_no' ? (
              <span className="flex gap-4 text-muted-foreground">
                <label className="flex items-center gap-1">
                  <input type="radio" disabled />
                  {t('consents.yes')}
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" disabled />
                  {t('consents.no')}
                </label>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground">
        {withdrawable ? t('consents.withdrawableNote') : t('consents.bindingNote')}
      </p>
    </article>
  );
}
