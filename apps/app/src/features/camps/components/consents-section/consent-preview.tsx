import { useTranslation } from 'react-i18next';

import type { ConsentItem } from '@repo/schema/consents';

import { Checkbox } from '@/components/ui/checkbox';

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
    <article className="flex flex-col gap-4 rounded-[20px] border border-border bg-background p-4 sm:p-5">
      <h4 className="font-display text-lg leading-tight font-bold break-words">{title}</h4>
      {introduction === '' ? null : <p className="whitespace-pre-line">{introduction}</p>}
      {fileUrl === null ? null : (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="self-start font-semibold underline underline-offset-4 hover:text-brand-text"
        >
          {t('consents.readPdf')}
        </a>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-card p-3">
            <p className="whitespace-pre-line">{item.text}</p>
            {item.kind === 'must_agree' ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox disabled />
                {t('consents.agree')}
              </label>
            ) : null}
            {item.kind === 'yes_no' ? (
              <span className="flex gap-5 text-sm text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input type="radio" disabled className="size-4 accent-primary" />
                  {t('consents.yes')}
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" disabled className="size-4 accent-primary" />
                  {t('consents.no')}
                </label>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-muted-foreground">
        {withdrawable ? t('consents.withdrawableNote') : t('consents.bindingNote')}
      </p>
    </article>
  );
}
