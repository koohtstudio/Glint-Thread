import { Card, Stack, Text } from '@sanity/ui'
import { useFormValue, type StringInputProps } from 'sanity'

/**
 * Warning panel (PRD 7.1): facts the photos could not confirm, plus reshoot notes. Studio only;
 * the storefront never shows these. Rendered as the input for the `photoNote` field.
 */
export function VerifyPanel(props: StringInputProps) {
  const verify = (useFormValue(['verify']) as string[] | undefined) ?? []
  const photoNote = props.value
  if (!verify.length && !photoNote) return props.renderDefault(props)
  return (
    <Stack gap={3}>
      <Card padding={4} radius={2} tone="caution" border>
        <Stack gap={3}>
          <Text size={1} weight="semibold">
            Needs attention before launch
          </Text>
          {verify.map((v) => (
            <Text key={v} size={1}>
              To verify: {v}
            </Text>
          ))}
          {photoNote ? <Text size={1}>Photo: {photoNote}</Text> : null}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}
