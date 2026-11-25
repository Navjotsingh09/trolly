import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public demonstration catalogue; never exposes credentials or customer data. */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: 'Database connection not configured' }, { status: 503 });
  }

  try {
    const sql = neon(url);
    const [products, variants, retailers, counts] = await Promise.all([
      sql`SELECT id, name, category, pack_label, base_pence, emoji, measure, measure_unit, gtin
          FROM public.products WHERE is_active = true ORDER BY name`,
      sql`SELECT product_id, variant_id, label, measure, price_factor
          FROM public.product_variants ORDER BY product_id, variant_id`,
      sql`SELECT id, name, loyalty_scheme FROM public.retailers WHERE is_active = true ORDER BY name`,
      sql`SELECT count(*)::integer AS total FROM public.retailer_prices WHERE source = 'fictional-demonstration'`
    ]);
    const byProduct = new Map<string, { id: string; label: string; measure: number; priceFactor: number }[]>();
    for (const v of variants) {
      const key = String(v.product_id);
      const arr = byProduct.get(key) || [];
      arr.push({ id: String(v.variant_id), label: String(v.label), measure: Number(v.measure), priceFactor: Number(v.price_factor) });
      byProduct.set(key, arr);
    }
    const catalogue = products.map((p, i) => ({
      id: String(p.id),
      name: String(p.name),
      category: String(p.category),
      pack: String(p.pack_label),
      basePence: Number(p.base_pence),
      emoji: String(p.emoji || '🛒'),
      measure: Number(p.measure),
      unit: String(p.measure_unit),
      gtin: p.gtin ? String(p.gtin) : null,
      variants: byProduct.get(String(p.id)) || [],
      tiers: ['Value', 'Own-label', 'Branded'] as const,
      demoIndex: i
    }));
    return NextResponse.json({
      catalogue,
      retailers: retailers.map(r => ({ id: r.id, name: r.name, loyaltyScheme: r.loyalty_scheme })),
      metadata: { provider: 'neon', source: 'fictional-demonstration', products: catalogue.length, fictionalPriceRows: counts[0]?.total ?? 0 }
    }, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' } });
  } catch (error) {
    console.error('TrolleyScout catalogue query failed', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Catalogue temporarily unavailable' }, { status: 503 });
  }
}
