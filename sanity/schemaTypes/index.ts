import {
  altImage,
  callout,
  faq,
  link,
  provinceTax,
  richText,
  seo,
  shippingMethod,
  taxComponent,
} from './objects'
import { product, variant } from './product'
import { category, collection, department } from './taxonomy'
import { order, promoCode, promotion } from './commerce'
import { careGuide, homePage, page, siteSettings } from './content'

export const schemaTypes = [
  // objects
  seo,
  link,
  altImage,
  callout,
  richText,
  faq,
  shippingMethod,
  taxComponent,
  provinceTax,
  variant,
  // documents
  product,
  department,
  category,
  collection,
  promotion,
  promoCode,
  order,
  careGuide,
  page,
  homePage,
  siteSettings,
]

export const SINGLETONS = ['homePage', 'siteSettings']
