import { useState } from 'react';

type MoreActionsDialog = 'move' | 'cancel' | 'erase';

// Which of the menu's dialogs is open; each dialog is driven by its `open` and `onOpenChange`.
export function useMoreActions() {
  const [dialog, setDialog] = useState<MoreActionsDialog | null>(null);

  return {
    openDialog: setDialog,
    dialogProps: (name: MoreActionsDialog) => ({
      open: dialog === name,
      onOpenChange: (open: boolean) => setDialog(open ? name : null),
    }),
  };
}
