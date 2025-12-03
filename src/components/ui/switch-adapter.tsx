import { Switch as HeadlessSwitch } from './switch'
import type { ComponentProps } from 'react'

/**
 * Adapter component to bridge Radix UI Switch API to Headless UI Switch API
 * Radix UI uses: checked, onCheckedChange
 * Headless UI uses: checked, onChange
 */
export function Switch({
  checked,
  onCheckedChange,
  ...props
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
} & Omit<ComponentProps<typeof HeadlessSwitch>, 'checked' | 'onChange'>) {
  return (
    <HeadlessSwitch
      checked={checked}
      onChange={onCheckedChange}
      {...props}
    />
  )
}

