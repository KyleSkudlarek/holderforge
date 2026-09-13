// Snapshot the public data of the Etsy shop into docs/etsy/ so the site copy
// can be written against the live listing language without opening Etsy.
//
// Usage: npm run etsy:pull
//
// Auth: the x-api-key header is "keystring:shared_secret" from the Seller App
// (Etsy rejects the keystring alone). Read from ETSY_API_KEY, else from SSM
// /holderforge/staging/etsy/api_key via the AWS CLI. Only API-key endpoints
// are used, so drafts, inactive listings and variant inventory are not
// included; those need OAuth (listings_r).

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SHOP_ID = 55988004 // SkudsWorkshop
const API = 'https://openapi.etsy.com/v3/application'
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'etsy')

function apiKey() {
  if (process.env.ETSY_API_KEY) return process.env.ETSY_API_KEY
  return execFileSync(
    'aws',
    ['ssm', 'get-parameter', '--name', '/holderforge/staging/etsy/api_key', '--with-decryption', '--query', 'Parameter.Value', '--output', 'text'],
    { encoding: 'utf8' },
  ).trim()
}

const headers = { 'x-api-key': apiKey() }

async function get(path, params = {}) {
  const url = new URL(API + path)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${path}: ${await res.text()}`)
  return res.json()
}

async function activeListingIds() {
  const ids = []
  for (let offset = 0; ; offset += 100) {
    const page = await get(`/shops/${SHOP_ID}/listings/active`, { limit: 100, offset })
    ids.push(...page.results.map((l) => l.listing_id))
    if (ids.length >= page.count || page.results.length === 0) return ids
  }
}

const decode = (s) => (s ?? '').replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&')
const money = (p) => `${(p.amount / p.divisor).toFixed(2)} ${p.currency_code}`

function markdown(shop, listings) {
  const lines = [
    `# ${shop.shop_name} on Etsy`,
    '',
    `Snapshot of ${shop.url} taken ${new Date().toISOString().slice(0, 10)} by \`npm run etsy:pull\`. Do not edit by hand.`,
    '',
    `- Shop title: ${shop.title}`,
    `- Active listings: ${shop.listing_active_count}, sold: ${shop.transaction_sold_count}, reviews: ${shop.review_count} (avg ${shop.review_average})`,
    '',
    '## Announcement',
    '',
    decode(shop.announcement),
    '',
    '## Sale message',
    '',
    decode(shop.sale_message),
    '',
    '## Listings',
    '',
  ]
  for (const l of listings) {
    lines.push(`### ${decode(l.title)}`, '')
    lines.push(`- Listing ${l.listing_id}: ${l.url}`)
    lines.push(`- Price: ${money(l.price)}${l.quantity != null ? `, quantity ${l.quantity}` : ''}`)
    lines.push(`- Views ${l.views}, favourites ${l.num_favorers}`)
    if (l.tags?.length) lines.push(`- Tags: ${l.tags.join(', ')}`)
    if (l.materials?.length) lines.push(`- Materials: ${l.materials.join(', ')}`)
    if (l.production_partners?.length) lines.push(`- Production partners: ${l.production_partners.map((p) => p.partner_name).join(', ')}`)
    if (l.personalization_instructions) lines.push(`- Personalization: ${decode(l.personalization_instructions)}`)
    if (l.inventory?.products?.length) {
      const variants = l.inventory.products.map((p) => {
        const props = p.property_values.map((v) => `${v.property_name}: ${v.values.join('/')}`).join(', ')
        return `${props || 'default'} = ${money(p.offerings[0].price)}`
      })
      lines.push(`- Variants: ${variants.join('; ')}`)
    }
    if (l.images?.length) {
      lines.push('- Images:')
      for (const img of l.images) lines.push(`  - ${img.url_fullxfull}`)
    }
    lines.push('', decode(l.description), '')
  }
  return lines.join('\n')
}

const shop = await get(`/shops/${SHOP_ID}`)
const ids = await activeListingIds()
const listings = []
for (let i = 0; i < ids.length; i += 100) {
  const batch = await get('/listings/batch', {
    listing_ids: ids.slice(i, i + 100).join(','),
    includes: 'Images,Videos,Personalization',
  })
  listings.push(...batch.results)
}
listings.sort((a, b) => a.listing_id - b.listing_id)

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'shop.json'), JSON.stringify(shop, null, 2) + '\n')
writeFileSync(join(OUT_DIR, 'listings.json'), JSON.stringify(listings, null, 2) + '\n')
writeFileSync(join(OUT_DIR, 'listings.md'), markdown(shop, listings))
console.log(`Wrote ${listings.length} listings to ${OUT_DIR}`)
