import { useId } from 'react';

import { FileButton } from '@/components/file-button';

interface FileUploadButtonProps {
  label: string;
  hint: string;
  // The main action in the brand colour; otherwise an outline button.
  primary: boolean;
  disabled: boolean;
  onChoose: (file: File) => void;
}

// The guardian's upload: a full-width pill with the allowed types and size under it.
export function FileUploadButton({ label, hint, primary, disabled, onChoose }: FileUploadButtonProps) {
  const hintId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <FileButton
        label={label}
        variant={primary ? 'brand' : 'outline'}
        size="lg"
        accept="application/pdf,image/jpeg,image/png"
        disabled={disabled}
        describedBy={hintId}
        onFile={onChoose}
        className="h-auto min-h-13 w-full py-2 text-center whitespace-normal [&_svg]:size-5"
      />
      <p id={hintId} className="text-center text-[13px] text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}
