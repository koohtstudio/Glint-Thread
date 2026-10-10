'use client'

import { useState, type FormEvent } from 'react'
import { addressInputSchema } from '@/lib/account/schemas'
import type { Address } from '@/lib/account/types'
import { t } from '@/lib/i18n'
import { toast } from '@/lib/toast'
import { AddressFields, EMPTY_ADDRESS, type AddressValues } from './address-fields'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/field'

function issues(list: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of list) {
    const key = String(i.path[0] ?? '_')
    if (!(key in out)) out[key] = i.message
  }
  return out
}

const toValues = (a: Address): AddressValues => ({
  label: a.label,
  name: a.name,
  line1: a.line1,
  line2: a.line2,
  city: a.city,
  province: a.province,
  postalCode: a.postalCode,
  phone: a.phone,
})

/** Saved addresses (PRD 9.9): list, add, edit, remove, choose the default. Validated with the shared Zod schema. */
export function AddressManager({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState(initial)
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [values, setValues] = useState<AddressValues>(EMPTY_ADDRESS)
  const [makeDefault, setMakeDefault] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const open = (target: string | 'new') => {
    const current = addresses.find((a) => a.id === target)
    setValues(current ? toValues(current) : EMPTY_ADDRESS)
    setMakeDefault(current?.isDefault ?? addresses.length === 0)
    setErrors({})
    setEditing(target)
  }

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as {
      addresses?: Address[]
      fields?: Record<string, string>
    }
    return { ok: Boolean(res?.ok), status: res?.status ?? 0, data }
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = addressInputSchema.safeParse(values)
    if (!parsed.success) return setErrors(issues(parsed.error.issues))
    setErrors({})
    setBusy(true)
    const isNew = editing === 'new'
    const res = await call(
      isNew ? '/api/account/addresses' : `/api/account/addresses/${editing}`,
      isNew ? 'POST' : 'PUT',
      { ...parsed.data, isDefault: makeDefault },
    )
    setBusy(false)
    if (res.ok && res.data.addresses) {
      setAddresses(res.data.addresses)
      setEditing(null)
      toast(t('account.addressSaved'))
    } else if (res.data.fields) setErrors(res.data.fields)
    else toast(t('account.saveError'), 'error')
  }

  const remove = async (id: string) => {
    const res = await call(`/api/account/addresses/${id}`, 'DELETE')
    if (res.ok && res.data.addresses) {
      setAddresses(res.data.addresses)
      toast(t('account.addressRemoved'))
    } else toast(t('account.saveError'), 'error')
  }

  const setDefault = async (a: Address) => {
    const parsed = addressInputSchema.safeParse(toValues(a))
    if (!parsed.success) return open(a.id)
    const res = await call(`/api/account/addresses/${a.id}`, 'PUT', {
      ...parsed.data,
      isDefault: true,
    })
    if (res.ok && res.data.addresses) setAddresses(res.data.addresses)
    else toast(t('account.saveError'), 'error')
  }

  return (
    <div className="max-w-3xl">
      {addresses.length ? (
        <ul className="grid gap-4 sm:grid-cols-2" data-testid="address-list">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col border border-line bg-ink-900 p-6">
              <p className="eyebrow">{a.isDefault ? t('account.isDefault') : a.label || ' '}</p>
              <address className="mt-3 flex-1 text-[15px] leading-relaxed text-bone-300 not-italic">
                <span className="text-bone-50">{a.name}</span>
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city} {a.province} {a.postalCode}
                {a.phone ? (
                  <>
                    <br />
                    {a.phone}
                  </>
                ) : null}
              </address>
              <div className="mt-5 flex flex-wrap gap-x-5 text-[13px]">
                <button
                  type="button"
                  onClick={() => open(a.id)}
                  className="min-h-11 underline underline-offset-4 hover:text-champagne-400"
                >
                  {t('account.editAddress')}
                </button>
                {!a.isDefault ? (
                  <button
                    type="button"
                    onClick={() => void setDefault(a)}
                    className="min-h-11 underline underline-offset-4 hover:text-champagne-400"
                  >
                    {t('account.setDefault')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void remove(a.id)}
                  className="min-h-11 text-bone-500 underline underline-offset-4 hover:text-bone-50"
                >
                  {t('account.deleteAddress')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] text-bone-300" data-testid="no-addresses">
          {t('account.noAddresses')}
        </p>
      )}

      {editing ? (
        <form
          onSubmit={save}
          noValidate
          className="mt-10 border-t border-line pt-10"
          aria-label={t('account.addAddress')}
        >
          <AddressFields
            idPrefix="account-address"
            showLabel
            values={values}
            errors={errors}
            onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
          />
          <Checkbox
            className="mt-8"
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
            label={t('account.makeDefault')}
          />
          <div className="mt-8 flex gap-4">
            <Button type="submit" loading={busy} loadingLabel={t('account.saving')}>
              {t('account.saveAddress')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              {t('account.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="secondary"
          className="mt-8"
          onClick={() => open('new')}
          data-testid="add-address"
        >
          {t('account.addAddress')}
        </Button>
      )}
    </div>
  )
}
