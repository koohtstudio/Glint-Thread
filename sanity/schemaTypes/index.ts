import { altImage, callout, faq, link, richText, seo, shippingMethod } from './objects'
import { product, variant } from './product'
import { category, collection, department } from './taxonomy'
import { order, promoCode, promotion, subscriber } from './commerce'
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
  variant,
  // documents
  product,
  department,
  category,
  collection,
  promotion,
  promoCode,
  order,
  subscriber,
  careGuide,
  page,
  homePage,
  siteSettings,
]

export const SINGLETONS = ['homePage', 'siteSettings']
