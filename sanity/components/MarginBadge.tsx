import { Badge, Card, Flex, Stack, Text } from '@sanity/ui'
import { useFormValue, type NumberInputProps } from 'sanity'
import { PriceInput } from './PriceInput'

/**
 * Unit cost input with a margin badge (PRD 7.2): landed cost must be at most 35% of price, and the
 * Studio warns under a 60% gross margin. Unit cost is private: never part of the storefront projection.
 */
export function UnitCostInput(props: NumberInputProps) {
  const price = useFormValue(['price']) as number | undefined
  const cost = typeof props.value === 'number' ? props.value : null
  const margin = price && cost !== null ? (price - cost) / price : null
  const tone =
    margin === null
      ? 'default'
      : margin >= 0.65
        ? 'positive'
        : margin >= 0.6
          ? 'caution'
          : 'critical'
  return (
    <Stack gap={3}>
      <PriceInput {...props} />
      {margin !== null ? (
        <Card padding={3} radius={2} tone={tone} border>
          <Flex align="center" gap={3}>
            <Badge tone={tone} fontSize={1}>
              {Math.round(margin * 100)}% margin
            </Badge>
            <Text size={1}>
              Landed cost is {Math.round((1 - margin) * 100)}% of price.{' '}
              {margin < 0.6
                ? 'Below the 60% gross margin guardrail.'
                : margin < 0.65
                  ? 'Close to the 35% landed-cost limit.'
                  : 'Within the guardrail.'}
            </Text>
          </Flex>
        </Card>
      ) : (
        <Text size={1} muted>
          Enter the landed unit cost (unit + freight + duty) to see the margin.
        </Text>
      )}
    </Stack>
  )
}
