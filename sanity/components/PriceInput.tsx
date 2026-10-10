import { Flex, Stack, Text, TextInput } from '@sanity/ui'
import { useCallback, useState } from 'react'
import { set, unset, type NumberInputProps } from 'sanity'

/**
 * Dollars <-> cents input (PRD 10). The owner types "11.99"; the document stores 1199 (integer cents).
 * Warns when a price does not end in .99 (PRD 7.2), without blocking.
 */
export function PriceInput(props: NumberInputProps) {
  const { value, onChange, elementProps } = props
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (typeof value === 'number' ? (value / 100).toFixed(2) : '')

  const commit = useCallback(
    (raw: string) => {
      const clean = raw.replace(/[$,\s]/g, '')
      if (!clean) return onChange(unset())
      if (!/^\d+(\.\d{0,2})?$/.test(clean)) return
      const [whole, frac = ''] = clean.split('.')
      onChange(set(Number(whole) * 100 + Number(frac.padEnd(2, '0'))))
    },
    [onChange],
  )

  const cents = typeof value === 'number' ? value : null
  return (
    <Stack gap={2}>
      <Flex align="center" gap={2}>
        <Text size={2} muted>
          $
        </Text>
        <TextInput
          {...elementProps}
          inputMode="decimal"
          value={shown}
          onChange={(e) => {
            setDraft(e.currentTarget.value)
            commit(e.currentTarget.value)
          }}
          onBlur={(e) => {
            setDraft(null)
            elementProps.onBlur?.(e)
          }}
        />
        <Text size={1} muted>
          CAD
        </Text>
      </Flex>
      {cents !== null && cents > 0 && cents % 100 !== 99 ? (
        <Text size={1} muted>
          Store prices end in .99 (PRD 7.2). Stored as {cents} cents.
        </Text>
      ) : cents !== null ? (
        <Text size={1} muted>
          Stored as {cents} cents.
        </Text>
      ) : null}
    </Stack>
  )
}
