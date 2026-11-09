import { useRef, useState } from 'react';

/**
 * The popover or sheet a picker opens: titled with the field's label, and closing it counts as leaving the
 * field, so a form marks it visited after the pick.
 * @param fallbackTitle the sheet's title when the field has no label
 * @param onOpen called as it opens, to start the pick from the field's value
 * @param onBlur the field's blur
 */
export function usePickerPopup(fallbackTitle: string, onOpen: () => void, onBlur?: () => void) {
  const input = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  return {
    input,
    isOpen,
    title,
    changeOpen: (open: boolean) => {
      if (open) {
        onOpen();
        setTitle(input.current?.labels?.[0]?.textContent ?? fallbackTitle);
      }

      setOpen(open);

      if (!open) {
        onBlur?.();
      }
    },
  };
}

export type PickerPopup = ReturnType<typeof usePickerPopup>;
