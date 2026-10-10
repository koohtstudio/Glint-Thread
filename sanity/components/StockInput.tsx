import { Stack, Text } from '@sanity/ui'
import type { NumberInputProps } from 'sanity'

/** Stock input that explains empty values: launch is blocked until every variant has a number (PRD 7.1). */
export function StockInput(props: NumberInputProps) {
  return (
    <Stack gap={2}>
      {props.renderDefault(props)}
      {typeof props.value !== 'number' ? (
        <Text size={1} muted>
          Not counted yet. The launch check fails until this has a number.
        </Text>
      ) : props.value < 0 ? (
        <Text size={1}>Below zero: an oversell. Check the order flagged Needs review.</Text>
      ) : null}
    </Stack>
  )
}
