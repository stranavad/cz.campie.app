import { cn } from '@/lib/utils';

interface SettingSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

// An on/off setting as a row with a switch. A native checkbox underneath, so a disabled fieldset, the
// keyboard and screen readers all work without JavaScript of its own; the knob moves by transform.
export function SettingSwitch({ label, description, checked, onCheckedChange, className }: SettingSwitchProps) {
  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3.5 has-disabled:cursor-not-allowed has-disabled:opacity-60',
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="font-semibold">{label}</span>
        {description === undefined ? null : <span className="text-[13px] text-muted-foreground">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className="flex h-7 w-12 shrink-0 rounded-full bg-input p-[3px] transition-colors duration-150 peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-checked:*:translate-x-5 peer-checked:*:bg-primary-foreground"
      >
        <span className="size-[22px] rounded-full bg-card transition-transform duration-150" />
      </span>
    </label>
  );
}
