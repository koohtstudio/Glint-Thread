'use client'

import { PROVINCES } from '@/lib/geo'
import { t } from '@/lib/i18n'
import { Input, Select } from '@/components/ui/field'

export interface AddressValues {
  label?: string
  name: string
  line1: string
  line2: string
  city: string
  province: string
  postalCode: string
  phone: string
}

export const EMPTY_ADDRESS: AddressValues = {
  label: '',
  name: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  postalCode: '',
  phone: '',
}

/**
 * The Canadian address fields, shared by checkout and the saved-address form (PRD 6.4). Controlled; errors come
 * from the shared Zod schema, so client and server agree on the rules.
 */
export function AddressFields({
  values,
  errors,
  onChange,
  showLabel = false,
  idPrefix,
  autoCompleteSection = 'shipping',
}: {
  values: AddressValues
  errors: Record<string, string>
  onChange: (field: keyof AddressValues, value: string) => void
  showLabel?: boolean
  idPrefix: string
  autoCompleteSection?: string
}) {
  const ac = (token: string) => `${autoCompleteSection} ${token}`
  const set =
    (field: keyof AddressValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange(field, e.target.value)
  return (
    <div className="grid gap-x-5 gap-y-7 sm:grid-cols-6">
      {showLabel ? (
        <Input
          id={`${idPrefix}-label`}
          label={t('account.addressLabel')}
          hint={t('account.addressLabelHint')}
          wrapperClassName="sm:col-span-6"
          value={values.label ?? ''}
          onChange={set('label')}
          error={errors.label}
          maxLength={40}
        />
      ) : null}
      <Input
        id={`${idPrefix}-name`}
        label={t('checkout.fullName')}
        autoComplete={ac('name')}
        wrapperClassName="sm:col-span-6"
        value={values.name}
        onChange={set('name')}
        error={errors.name}
        required
      />
      <Input
        id={`${idPrefix}-line1`}
        label={t('checkout.line1')}
        autoComplete={ac('address-line1')}
        wrapperClassName="sm:col-span-6"
        value={values.line1}
        onChange={set('line1')}
        error={errors.line1}
        required
      />
      <Input
        id={`${idPrefix}-line2`}
        label={t('checkout.line2')}
        autoComplete={ac('address-line2')}
        wrapperClassName="sm:col-span-6"
        value={values.line2}
        onChange={set('line2')}
        error={errors.line2}
      />
      <Input
        id={`${idPrefix}-city`}
        label={t('checkout.city')}
        autoComplete={ac('address-level2')}
        wrapperClassName="sm:col-span-3"
        value={values.city}
        onChange={set('city')}
        error={errors.city}
        required
      />
      <Select
        id={`${idPrefix}-province`}
        label={t('checkout.province')}
        placeholder={t('checkout.provincePlaceholder')}
        autoComplete={ac('address-level1')}
        wrapperClassName="sm:col-span-3"
        value={values.province}
        onChange={set('province')}
        error={errors.province}
        options={PROVINCES.map((p) => ({ value: p.code, label: p.name }))}
        required
      />
      <Input
        id={`${idPrefix}-postal`}
        label={t('checkout.postalCode')}
        autoComplete={ac('postal-code')}
        wrapperClassName="sm:col-span-3"
        value={values.postalCode}
        onChange={set('postalCode')}
        error={errors.postalCode}
        maxLength={8}
        autoCapitalize="characters"
        required
      />
      <Input
        id={`${idPrefix}-phone`}
        label={t('checkout.phone')}
        hint={t('checkout.phoneHint')}
        type="tel"
        inputMode="tel"
        autoComplete={ac('tel')}
        wrapperClassName="sm:col-span-3"
        value={values.phone}
        onChange={set('phone')}
        error={errors.phone}
        required
      />
      <p className="eyebrow sm:col-span-6">{t('checkout.canadaOnly')}</p>
    </div>
  )
}
