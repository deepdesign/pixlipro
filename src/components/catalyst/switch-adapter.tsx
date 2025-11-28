import { Switch as CatalystSwitch } from './switch'
import type { ComponentProps } from 'react'

/**
 * Adapter component to bridge Radix UI Switch API to Catalyst Switch API (Headless UI)
 * Radix UI uses: checked, onCheckedChange
 * Catalyst uses: checked, onChange
 */
export function Switch({
  checked,
  onCheckedChange,
  ...props
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
} & Omit<ComponentProps<typeof CatalystSwitch>, 'checked' | 'onChange'>) {
  return (
    <CatalystSwitch
      checked={checked}
      onChange={onCheckedChange}
      {...props}
    />
  )
}

