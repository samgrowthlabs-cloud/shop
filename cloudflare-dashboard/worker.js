const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
};
const enc = new TextEncoder();
const BUILT_IN_ORIGINS = ["https://shoplab.samgrowthlabs.com.br"];

function allowedOrigins(env) {
  return [
    ...new Set([
      ...BUILT_IN_ORIGINS,
      ...String(env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean),
    ]),
  ];
}

export default {
  async fetch(request, env, ctx) {
    const requestId = crypto.randomUUID();
    try {
      return await route(request, env, ctx, requestId);
    } catch (error) {
      const detail = String(error?.message || "unknown");
      console.error(
        JSON.stringify({ requestId, error: detail, stack: error?.stack }),
      );
      if (
        /no such column:.*(?:base_price_cents|compare_at_price_cents)/i.test(
          detail,
        )
      )
        return respond(
          request,
          env,
          {
            success: false,
            data: null,
            meta: null,
            error: {
              code: "DATABASE_MIGRATION_REQUIRED",
              message:
                "Execute product-pricing-upgrade.sql no banco D1 e publique novamente.",
              requestId,
            },
          },
          503,
        );
      if (/no such table:.*(?:banners|seasonal_themes)/i.test(detail))
        return respond(
          request,
          env,
          {
            success: false,
            data: null,
            meta: null,
            error: {
              code: "SITE_CUSTOMIZATION_MIGRATION_REQUIRED",
              message:
                "Execute site-customization-upgrade.sql no banco D1 e publique novamente.",
              requestId,
            },
          },
          503,
        );
      if (
        /no such column:.*(?:header_background_end|header_gradient_enabled|header_gradient_angle|header_media_storage_key|header_media_opacity|header_media_position|header_media_size|header_media_scale|header_media_repeat|logo_text_color|logo_height)/i.test(
          detail,
        )
      )
        return respond(
          request,
          env,
          {
            success: false,
            data: null,
            meta: null,
            error: {
              code: "HEADER_THEME_MEDIA_MIGRATION_REQUIRED",
              message:
                "Execute as migrações de mídia do tema no banco D1 e publique novamente.",
              requestId,
            },
          },
          503,
        );
      if (/UNIQUE constraint failed/i.test(detail))
        return respond(
          request,
          env,
          {
            success: false,
            data: null,
            meta: null,
            error: {
              code: "DUPLICATE_VALUE",
              message:
                "Já existe outro registro com este slug ou identificador.",
              requestId,
            },
          },
          409,
        );
      return respond(
        request,
        env,
        {
          success: false,
          data: null,
          meta: null,
          error: {
            code: "INTERNAL_ERROR",
            message:
              "Erro interno ao salvar. Consulte os logs usando o requestId.",
            requestId,
          },
        },
        500,
      );
    }
  },
};

async function route(request, env, ctx, requestId) {
  const url = new URL(request.url),
    path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS")
    return cors(request, env, new Response(null, { status: 204 }));
  if (path === "/api/v1/health")
    return ok(request, env, { status: "ok" }, requestId);
  if (request.method === "GET" && path === "/api/v1/categories")
    return listCategories(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/site-config")
    return publicSiteConfig(request, env, requestId);
  if (request.method === "GET" && /^\/share\/[^/]+$/.test(path))
    return shareProductPage(
      request,
      env,
      decodeURIComponent(path.split("/").pop()),
    );
  if (request.method === "GET" && path === "/api/v1/promotions")
    return publicPromotions(request, env, requestId);
  if (request.method === "GET" && /^\/api\/v1\/promotions\/[^/]+$/.test(path))
    return publicPromotionDetail(
      request,
      env,
      decodeURIComponent(path.split("/").pop()),
      requestId,
    );
  if (request.method === "GET" && path === "/api/v1/products/trending")
    return trendingProducts(request, env, url, requestId);
  if (
    request.method === "GET" &&
    /^\/api\/v1\/products\/[^/]+\/related$/.test(path)
  )
    return relatedProducts(
      request,
      env,
      decodeURIComponent(path.split("/").at(-2)),
      requestId,
    );
  if (request.method === "GET" && path === "/api/v1/products")
    return listProductsV2(request, env, url, requestId);
  if (request.method === "GET" && path.startsWith("/api/v1/products/"))
    return getProductV2(
      request,
      env,
      decodeURIComponent(path.split("/").pop()),
      requestId,
    );
  if (request.method === "GET" && path === "/api/v1/search")
    return searchV2(request, env, url, ctx, requestId);
  if (request.method === "GET" && path === "/api/v1/search/suggestions")
    return suggestionsV2(request, env, url, requestId);
  if (request.method === "GET" && path === "/api/v1/search/trending")
    return trendingSearches(request, env, requestId);
  if (request.method === "GET" && path.startsWith("/go/"))
    return redirectOffer(request, env, path, ctx);
  if (request.method === "GET" && path.startsWith("/media/"))
    return serveMedia(request, env, decodeURIComponent(path.slice(7)));
  if (request.method === "POST" && path === "/api/v1/events")
    return recordEvent(request, env, ctx, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/auth/login")
    return login(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/auth/logout")
    return logout(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/auth/session")
    return sessionStatus(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/dashboard")
    return adminDashboard(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/products")
    return adminProducts(request, env, url, requestId);
  if (
    request.method === "GET" &&
    /^\/api\/v1\/admin\/products\/[^/]+$/.test(path)
  )
    return adminProductDetail(request, env, path.split("/").pop(), requestId);
  if (
    request.method === "POST" &&
    /^\/api\/v1\/admin\/products\/[^/]+\/media$/.test(path)
  )
    return uploadProductMedia(request, env, path.split("/").at(-2), requestId);
  if (request.method === "PUT" && /^\/api\/v1\/admin\/media\/[^/]+$/.test(path))
    return updateProductMedia(request, env, path.split("/").pop(), requestId);
  if (
    request.method === "DELETE" &&
    /^\/api\/v1\/admin\/media\/[^/]+$/.test(path)
  )
    return deleteProductMedia(request, env, path.split("/").pop(), requestId);
  if (
    request.method === "PUT" &&
    /^\/api\/v1\/admin\/products\/[^/]+\/offers$/.test(path)
  )
    return saveProductOffers(request, env, path.split("/").at(-2), requestId);
  if (request.method === "GET" && path === "/api/v1/admin/promotions")
    return adminPromotions(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/promotions")
    return createPromotion(request, env, requestId);
  if (request.method === "PUT" && path.startsWith("/api/v1/admin/promotions/"))
    return updatePromotion(request, env, path.split("/").pop(), requestId);
  if (
    request.method === "DELETE" &&
    path.startsWith("/api/v1/admin/promotions/")
  )
    return deletePromotion(request, env, path.split("/").pop(), requestId);
  if (request.method === "GET" && path === "/api/v1/admin/categories")
    return adminCategories(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/categories")
    return createCategory(request, env, requestId);
  if (request.method === "PUT" && path.startsWith("/api/v1/admin/categories/"))
    return updateCategory(request, env, path.split("/").pop(), requestId);
  if (
    request.method === "DELETE" &&
    path.startsWith("/api/v1/admin/categories/")
  )
    return deleteCategory(request, env, path.split("/").pop(), requestId);
  if (request.method === "GET" && path === "/api/v1/admin/partners")
    return adminPartners(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/partners")
    return createPartner(request, env, requestId);
  if (request.method === "PUT" && path.startsWith("/api/v1/admin/partners/"))
    return updatePartner(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && path.startsWith("/api/v1/admin/partners/"))
    return deletePartner(request, env, path.split("/").pop(), requestId);
  if (request.method === "GET" && path === "/api/v1/admin/banners")
    return adminBanners(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/banners")
    return createBanner(request, env, requestId);
  if (request.method === "PUT" && path.startsWith("/api/v1/admin/banners/"))
    return updateBanner(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && path.startsWith("/api/v1/admin/banners/"))
    return deleteBanner(request, env, path.split("/").pop(), requestId);
  if (request.method === "GET" && path === "/api/v1/admin/themes")
    return adminThemes(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/themes")
    return createTheme(request, env, requestId);
  if (
    request.method === "POST" &&
    /^\/api\/v1\/admin\/themes\/[^/]+\/header-media$/.test(path)
  )
    return uploadThemeHeaderMedia(
      request,
      env,
      path.split("/").at(-2),
      requestId,
    );
  if (
    request.method === "POST" &&
    /^\/api\/v1\/admin\/themes\/[^/]+\/logo-media$/.test(path)
  )
    return uploadThemeLogoMedia(
      request,
      env,
      path.split("/").at(-2),
      requestId,
    );
  if (request.method === "PUT" && path.startsWith("/api/v1/admin/themes/"))
    return updateTheme(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && path.startsWith("/api/v1/admin/themes/"))
    return deleteTheme(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && path.startsWith("/api/v1/admin/products/"))
    return deleteProduct(request, env, path.split("/").pop(), requestId);
  if (path === "/api/v1/admin/products" && request.method === "POST")
    return createProductV2(request, env, requestId);
  if (path.startsWith("/api/v1/admin/products/") && request.method === "PUT")
    return updateProductV2(request, env, path.split("/").pop(), requestId);
  return fail(request, env, "NOT_FOUND", "Rota não encontrada", 404, requestId);
}

async function listCategories(req, env, id) {
  const { results } = await env.DB.prepare(
    `SELECT c.id,c.name,c.slug,c.description,c.icon,COUNT(p.id) count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.status='published' WHERE c.is_active=1 GROUP BY c.id ORDER BY c.sort_order,c.name`,
  ).all();
  return ok(req, env, results, id);
}

async function publicSiteConfig(req, env, id) {
  const [banners, theme] = await env.DB.batch([
    env.DB.prepare(
      `SELECT id,name,eyebrow,title,message,button_text buttonText,link_url linkUrl,desktop_storage_key desktopStorageKey,mobile_storage_key mobileStorageKey,alt_text altText FROM banners WHERE is_active=1 AND (starts_at IS NULL OR datetime(starts_at)<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR datetime(ends_at)>=CURRENT_TIMESTAMP) ORDER BY sort_order,created_at DESC`,
    ),
    env.DB.prepare(
      `SELECT id,name,holiday,header_background headerBackground,header_background_end headerBackgroundEnd,header_gradient_enabled headerGradientEnabled,header_gradient_angle headerGradientAngle,header_text_color headerTextColor,accent_color accentColor,page_text_color pageTextColor,muted_text_color mutedTextColor,logo_text logoText,logo_text_color logoTextColor,logo_height logoHeight,logo_storage_key logoStorageKey,logo_hover_storage_key logoHoverStorageKey,header_media_storage_key headerMediaStorageKey,header_media_opacity headerMediaOpacity,header_media_position headerMediaPosition,CASE WHEN lower(header_media_storage_key) LIKE '%.gif' AND header_media_size='cover' THEN 'contain' ELSE header_media_size END headerMediaSize,header_media_scale headerMediaScale,header_media_repeat headerMediaRepeat FROM seasonal_themes WHERE is_active=1 AND (starts_at IS NULL OR datetime(starts_at)<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR datetime(ends_at)>=CURRENT_TIMESTAMP) LIMIT 1`,
    ),
  ]);
  const origin = new URL(req.url).origin;
  const mediaUrl = (key) =>
    key ? `${origin}/media/${encodeURIComponent(key)}` : null;
  const response = ok(
    req,
    env,
    {
      banners: (banners.results || []).map((banner) => ({
        ...banner,
        desktopImageUrl: mediaUrl(banner.desktopStorageKey),
        mobileImageUrl: mediaUrl(
          banner.mobileStorageKey || banner.desktopStorageKey,
        ),
      })),
      theme: theme.results?.[0]
        ? {
            ...theme.results[0],
            headerMediaUrl: mediaUrl(theme.results[0].headerMediaStorageKey),
            logoUrl: mediaUrl(theme.results[0].logoStorageKey),
            logoHoverUrl: mediaUrl(theme.results[0].logoHoverStorageKey),
          }
        : null,
    },
    id,
  );
  response.headers.set("cache-control", "no-store, max-age=0");
  return response;
}

function htmlAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function shareProductPage(req, env, slug) {
  const product = await env.DB.prepare(
    `SELECT p.id,p.name,p.short_description shortDescription,
      (SELECT pm.storage_key FROM product_media pm WHERE pm.product_id=p.id AND pm.type='image' ORDER BY pm.is_primary DESC,pm.sort_order,pm.created_at LIMIT 1) storageKey,
      (SELECT pm.external_url FROM product_media pm WHERE pm.product_id=p.id AND pm.type='image' ORDER BY pm.is_primary DESC,pm.sort_order,pm.created_at LIMIT 1) externalUrl
    FROM products p WHERE p.slug=? AND p.status='published'`,
  )
    .bind(slug)
    .first();
  if (!product) return new Response("Produto não encontrado", { status: 404 });

  const requestUrl = new URL(req.url);
  const configuredOrigins = allowedOrigins(env);
  const requestedSite = String(requestUrl.searchParams.get("site") || "")
    .trim()
    .replace(/\/+$/, "");
  const siteOrigin = configuredOrigins.includes(requestedSite)
    ? requestedSite
    : String(env.PUBLIC_SITE_URL || configuredOrigins[0] || "")
        .trim()
        .replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(siteOrigin))
    return new Response("PUBLIC_SITE_URL não configurada", { status: 503 });

  const productUrl = `${siteOrigin}/produto?slug=${encodeURIComponent(slug)}`;
  let imageUrl = product.externalUrl || "";
  if (product.storageKey)
    imageUrl = `${requestUrl.origin}/media/${encodeURIComponent(product.storageKey)}`;
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) imageUrl = "";
  const title = `${product.name} — SHOPLAB`;
  const description =
    String(product.shortDescription || "").trim() ||
    `Confira ${product.name} na SHOPLAB.`;
  const imageMeta = imageUrl
    ? `<meta property="og:image" content="${htmlAttribute(imageUrl)}"><meta property="og:image:alt" content="${htmlAttribute(product.name)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${htmlAttribute(imageUrl)}">`
    : `<meta name="twitter:card" content="summary">`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlAttribute(title)}</title><meta name="description" content="${htmlAttribute(description)}"><link rel="canonical" href="${htmlAttribute(productUrl)}"><meta property="og:type" content="product"><meta property="og:site_name" content="SHOPLAB"><meta property="og:title" content="${htmlAttribute(title)}"><meta property="og:description" content="${htmlAttribute(description)}"><meta property="og:url" content="${htmlAttribute(requestUrl.href)}">${imageMeta}<meta name="twitter:title" content="${htmlAttribute(title)}"><meta name="twitter:description" content="${htmlAttribute(description)}"></head><body><p>Abrindo <a href="${htmlAttribute(productUrl)}">${htmlAttribute(product.name)}</a>…</p><script>location.replace(${JSON.stringify(productUrl).replace(/</g, "\\u003c")})</script></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

async function listProducts(req, env, url, id) {
  const limit = clamp(url.searchParams.get("limit"), 1, 50, 24),
    offset = clamp(url.searchParams.get("offset"), 0, 100000, 0),
    category = url.searchParams.get("category");
  let where = `p.status='published'`,
    args = [];
  if (category) {
    where += ` AND c.slug=?`;
    args.push(category);
  }
  const query = `SELECT p.id,p.name,p.slug,p.product_type productType,p.short_description shortDescription,p.editorial_score editorialScore,p.is_featured isFeatured,p.updated_at updatedAt,c.name category,b.name brand,o.current_price_cents price,o.previous_price_cents oldPrice,pa.name store,o.id offerId FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 LEFT JOIN partners pa ON pa.id=o.partner_id WHERE ${where} ORDER BY p.is_featured DESC,p.updated_at DESC LIMIT ? OFFSET ?`;
  const { results } = await env.DB.prepare(query)
    .bind(...args, limit, offset)
    .all();
  return ok(req, env, results.map(normalizeProduct), id, { limit, offset });
}

async function listProductsV2(req, env, url, id) {
  const limit = clamp(url.searchParams.get("limit"), 1, 50, 24),
    offset = clamp(url.searchParams.get("offset"), 0, 100000, 0),
    category = url.searchParams.get("category");
  let where = `p.status='published'`;
  const args = [];
  if (category) {
    where += ` AND c.slug=?`;
    args.push(category);
  }
  const { results } = await env.DB.prepare(
    `SELECT p.id,p.name,p.slug,p.product_type productType,p.short_description shortDescription,p.editorial_score editorialScore,p.is_featured isFeatured,p.updated_at updatedAt,c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 LEFT JOIN partners pa ON pa.id=o.partner_id WHERE ${where} ORDER BY p.is_featured DESC,p.updated_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...args, limit, offset)
    .all();
  return ok(req, env, results.map(normalizeProduct), id, { limit, offset });
}

async function publicPromotions(req, env, id) {
  const [campaigns, products] = await env.DB.batch([
    env.DB.prepare(
      `SELECT id,name,slug,description,coupon_code couponCode,starts_at startsAt,ends_at endsAt,rules_json rulesJson FROM promotions WHERE is_active=1 AND datetime(starts_at)<=CURRENT_TIMESTAMP AND datetime(ends_at)>=CURRENT_TIMESTAMP ORDER BY datetime(ends_at),name`,
    ),
    env.DB.prepare(
      `SELECT p.id,p.name,p.slug,p.product_type productType,p.short_description shortDescription,p.editorial_score editorialScore,p.is_featured isFeatured,p.view_count viewCount,p.updated_at updatedAt,c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId,pp.promotion_id promotionId FROM promotion_products pp JOIN products p ON p.id=pp.product_id LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 LEFT JOIN partners pa ON pa.id=o.partner_id JOIN promotions pr ON pr.id=pp.promotion_id WHERE p.status='published' AND pr.is_active=1 AND datetime(pr.starts_at)<=CURRENT_TIMESTAMP AND datetime(pr.ends_at)>=CURRENT_TIMESTAMP ORDER BY p.is_featured DESC,p.editorial_score DESC`,
    ),
  ]);
  const items = (campaigns.results || []).map((campaign) => {
    const rules = parse(campaign.rulesJson, {});
    return {
      ...campaign,
      ...rules,
      products: (products.results || [])
        .filter((product) => product.promotionId === campaign.id)
        .map((product) => ({
          ...applyPromotionDiscount(normalizeProduct(product), rules),
          promotionId: campaign.id,
          promotionName: campaign.name,
          promotionEndsAt: campaign.endsAt,
          promotionCouponCode: campaign.couponCode,
        })),
    };
  });
  return ok(req, env, items, id);
}

async function publicPromotionDetail(req, env, slug, id) {
  const campaign = await env.DB.prepare(
    `SELECT id,name,slug,description,coupon_code couponCode,starts_at startsAt,ends_at endsAt,rules_json rulesJson FROM promotions WHERE slug=? AND is_active=1 AND datetime(starts_at)<=CURRENT_TIMESTAMP AND datetime(ends_at)>=CURRENT_TIMESTAMP`,
  )
    .bind(slug)
    .first();
  if (!campaign)
    return fail(
      req,
      env,
      "PROMOTION_NOT_FOUND",
      "Promoção não encontrada ou encerrada",
      404,
      id,
    );
  const { results } = await env.DB.prepare(
    `${PRODUCT_CARD_SELECT} JOIN promotion_products pp ON pp.product_id=p.id WHERE pp.promotion_id=? AND p.status='published' ORDER BY p.is_featured DESC,p.editorial_score DESC`,
  )
    .bind(campaign.id)
    .all();
  const rules = parse(campaign.rulesJson, {});
  return ok(
    req,
    env,
    {
      ...campaign,
      ...rules,
      products: results.map((product) =>
        applyPromotionDiscount(normalizeProduct(product), rules),
      ),
    },
    id,
  );
}

function applyPromotionDiscount(product, rules) {
  const type = rules.discountType,
    value = Number(rules.discountValue || 0),
    regularPrice = Number(product.price || 0);
  if (!regularPrice || !value || !["percentage", "fixed"].includes(type))
    return product;
  const discountCents =
    type === "percentage"
      ? Math.round((regularPrice * Math.min(value, 100)) / 100)
      : Math.round(value * 100);
  const promotionalPrice = Math.max(0, regularPrice - discountCents),
    discount = regularPrice
      ? Math.round((1 - promotionalPrice / regularPrice) * 100)
      : 0;
  return {
    ...product,
    price: promotionalPrice,
    oldPrice: regularPrice,
    discount,
    tag: `${discount}% OFF`,
    campaignDiscountType: type,
    campaignDiscountValue: value,
    campaignDiscountPercent: discount,
  };
}

const PRODUCT_CARD_SELECT = `SELECT p.id,p.name,p.slug,p.product_type productType,
  p.short_description shortDescription,p.editorial_score editorialScore,
  p.is_featured isFeatured,p.view_count viewCount,p.updated_at updatedAt,
  c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,
  COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId
  FROM products p
  LEFT JOIN categories c ON c.id=p.category_id
  LEFT JOIN brands b ON b.id=p.brand_id
  LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1
  LEFT JOIN partners pa ON pa.id=o.partner_id`;

async function trendingProducts(req, env, url, id) {
  const limit = clamp(url.searchParams.get("limit"), 1, 20, 8);
  const { results } = await env.DB.prepare(
    `${PRODUCT_CARD_SELECT}
    LEFT JOIN (
      SELECT product_slug,
        SUM(CASE WHEN event_type='product_view' THEN 1 ELSE 0 END) views,
        SUM(CASE WHEN event_type='offer_click' THEN 1 ELSE 0 END) clicks,
        SUM(CASE WHEN event_type='search_result_click' THEN 1 ELSE 0 END) searchClicks
      FROM events
      WHERE created_at>=datetime('now','-14 days') AND product_slug IS NOT NULL
      GROUP BY product_slug
    ) activity ON activity.product_slug=p.slug
    WHERE p.status='published'
    ORDER BY (
      COALESCE(activity.clicks,0)*12+
      COALESCE(activity.searchClicks,0)*6+
      COALESCE(activity.views,0)*2+
      COALESCE(p.editorial_score,0)*0.18+
      p.is_featured*8+
      CASE WHEN p.published_at>=datetime('now','-30 days') THEN 5 ELSE 0 END
    ) DESC,p.updated_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all();
  return ok(req, env, results.map(normalizeProduct), id, {
    windowDays: 14,
    signals: [
      "offerClicks",
      "searchClicks",
      "views",
      "editorialScore",
      "featured",
      "freshness",
    ],
  });
}

async function relatedProducts(req, env, slug, id) {
  const source = await env.DB.prepare(
    `SELECT id,category_id categoryId,brand_id brandId,product_type productType,editorial_score editorialScore FROM products WHERE slug=? AND status='published'`,
  )
    .bind(slug)
    .first();
  if (!source)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  const { results } = await env.DB.prepare(
    `${PRODUCT_CARD_SELECT}
    LEFT JOIN (SELECT recommended_product_id,MIN(sort_order) sort_order FROM recommendations WHERE product_id=? GROUP BY recommended_product_id) r ON r.recommended_product_id=p.id
    LEFT JOIN (
      SELECT product_slug,
        SUM(CASE WHEN event_type='product_view' THEN 1 ELSE 0 END) views,
        SUM(CASE WHEN event_type='offer_click' THEN 1 ELSE 0 END) clicks
      FROM events WHERE created_at>=datetime('now','-30 days') GROUP BY product_slug
    ) activity ON activity.product_slug=p.slug
    WHERE p.status='published' AND p.id<>?
    ORDER BY (
      CASE WHEN r.recommended_product_id IS NOT NULL THEN 1000-r.sort_order ELSE 0 END+
      CASE WHEN p.category_id=? THEN 45 ELSE 0 END+
      CASE WHEN p.brand_id IS NOT NULL AND p.brand_id=? THEN 18 ELSE 0 END+
      CASE WHEN p.product_type=? THEN 12 ELSE 0 END+
      MAX(0,12-ABS(COALESCE(p.editorial_score,50)-COALESCE(?,50))*0.3)+
      COALESCE(activity.clicks,0)*4+MIN(COALESCE(activity.views,0),20)*0.5+
      COALESCE(p.editorial_score,0)*0.08
    ) DESC,p.updated_at DESC LIMIT 8`,
  )
    .bind(
      source.id,
      source.id,
      source.categoryId,
      source.brandId,
      source.productType,
      source.editorialScore,
    )
    .all();
  return ok(req, env, results.map(normalizeProduct), id, {
    strategy: "manual+category+brand+type+score+activity",
  });
}

async function getProductV2(req, env, slug, id) {
  const row = await env.DB.prepare(
    `SELECT p.*,c.name category,c.slug categorySlug,b.name brand FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id WHERE p.slug=? AND p.status='published'`,
  )
    .bind(slug)
    .first();
  if (!row)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  const [offers, media, authors, recommendations, campaigns] =
    await env.DB.batch([
      env.DB.prepare(
        `SELECT o.id,o.current_price_cents price,o.previous_price_cents oldPrice,o.currency,o.coupon_code coupon,o.installment_text installments,o.shipping_text shipping,o.availability,o.button_text buttonText,o.last_checked_at lastCheckedAt,pa.name store FROM offers o JOIN partners pa ON pa.id=o.partner_id WHERE o.product_id=? AND o.availability='available' AND (o.starts_at IS NULL OR datetime(o.starts_at)<=CURRENT_TIMESTAMP) AND (o.ends_at IS NULL OR datetime(o.ends_at)>=CURRENT_TIMESTAMP) ORDER BY o.is_primary DESC,o.priority DESC,o.current_price_cents`,
      ).bind(row.id),
      env.DB.prepare(
        `SELECT id,type,storage_key storageKey,external_url externalUrl,alt_text altText,caption,credits,sort_order sortOrder,is_primary isPrimary FROM product_media WHERE product_id=? ORDER BY is_primary DESC,sort_order`,
      ).bind(row.id),
      env.DB.prepare(
        `SELECT a.id,a.name,a.slug,pa.role FROM product_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.product_id=?`,
      ).bind(row.id),
      env.DB.prepare(
        `SELECT p.id,p.name,p.slug,r.strategy FROM recommendations r JOIN products p ON p.id=r.recommended_product_id WHERE r.product_id=? AND p.status='published' ORDER BY r.sort_order LIMIT 20`,
      ).bind(row.id),
      env.DB.prepare(
        `SELECT pr.id,pr.name,pr.slug,pr.description,pr.coupon_code couponCode,pr.ends_at endsAt,pr.rules_json rulesJson FROM promotions pr JOIN promotion_products pp ON pp.promotion_id=pr.id WHERE pp.product_id=? AND pr.is_active=1 AND datetime(pr.starts_at)<=CURRENT_TIMESTAMP AND datetime(pr.ends_at)>=CURRENT_TIMESTAMP ORDER BY datetime(pr.ends_at)`,
      ).bind(row.id),
    ]);
  const offer = (offers.results || [])[0] || {};
  const product = normalizeProduct({
    ...row,
    editorialScore: row.editorial_score,
    isFeatured: row.is_featured,
    shortDescription: row.short_description,
    price: offer.price ?? row.base_price_cents,
    oldPrice: offer.oldPrice ?? row.compare_at_price_cents,
    store: offer.store,
    offerId: offer.id,
  });
  const activePromotions = (campaigns.results || []).map((campaign) => ({
    ...campaign,
    ...parse(campaign.rulesJson, {}),
  }));
  let pricedProduct = product,
    promotion = null;
  for (const campaign of activePromotions) {
    const candidate = applyPromotionDiscount(product, campaign);
    if (candidate.price < pricedProduct.price) {
      pricedProduct = candidate;
      promotion = campaign;
    }
  }
  return ok(
    req,
    env,
    {
      ...pricedProduct,
      promotion,
      activePromotions,
      fullDescription: row.full_description,
      editorialReview: row.editorial_review,
      targetAudience: row.target_audience,
      notRecommendedFor: row.not_recommended_for,
      pros: parse(row.pros_json, []),
      cons: parse(row.cons_json, []),
      tags: parse(row.tags_json, []),
      specificationGroups: parse(row.specifications_json, []),
      bookDetails: parse(row.book_details_json, {}),
      faqs: parse(row.faqs_json, []),
      offers: offers.results || [],
      media: media.results || [],
      authors: authors.results || [],
      recommendations: recommendations.results || [],
    },
    id,
  );
}
async function getProduct(req, env, slug, id) {
  const row = await env.DB.prepare(
    `SELECT p.*,c.name category,c.slug category_slug,b.name brand FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id WHERE p.slug=? AND p.status='published'`,
  )
    .bind(slug)
    .first();
  if (!row)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  const [offers, media, authors, recommendations] = await Promise.all([
    env.DB.prepare(
      `SELECT o.id,o.current_price_cents price,o.previous_price_cents oldPrice,o.currency,o.coupon_code coupon,o.installment_text installments,o.shipping_text shipping,o.availability,o.button_text buttonText,o.last_checked_at lastCheckedAt,pa.name store FROM offers o JOIN partners pa ON pa.id=o.partner_id WHERE o.product_id=? ORDER BY o.is_primary DESC,o.priority DESC,o.current_price_cents`,
    )
      .bind(row.id)
      .all(),
    env.DB.prepare(
      `SELECT id,type,storage_key storageKey,external_url externalUrl,alt_text altText,caption,credits,sort_order sortOrder,is_primary isPrimary FROM product_media WHERE product_id=? ORDER BY is_primary DESC,sort_order`,
    )
      .bind(row.id)
      .all(),
    env.DB.prepare(
      `SELECT a.id,a.name,a.slug,pa.role FROM product_authors pa JOIN authors a ON a.id=pa.author_id WHERE pa.product_id=?`,
    )
      .bind(row.id)
      .all(),
    env.DB.prepare(
      `SELECT p.id,p.name,p.slug,r.strategy FROM recommendations r JOIN products p ON p.id=r.recommended_product_id WHERE r.product_id=? AND p.status='published' ORDER BY r.sort_order LIMIT 20`,
    )
      .bind(row.id)
      .all(),
  ]);
  return ok(
    req,
    env,
    {
      ...normalizeProduct(row),
      fullDescription: row.full_description,
      editorialReview: row.editorial_review,
      targetAudience: row.target_audience,
      notRecommendedFor: row.not_recommended_for,
      pros: parse(row.pros_json, []),
      cons: parse(row.cons_json, []),
      tags: parse(row.tags_json, []),
      specificationGroups: parse(row.specifications_json, []),
      bookDetails: parse(row.book_details_json, {}),
      faqs: parse(row.faqs_json, []),
      offers: offers.results,
      media: media.results,
      authors: authors.results,
      recommendations: recommendations.results,
    },
    id,
  );
}
async function search(req, env, url, id) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (!q) return ok(req, env, [], id);
  const like = `%${q}%`;
  const { results } = await env.DB.prepare(
    `SELECT p.id,p.name,p.slug,p.short_description shortDescription,p.editorial_score editorialScore,c.name category,b.name brand,o.current_price_cents price,o.previous_price_cents oldPrice FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 WHERE p.status='published' AND (p.name LIKE ? OR p.short_description LIKE ? OR c.name LIKE ? OR b.name LIKE ?) ORDER BY CASE WHEN p.name LIKE ? THEN 0 ELSE 1 END,p.is_featured DESC LIMIT 50`,
  )
    .bind(like, like, like, like, `${q}%`)
    .all();
  return ok(req, env, results.map(normalizeProduct), id);
}
async function suggestions(req, env, url, id) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 2) return ok(req, env, [], id);
  const { results } = await env.DB.prepare(
    `SELECT name,slug FROM products WHERE status='published' AND name LIKE ? ORDER BY view_count DESC LIMIT 8`,
  )
    .bind(`%${q}%`)
    .all();
  return ok(req, env, results, id);
}
async function redirectOffer(req, env, path, ctx) {
  const parts = path.split("/").filter(Boolean),
    slug = decodeURIComponent(parts[1] || ""),
    offerId = decodeURIComponent(parts[2] || "");
  const row = await env.DB.prepare(
    `SELECT o.affiliate_url,p.slug FROM offers o JOIN products p ON p.id=o.product_id WHERE p.slug=? AND o.id=? AND p.status='published' AND o.availability='available' AND (o.starts_at IS NULL OR datetime(o.starts_at)<=CURRENT_TIMESTAMP) AND (o.ends_at IS NULL OR datetime(o.ends_at)>=CURRENT_TIMESTAMP)`,
  )
    .bind(slug, offerId)
    .first();
  if (!row)
    return new Response("Oferta não encontrada ou encerrada", { status: 404 });
  ctx.waitUntil(
    env.DB.prepare(
      `INSERT INTO events(id,event_type,product_slug,offer_id) VALUES(?,?,?,?)`,
    )
      .bind(crypto.randomUUID(), "offer_click", slug, offerId)
      .run(),
  );
  return Response.redirect(row.affiliate_url, 302);
}
async function recordEvent(req, env, ctx, id) {
  const body = await readJson(req, 4096);
  const allowed = new Set([
    "product_view",
    "offer_click",
    "search_result_click",
    "share",
    "favorite",
  ]);
  const type = String(body.type || "").slice(0, 60),
    slug = text(body.slug, 160);
  if (!allowed.has(type))
    return fail(req, env, "VALIDATION_ERROR", "Evento inválido", 422, id);
  const statements = [
    env.DB.prepare(
      `INSERT INTO events(id,event_type,product_slug,offer_id,query_text,metadata_json) VALUES(?,?,?,?,?,?)`,
    ).bind(
      crypto.randomUUID(),
      type,
      slug,
      text(body.offerId, 100),
      text(body.query, 200),
      JSON.stringify(body.metadata || {}).slice(0, 2000),
    ),
  ];
  if (type === "product_view" && slug)
    statements.push(
      env.DB.prepare(
        `UPDATE products SET view_count=view_count+1 WHERE slug=? AND status='published'`,
      ).bind(slug),
    );
  ctx.waitUntil(env.DB.batch(statements));
  return ok(req, env, { accepted: true }, id);
}
async function login(req, env, id) {
  const body = await readJson(req, 8192);
  if (!body.password || !body.turnstileToken)
    return fail(req, env, "VALIDATION_ERROR", "Credenciais inválidas", 422, id);
  const turn = await verifyTurnstile(body.turnstileToken, req, env);
  if (!turn.success)
    return fail(
      req,
      env,
      "VERIFICATION_FAILED",
      "Não foi possível verificar o acesso",
      403,
      id,
    );
  if (!(await safeEqual(String(body.password), env.ADMIN_PASSWORD)))
    return fail(
      req,
      env,
      "INVALID_CREDENTIALS",
      "Credenciais inválidas",
      401,
      id,
    );
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32))),
    hash = await sha256(token),
    sessionId = crypto.randomUUID(),
    expires = new Date(Date.now() + 8 * 3600e3).toISOString();
  await env.DB.prepare(
    `INSERT INTO admin_sessions(id,token_hash,expires_at) VALUES(?,?,?)`,
  )
    .bind(sessionId, hash, expires)
    .run();
  const response = ok(req, env, { authenticated: true }, id);
  response.headers.append(
    "set-cookie",
    `shoplab_session=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=28800`,
  );
  return response;
}
async function logout(req, env, id) {
  const token = cookie(req, "shoplab_session");
  if (token)
    await env.DB.prepare(`DELETE FROM admin_sessions WHERE token_hash=?`)
      .bind(await sha256(token))
      .run();
  const response = ok(req, env, { authenticated: false }, id);
  response.headers.append(
    "set-cookie",
    "shoplab_session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0",
  );
  return response;
}
async function sessionStatus(req, env, id) {
  return (await requireAdmin(req, env))
    ? ok(req, env, { authenticated: true }, id)
    : fail(req, env, "UNAUTHORIZED", "Sessão inválida", 401, id);
}
async function createProduct(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const b = await readJson(req, 100000),
    validation = validateProduct(b);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const productId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO products(id,name,slug,product_type,status,category_id,brand_id,short_description,full_description,editorial_score,is_featured,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
  )
    .bind(
      productId,
      b.name,
      b.slug,
      b.productType || "affiliate",
      b.status || "draft",
      b.categoryId || null,
      b.brandId || null,
      b.shortDescription || "",
      b.fullDescription || "",
      Number(b.editorialScore) || null,
      b.isFeatured ? 1 : 0,
      b.status || "draft",
    )
    .run();
  return respond(
    req,
    env,
    {
      success: true,
      data: { id: productId },
      meta: { requestId: id },
      error: null,
    },
    201,
  );
}
async function updateProduct(req, env, productId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const b = await readJson(req, 100000),
    validation = validateProduct(b);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const result = await env.DB.prepare(
    `UPDATE products SET name=?,slug=?,product_type=?,status=?,category_id=?,brand_id=?,short_description=?,full_description=?,editorial_score=?,is_featured=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  )
    .bind(
      b.name,
      b.slug,
      b.productType || "affiliate",
      b.status || "draft",
      b.categoryId || null,
      b.brandId || null,
      b.shortDescription || "",
      b.fullDescription || "",
      Number(b.editorialScore) || null,
      b.isFeatured ? 1 : 0,
      productId,
    )
    .run();
  if (!result.meta.changes)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  return ok(req, env, { id: productId }, id);
}

function nullableCents(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

function normalizeAdminOffers(value, productType, basePrice, comparePrice) {
  const offers = Array.isArray(value) ? value.slice(0, 20) : [];
  if (productType === "affiliate" && !offers.length)
    return { error: "Produto afiliado precisa de uma URL de afiliado" };
  const normalized = [];
  for (let index = 0; index < offers.length; index += 1) {
    const offer = offers[index];
    let affiliateUrl;
    try {
      affiliateUrl = new URL(String(offer.affiliateUrl || ""));
    } catch {
      return { error: "Informe uma URL de afiliado válida" };
    }
    if (!["http:", "https:"].includes(affiliateUrl.protocol))
      return { error: "A URL afiliada deve usar HTTP ou HTTPS" };
    if (!offer.partnerId) return { error: "Selecione o parceiro da oferta" };
    const current =
      productType === "affiliate" && index === 0
        ? basePrice
        : nullableCents(offer.currentPriceCents);
    const previous =
      productType === "affiliate" && index === 0
        ? comparePrice
        : nullableCents(offer.previousPriceCents);
    if (current === null) return { error: "Defina o preço atual da oferta" };
    normalized.push({
      ...offer,
      affiliateUrl: String(affiliateUrl),
      currentPriceCents: current,
      previousPriceCents: previous,
    });
  }
  return { offers: normalized };
}

function insertOfferStatements(env, productId, offers) {
  return offers.map((offer, index) =>
    env.DB.prepare(
      `INSERT INTO offers(id,product_id,partner_id,affiliate_url,current_price_cents,previous_price_cents,coupon_code,availability,button_text,is_primary,priority,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
    ).bind(
      offer.id || crypto.randomUUID(),
      productId,
      offer.partnerId,
      offer.affiliateUrl,
      offer.currentPriceCents,
      offer.previousPriceCents,
      String(offer.couponCode || "").slice(0, 80),
      offer.availability || "available",
      String(offer.buttonText || "Ver oferta").slice(0, 80),
      index === 0 ? 1 : 0,
      offers.length - index,
    ),
  );
}

async function createProductV2(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 100000),
    validation = validateProduct(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const basePrice = nullableCents(body.basePriceCents);
  if (basePrice === null)
    return fail(
      req,
      env,
      "VALIDATION_ERROR",
      "Defina o preço normal do produto",
      422,
      id,
    );
  const comparePrice = nullableCents(body.compareAtPriceCents);
  if (comparePrice !== null && comparePrice < basePrice)
    return fail(
      req,
      env,
      "VALIDATION_ERROR",
      "O preço de comparação deve ser maior ou igual ao preço normal",
      422,
      id,
    );
  const productId = crypto.randomUUID(),
    status = body.status || "draft",
    productType = body.productType || "affiliate",
    offerResult = normalizeAdminOffers(
      body.offers,
      productType,
      basePrice,
      comparePrice,
    );
  if (offerResult.error)
    return fail(req, env, "VALIDATION_ERROR", offerResult.error, 422, id);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO products(id,name,slug,product_type,status,category_id,brand_id,short_description,full_description,editorial_score,base_price_cents,compare_at_price_cents,is_featured,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
    ).bind(
      productId,
      String(body.name).trim(),
      body.slug,
      productType,
      status,
      body.categoryId || null,
      body.brandId || null,
      body.shortDescription || "",
      body.fullDescription || "",
      body.editorialScore === "" || body.editorialScore == null
        ? null
        : Number(body.editorialScore),
      basePrice,
      comparePrice,
      body.isFeatured ? 1 : 0,
      status,
    ),
    ...insertOfferStatements(env, productId, offerResult.offers),
  ]);
  return respond(
    req,
    env,
    {
      success: true,
      data: {
        id: productId,
        created: true,
        basePriceCents: basePrice,
        offersSaved: offerResult.offers.length,
      },
      meta: { requestId: id },
      error: null,
    },
    201,
  );
}

async function updateProductV2(req, env, productId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 100000),
    validation = validateProduct(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const basePrice = nullableCents(body.basePriceCents);
  if (basePrice === null)
    return fail(
      req,
      env,
      "VALIDATION_ERROR",
      "Defina o preço normal do produto",
      422,
      id,
    );
  const comparePrice = nullableCents(body.compareAtPriceCents);
  if (comparePrice !== null && comparePrice < basePrice)
    return fail(
      req,
      env,
      "VALIDATION_ERROR",
      "O preço de comparação deve ser maior ou igual ao preço normal",
      422,
      id,
    );
  const productType = body.productType || "affiliate",
    offerResult = normalizeAdminOffers(
      body.offers,
      productType,
      basePrice,
      comparePrice,
    );
  if (offerResult.error)
    return fail(req, env, "VALIDATION_ERROR", offerResult.error, 422, id);
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE products SET name=?,slug=?,product_type=?,status=?,category_id=?,brand_id=?,short_description=?,full_description=?,editorial_score=?,base_price_cents=?,compare_at_price_cents=?,is_featured=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).bind(
      String(body.name).trim(),
      body.slug,
      productType,
      body.status || "draft",
      body.categoryId || null,
      body.brandId || null,
      body.shortDescription || "",
      body.fullDescription || "",
      body.editorialScore === "" || body.editorialScore == null
        ? null
        : Number(body.editorialScore),
      basePrice,
      comparePrice,
      body.isFeatured ? 1 : 0,
      body.status || "draft",
      productId,
    ),
    env.DB.prepare(`DELETE FROM offers WHERE product_id=?`).bind(productId),
    ...insertOfferStatements(env, productId, offerResult.offers),
  ]);
  const result = results[0];
  if (!result.meta.changes)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  return ok(
    req,
    env,
    {
      id: productId,
      updated: true,
      basePriceCents: basePrice,
      offersSaved: offerResult.offers.length,
    },
    id,
  );
}
const SEARCH_SYNONYMS = {
  fone: ["headphone", "headset", "audio", "auricular"],
  headphone: ["fone", "headset", "audio"],
  headset: ["fone", "headphone", "microfone"],
  celular: ["smartphone", "telefone", "mobile"],
  smartphone: ["celular", "telefone"],
  notebook: ["laptop", "computador"],
  laptop: ["notebook", "computador"],
  computador: ["pc", "desktop", "notebook"],
  monitor: ["tela", "display"],
  televisao: ["tv", "smart tv"],
  tv: ["televisao", "smart tv"],
  ssd: ["armazenamento", "nvme", "disco"],
  hd: ["armazenamento", "disco rigido"],
  memoria: ["ram", "armazenamento"],
  teclado: ["keyboard", "periferico"],
  mouse: ["periferico"],
  livro: ["livros", "ebook", "leitura"],
  livros: ["livro", "ebook", "leitura"],
  ebook: ["livro", "digital", "leitura"],
  curso: ["cursos", "aula", "treinamento", "capacitacao"],
  cursos: ["curso", "aula", "treinamento"],
  produtividade: ["foco", "organizacao", "planner"],
  organizacao: ["produtividade", "planejamento"],
  planner: ["agenda", "planejamento", "produtividade"],
  barato: ["oferta", "promocao", "desconto"],
  oferta: ["promocao", "desconto", "barato"],
  promocao: ["oferta", "desconto"],
  camera: ["fotografia", "filmagem"],
  impressora: ["multifuncional", "impressao"],
  relogio: ["smartwatch", "wearable"],
  smartwatch: ["relogio", "wearable"],
  caixa: ["speaker", "alto falante", "audio"],
  microfone: ["mic", "audio"],
  carregador: ["fonte", "energia"],
  cabo: ["adaptador", "conector"],
};

const SEARCH_VOCABULARY = [
  ...new Set(
    Object.entries(SEARCH_SYNONYMS).flatMap(([term, values]) => [
      term,
      ...values.flatMap((value) => value.split(" ")),
    ]),
  ),
];

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function editDistance(a, b) {
  const row = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = saved;
    }
  }
  return row[b.length];
}

function correctSearchTerm(term) {
  if (term.length < 4 || SEARCH_VOCABULARY.includes(term)) return term;
  const threshold = term.length <= 5 ? 1 : 2;
  let best = term,
    bestDistance = threshold + 1;
  for (const candidate of SEARCH_VOCABULARY) {
    if (Math.abs(candidate.length - term.length) > threshold) continue;
    const current = editDistance(term, candidate);
    if (current <= threshold && current < bestDistance) {
      best = candidate;
      bestDistance = current;
    }
  }
  return best;
}

function correctedSearch(query) {
  return normalizeSearch(query).split(" ").map(correctSearchTerm).join(" ");
}

function buildFtsQuery(query) {
  const terms = correctedSearch(query)
    .split(" ")
    .filter((term) => term.length >= 2)
    .slice(0, 8);
  const expanded = new Set(terms);
  for (const term of terms)
    for (const synonym of SEARCH_SYNONYMS[term] || []) expanded.add(synonym);
  return [...expanded]
    .flatMap((term) => term.split(" "))
    .filter((term) => term.length >= 2)
    .slice(0, 24)
    .map((term) => `"${term.replace(/"/g, "")}"*`)
    .join(" OR ");
}

async function searchV2(req, env, url, ctx, id) {
  const originalQuery = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const normalizedQuery = normalizeSearch(originalQuery);
  const correctedQuery = correctedSearch(normalizedQuery);
  if (normalizedQuery.length < 2)
    return ok(req, env, [], id, { query: originalQuery, total: 0 });
  const ftsQuery = buildFtsQuery(correctedQuery);
  const category = normalizeSearch(url.searchParams.get("category")).replace(
    /\s+/g,
    "-",
  );
  const sort = url.searchParams.get("sort");
  const order =
    sort === "price-asc"
      ? "COALESCE(o.current_price_cents,2147483647) ASC,rank ASC"
      : sort === "discount"
        ? "CASE WHEN o.previous_price_cents>o.current_price_cents THEN (o.previous_price_cents-o.current_price_cents)*1.0/o.previous_price_cents ELSE 0 END DESC,rank ASC"
        : "rank ASC,COALESCE(p.editorial_score,0) DESC,p.is_featured DESC,p.view_count DESC";
  const args = [ftsQuery];
  const categoryFilter = category ? " AND c.slug=?" : "";
  if (category) args.push(category);
  let { results } = await env.DB.prepare(
    `
    SELECT p.id,p.name,p.slug,p.short_description shortDescription,
      p.editorial_score editorialScore,p.is_featured isFeatured,p.view_count viewCount,
      c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,
      COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId,
      bm25(products_fts,0,10.0,4.0,3.0,1.0) rank
    FROM products_fts
    JOIN products p ON p.id=products_fts.product_id
    LEFT JOIN categories c ON c.id=p.category_id
    LEFT JOIN brands b ON b.id=p.brand_id
    LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1
    LEFT JOIN partners pa ON pa.id=o.partner_id
    WHERE products_fts MATCH ? AND p.status='published'${categoryFilter}
    ORDER BY ${order}
    LIMIT 50
  `,
  )
    .bind(...args)
    .all();
  if (!results.length) {
    const fallback = await env.DB.prepare(
      `${PRODUCT_CARD_SELECT} WHERE p.status='published' ORDER BY p.view_count DESC,p.editorial_score DESC LIMIT 200`,
    ).all();
    const queryTerms = correctedQuery.split(" ").filter(Boolean);
    results = (fallback.results || [])
      .map((product) => {
        const words = normalizeSearch(
          [product.name, product.brand, product.category]
            .filter(Boolean)
            .join(" "),
        ).split(" ");
        const distance = queryTerms.reduce(
          (total, term) =>
            total + Math.min(...words.map((word) => editDistance(term, word))),
          0,
        );
        return { ...product, fuzzyDistance: distance };
      })
      .filter(
        (product) =>
          product.fuzzyDistance <= Math.max(2, queryTerms.length * 2),
      )
      .sort(
        (a, b) =>
          a.fuzzyDistance -
          b.fuzzyDistance -
          (Number(a.editorialScore || 0) - Number(b.editorialScore || 0)) *
            0.01,
      )
      .slice(0, 20);
  }
  ctx.waitUntil(
    env.DB.prepare(
      `INSERT INTO events(id,event_type,query_text,metadata_json) VALUES(?,?,?,?)`,
    )
      .bind(
        crypto.randomUUID(),
        results.length ? "search" : "search_no_results",
        normalizedQuery,
        JSON.stringify({ originalQuery, resultCount: results.length }).slice(
          0,
          2000,
        ),
      )
      .run(),
  );
  return ok(req, env, results.map(normalizeProduct), id, {
    query: originalQuery,
    normalizedQuery,
    correctedQuery,
    corrected: correctedQuery !== normalizedQuery,
    total: results.length,
  });
}

async function suggestionsV2(req, env, url, id) {
  const query = normalizeSearch(url.searchParams.get("q"));
  if (query.length < 2) return ok(req, env, [], id);
  const correctedQuery = correctedSearch(query),
    ftsQuery = buildFtsQuery(correctedQuery);
  const { results } = await env.DB.prepare(
    `
    SELECT p.name,p.slug,c.name category,b.name brand,p.view_count viewCount,
      (SELECT pm.storage_key FROM product_media pm WHERE pm.product_id=p.id AND pm.type='image' ORDER BY pm.is_primary DESC,pm.sort_order,pm.created_at LIMIT 1) storageKey,
      (SELECT pm.external_url FROM product_media pm WHERE pm.product_id=p.id AND pm.type='image' ORDER BY pm.is_primary DESC,pm.sort_order,pm.created_at LIMIT 1) externalUrl,
      (SELECT pm.alt_text FROM product_media pm WHERE pm.product_id=p.id AND pm.type='image' ORDER BY pm.is_primary DESC,pm.sort_order,pm.created_at LIMIT 1) altText
    FROM products_fts
    JOIN products p ON p.id=products_fts.product_id
    LEFT JOIN categories c ON c.id=p.category_id
    LEFT JOIN brands b ON b.id=p.brand_id
    WHERE products_fts MATCH ? AND p.status='published'
    ORDER BY bm25(products_fts,0,8.0,3.0,2.0,1.0),p.view_count DESC
    LIMIT 8
  `,
  )
    .bind(ftsQuery)
    .all();
  return ok(req, env, results, id);
}

async function trendingSearches(req, env, id) {
  const { results } = await env.DB.prepare(
    `
    SELECT p.name query,
      COALESCE(SUM(CASE
        WHEN e.event_type='offer_click' THEN 12
        WHEN e.event_type='search_result_click' THEN 6
        WHEN e.event_type='product_view' THEN 2
        ELSE 0
      END),0)+MIN(COALESCE(p.view_count,0),100) searches
    FROM products p
    LEFT JOIN events e ON e.product_slug=p.slug AND e.created_at>=datetime('now','-14 days')
    WHERE p.status='published'
    GROUP BY p.id
    ORDER BY searches DESC,p.is_featured DESC,p.updated_at DESC
    LIMIT 8
  `,
  ).all();
  return ok(req, env, results || [], id);
}

async function adminProductDetail(req, env, productId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const product = await env.DB.prepare(
    `SELECT id,name,slug,subtitle,product_type productType,status,category_id categoryId,brand_id brandId,short_description shortDescription,full_description fullDescription,editorial_review editorialReview,editorial_score editorialScore,base_price_cents basePriceCents,compare_at_price_cents compareAtPriceCents,is_featured isFeatured FROM products WHERE id=?`,
  )
    .bind(productId)
    .first();
  if (!product)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  const [offers, media, partners] = await env.DB.batch([
    env.DB.prepare(
      `SELECT id,partner_id partnerId,affiliate_url affiliateUrl,current_price_cents currentPriceCents,previous_price_cents previousPriceCents,coupon_code couponCode,availability,button_text buttonText,is_primary isPrimary FROM offers WHERE product_id=? ORDER BY is_primary DESC,priority DESC`,
    ).bind(productId),
    env.DB.prepare(
      `SELECT id,type,storage_key storageKey,external_url externalUrl,alt_text altText,caption,is_primary isPrimary,sort_order sortOrder FROM product_media WHERE product_id=? ORDER BY is_primary DESC,sort_order`,
    ).bind(productId),
    env.DB.prepare(
      `SELECT id,name FROM partners WHERE is_active=1 ORDER BY name`,
    ),
  ]);
  return ok(
    req,
    env,
    {
      ...product,
      offers: offers.results || [],
      media: media.results || [],
      partners: partners.results || [],
    },
    id,
  );
}

async function uploadProductMedia(req, env, productId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  if (!env.MEDIA)
    return fail(
      req,
      env,
      "R2_NOT_CONFIGURED",
      "O binding R2 MEDIA não foi configurado",
      503,
      id,
    );
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 8 * 1024 * 1024)
    return fail(
      req,
      env,
      "FILE_TOO_LARGE",
      "A imagem deve ter no máximo 8 MB",
      413,
      id,
    );
  const form = await req.formData();
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    !file.type.startsWith("image/") ||
    file.size > 8 * 1024 * 1024
  )
    return fail(
      req,
      env,
      "INVALID_FILE",
      "Envie uma imagem válida de até 8 MB",
      422,
      id,
    );
  const exists = await env.DB.prepare("SELECT id FROM products WHERE id=?")
    .bind(productId)
    .first();
  if (!exists)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  const extension = (file.name.split(".").pop() || "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const mediaId = crypto.randomUUID();
  const key = `products/${productId}/${mediaId}.${extension}`;
  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: { productId, originalName: file.name.slice(0, 120) },
  });
  const isPrimary = String(form.get("isPrimary")) === "true";
  if (isPrimary)
    await env.DB.prepare(
      "UPDATE product_media SET is_primary=0 WHERE product_id=?",
    )
      .bind(productId)
      .run();
  await env.DB.prepare(
    `INSERT INTO product_media(id,product_id,type,storage_key,alt_text,caption,mime_type,is_primary,sort_order) VALUES(?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      mediaId,
      productId,
      "image",
      key,
      String(form.get("altText") || "").slice(0, 250),
      String(form.get("caption") || "").slice(0, 500),
      file.type,
      isPrimary ? 1 : 0,
      Number(form.get("sortOrder")) || 0,
    )
    .run();
  return respond(
    req,
    env,
    {
      success: true,
      data: { id: mediaId, url: `/media/${encodeURIComponent(key)}` },
      meta: { requestId: id },
      error: null,
    },
    201,
  );
}

async function deleteProductMedia(req, env, mediaId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const media = await env.DB.prepare(
    "SELECT storage_key storageKey,product_id productId,is_primary isPrimary FROM product_media WHERE id=?",
  )
    .bind(mediaId)
    .first();
  if (!media)
    return fail(req, env, "MEDIA_NOT_FOUND", "Mídia não encontrada", 404, id);
  if (media.storageKey && env.MEDIA) await env.MEDIA.delete(media.storageKey);
  await env.DB.prepare("DELETE FROM product_media WHERE id=?")
    .bind(mediaId)
    .run();
  if (media.isPrimary)
    await env.DB.prepare(
      "UPDATE product_media SET is_primary=1 WHERE id=(SELECT id FROM product_media WHERE product_id=? ORDER BY sort_order,created_at LIMIT 1)",
    )
      .bind(media.productId)
      .run();
  return ok(req, env, { deleted: true }, id);
}

async function updateProductMedia(req, env, mediaId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const media = await env.DB.prepare(
    "SELECT id,product_id productId FROM product_media WHERE id=?",
  )
    .bind(mediaId)
    .first();
  if (!media)
    return fail(req, env, "MEDIA_NOT_FOUND", "Mídia não encontrada", 404, id);
  const body = await readJson(req, 8192);
  const isPrimary = Boolean(body.isPrimary);
  const statements = [];
  if (isPrimary)
    statements.push(
      env.DB.prepare(
        "UPDATE product_media SET is_primary=0 WHERE product_id=?",
      ).bind(media.productId),
    );
  statements.push(
    env.DB.prepare(
      "UPDATE product_media SET alt_text=?,caption=?,is_primary=?,sort_order=? WHERE id=?",
    ).bind(
      String(body.altText || "").slice(0, 250),
      String(body.caption || "").slice(0, 500),
      isPrimary ? 1 : 0,
      Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      mediaId,
    ),
  );
  await env.DB.batch(statements);
  return ok(req, env, { id: mediaId, isPrimary }, id);
}

async function serveMedia(req, env, key) {
  if (!env.MEDIA) return new Response("Not found", { status: 404 });
  const object = await env.MEDIA.get(key, {
    onlyIf: req.headers,
    range: req.headers,
  });
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("access-control-allow-origin", "*");
  return new Response("body" in object ? object.body : undefined, {
    status: "body" in object ? 200 : 412,
    headers,
  });
}

async function saveProductOffers(req, env, productId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 100000);
  const product = await env.DB.prepare(
    "SELECT product_type productType,base_price_cents basePriceCents,compare_at_price_cents compareAtPriceCents FROM products WHERE id=?",
  )
    .bind(productId)
    .first();
  if (!product)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  const offerResult = normalizeAdminOffers(
    body.offers,
    product.productType,
    nullableCents(product.basePriceCents),
    nullableCents(product.compareAtPriceCents),
  );
  if (offerResult.error)
    return fail(req, env, "VALIDATION_ERROR", offerResult.error, 422, id);
  const offers = offerResult.offers;
  const statements = [
    env.DB.prepare("DELETE FROM offers WHERE product_id=?").bind(productId),
  ];
  statements.push(...insertOfferStatements(env, productId, offers));
  await env.DB.batch(statements);
  return ok(req, env, { saved: offers.length }, id);
}

async function adminPromotions(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const { results } = await env.DB.prepare(
    `SELECT pr.id,pr.name,pr.slug,pr.description,pr.coupon_code couponCode,pr.starts_at startsAt,pr.ends_at endsAt,pr.is_active isActive,pr.rules_json rulesJson,GROUP_CONCAT(pp.product_id) productIds,COUNT(pp.product_id) productCount FROM promotions pr LEFT JOIN promotion_products pp ON pp.promotion_id=pr.id GROUP BY pr.id ORDER BY datetime(pr.starts_at) DESC`,
  ).all();
  return ok(
    req,
    env,
    results.map((row) => ({
      ...row,
      ...parse(row.rulesJson, {}),
      productIds: row.productIds ? row.productIds.split(",") : [],
    })),
    id,
  );
}

async function createPromotion(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 30000),
    promotionId = crypto.randomUUID();
  const validation = validatePromotion(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const productIds = uniqueIds(body.productIds);
  const statements = [
    env.DB.prepare(
      `INSERT INTO promotions(id,name,slug,description,coupon_code,starts_at,ends_at,rules_json,is_active) VALUES(?,?,?,?,?,?,?,?,?)`,
    ).bind(
      promotionId,
      String(body.name).trim().slice(0, 140),
      body.slug,
      String(body.description || "").slice(0, 3000),
      String(body.couponCode || "").slice(0, 80),
      body.startsAt,
      body.endsAt,
      JSON.stringify(promotionRules(body)),
      body.isActive === false ? 0 : 1,
    ),
    ...productIds.map((productId) =>
      env.DB.prepare(
        `INSERT INTO promotion_products(promotion_id,product_id) SELECT ?,id FROM products WHERE id=?`,
      ).bind(promotionId, productId),
    ),
  ];
  await env.DB.batch(statements);
  return respond(
    req,
    env,
    {
      success: true,
      data: { id: promotionId },
      meta: { requestId: id },
      error: null,
    },
    201,
  );
}

async function updatePromotion(req, env, promotionId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 30000);
  const validation = validatePromotion(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const productIds = uniqueIds(body.productIds);
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE promotions SET name=?,slug=?,description=?,coupon_code=?,starts_at=?,ends_at=?,rules_json=?,is_active=? WHERE id=?`,
    ).bind(
      String(body.name).trim().slice(0, 140),
      body.slug,
      String(body.description || "").slice(0, 3000),
      String(body.couponCode || "").slice(0, 80),
      body.startsAt,
      body.endsAt,
      JSON.stringify(promotionRules(body)),
      body.isActive === false ? 0 : 1,
      promotionId,
    ),
    env.DB.prepare(`DELETE FROM promotion_products WHERE promotion_id=?`).bind(
      promotionId,
    ),
    ...productIds.map((productId) =>
      env.DB.prepare(
        `INSERT INTO promotion_products(promotion_id,product_id) SELECT ?,id FROM products WHERE id=?`,
      ).bind(promotionId, productId),
    ),
  ]);
  const result = results[0];
  if (!result.meta.changes)
    return fail(
      req,
      env,
      "PROMOTION_NOT_FOUND",
      "Promoção não encontrada",
      404,
      id,
    );
  return ok(req, env, { id: promotionId, products: productIds.length }, id);
}

function uniqueIds(value) {
  return [
    ...new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => String(item))
        .filter((item) => /^[a-zA-Z0-9_-]{1,100}$/.test(item)),
    ),
  ].slice(0, 200);
}
function promotionRules(body) {
  const type = ["percentage", "fixed"].includes(body.discountType)
      ? body.discountType
      : "none",
    value = type === "none" ? 0 : Number(body.discountValue || 0);
  return { discountType: type, discountValue: value };
}
function validatePromotion(body) {
  if (!body || !String(body.name || "").trim())
    return "Informe o nome da promoção";
  if (!/^[a-z0-9-]{2,140}$/.test(String(body.slug || "")))
    return "O slug da promoção é inválido";
  if (!body.startsAt || !body.endsAt) return "Informe o início e o término";
  const start = Date.parse(body.startsAt),
    end = Date.parse(body.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return "O término deve ser posterior ao início";
  const type = body.discountType || "none",
    value = Number(body.discountValue || 0);
  if (!["none", "percentage", "fixed"].includes(type))
    return "O tipo de desconto é inválido";
  if (
    type === "percentage" &&
    (!Number.isFinite(value) || value <= 0 || value > 100)
  )
    return "A porcentagem deve ficar entre 0,01 e 100";
  if (
    type === "fixed" &&
    (!Number.isFinite(value) || value <= 0 || value > 1000000)
  )
    return "O valor do desconto é inválido";
  return null;
}

async function deletePromotion(req, env, promotionId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM promotion_products WHERE promotion_id=?").bind(
      promotionId,
    ),
    env.DB.prepare("DELETE FROM promotions WHERE id=?").bind(promotionId),
  ]);
  return ok(req, env, { deleted: true }, id);
}

async function adminDashboard(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const results = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) total FROM products"),
    env.DB.prepare(
      "SELECT COUNT(*) total FROM products WHERE status='published'",
    ),
    env.DB.prepare("SELECT COUNT(*) total FROM products WHERE status='draft'"),
    env.DB.prepare(
      "SELECT COUNT(*) total FROM offers WHERE availability='available'",
    ),
    env.DB.prepare(
      "SELECT COUNT(*) total FROM events WHERE event_type='offer_click'",
    ),
    env.DB.prepare("SELECT COUNT(*) total FROM categories WHERE is_active=1"),
    env.DB.prepare(
      "SELECT p.name,p.slug,p.view_count viewCount FROM products p ORDER BY p.view_count DESC LIMIT 5",
    ),
    env.DB.prepare(
      "SELECT event_type eventType,COUNT(*) total FROM events GROUP BY event_type ORDER BY total DESC LIMIT 8",
    ),
  ]);
  const total = (index) => Number(results[index].results?.[0]?.total || 0);
  return ok(
    req,
    env,
    {
      products: total(0),
      published: total(1),
      drafts: total(2),
      activeOffers: total(3),
      offerClicks: total(4),
      categories: total(5),
      topProducts: results[6].results || [],
      events: results[7].results || [],
    },
    id,
  );
}

async function adminProducts(req, env, url, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const status = (url.searchParams.get("status") || "").trim();
  let where = "1=1";
  const args = [];
  if (q) {
    where += " AND (p.name LIKE ? OR p.slug LIKE ?)";
    args.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    where += " AND p.status=?";
    args.push(status);
  }
  const { results } = await env.DB.prepare(
    `SELECT p.id,p.name,p.slug,p.product_type productType,p.status,p.editorial_score editorialScore,p.updated_at updatedAt,c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 WHERE ${where} ORDER BY p.updated_at DESC LIMIT 100`,
  )
    .bind(...args)
    .all();
  return ok(req, env, results, id);
}

async function adminCategories(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const { results } = await env.DB.prepare(
    "SELECT c.id,c.name,c.slug,c.description,c.icon,c.is_active isActive,c.sort_order sortOrder,COUNT(p.id) productCount FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name",
  ).all();
  return ok(req, env, results, id);
}

async function createCategory(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 20000);
  if (!body.name || !/^[a-z0-9-]{2,100}$/.test(String(body.slug || "")))
    return fail(req, env, "VALIDATION_ERROR", "Nome ou slug inválido", 422, id);
  const categoryId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO categories(id,name,slug,description,icon,is_active,sort_order) VALUES(?,?,?,?,?,?,?)",
  )
    .bind(
      categoryId,
      String(body.name).slice(0, 100),
      body.slug,
      String(body.description || "").slice(0, 1000),
      String(body.icon || "⌬").slice(0, 8),
      body.isActive === false ? 0 : 1,
      Number(body.sortOrder) || 0,
    )
    .run();
  return respond(
    req,
    env,
    {
      success: true,
      data: { id: categoryId },
      meta: { requestId: id },
      error: null,
    },
    201,
  );
}

async function updateCategory(req, env, categoryId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 20000);
  if (!body.name || !/^[a-z0-9-]{2,100}$/.test(String(body.slug || "")))
    return fail(req, env, "VALIDATION_ERROR", "Nome ou slug inválido", 422, id);
  const result = await env.DB.prepare(
    "UPDATE categories SET name=?,slug=?,description=?,icon=?,is_active=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
  )
    .bind(
      String(body.name).slice(0, 100),
      body.slug,
      String(body.description || "").slice(0, 1000),
      String(body.icon || "⌬").slice(0, 8),
      body.isActive === false ? 0 : 1,
      Number(body.sortOrder) || 0,
      categoryId,
    )
    .run();
  if (!result.meta.changes)
    return fail(
      req,
      env,
      "CATEGORY_NOT_FOUND",
      "Categoria não encontrada",
      404,
      id,
    );
  return ok(req, env, { id: categoryId }, id);
}

async function deleteCategory(req, env, categoryId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const used = await env.DB.prepare(
    "SELECT COUNT(*) total FROM products WHERE category_id=?",
  )
    .bind(categoryId)
    .first();
  if (Number(used?.total || 0) > 0)
    return fail(
      req,
      env,
      "CATEGORY_IN_USE",
      "A categoria possui produtos",
      409,
      id,
    );
  await env.DB.prepare("DELETE FROM categories WHERE id=?")
    .bind(categoryId)
    .run();
  return ok(req, env, { deleted: true }, id);
}

async function deleteProduct(req, env, productId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const result = await env.DB.prepare("DELETE FROM products WHERE id=?")
    .bind(productId)
    .run();
  if (!result.meta.changes)
    return fail(
      req,
      env,
      "PRODUCT_NOT_FOUND",
      "Produto não encontrado",
      404,
      id,
    );
  return ok(req, env, { deleted: true }, id);
}

async function adminPartners(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const { results } = await env.DB.prepare(
    `SELECT pa.id,pa.name,pa.slug,pa.website_url websiteUrl,pa.is_active isActive,COUNT(o.id) offerCount FROM partners pa LEFT JOIN offers o ON o.partner_id=pa.id GROUP BY pa.id ORDER BY pa.name`,
  ).all();
  return ok(req, env, results || [], id);
}

function validatePartner(body) {
  if (!body || !String(body.name || "").trim())
    return "Informe o nome do parceiro";
  if (!/^[a-z0-9-]{2,100}$/.test(String(body.slug || "")))
    return "O slug do parceiro é inválido";
  if (body.websiteUrl) {
    try {
      const url = new URL(String(body.websiteUrl));
      if (!["http:", "https:"].includes(url.protocol))
        return "O site deve usar HTTP ou HTTPS";
    } catch {
      return "Informe um site válido";
    }
  }
  return null;
}

async function createPartner(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 20000),
    validation = validatePartner(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const partnerId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO partners(id,name,slug,website_url,is_active) VALUES(?,?,?,?,?)`,
  )
    .bind(
      partnerId,
      String(body.name).trim().slice(0, 140),
      body.slug,
      String(body.websiteUrl || "")
        .trim()
        .slice(0, 1000) || null,
      body.isActive === false ? 0 : 1,
    )
    .run();
  return respond(
    req,
    env,
    {
      success: true,
      data: { id: partnerId },
      meta: { requestId: id },
      error: null,
    },
    201,
  );
}

async function updatePartner(req, env, partnerId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 20000),
    validation = validatePartner(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const result = await env.DB.prepare(
    `UPDATE partners SET name=?,slug=?,website_url=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  )
    .bind(
      String(body.name).trim().slice(0, 140),
      body.slug,
      String(body.websiteUrl || "")
        .trim()
        .slice(0, 1000) || null,
      body.isActive === false ? 0 : 1,
      partnerId,
    )
    .run();
  if (!result.meta.changes)
    return fail(
      req,
      env,
      "PARTNER_NOT_FOUND",
      "Parceiro não encontrado",
      404,
      id,
    );
  return ok(req, env, { id: partnerId }, id);
}

async function deletePartner(req, env, partnerId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const used = await env.DB.prepare(
    `SELECT COUNT(*) total FROM offers WHERE partner_id=?`,
  )
    .bind(partnerId)
    .first();
  if (Number(used?.total || 0) > 0)
    return fail(
      req,
      env,
      "PARTNER_IN_USE",
      "Este parceiro está vinculado a ofertas. Edite o nome ou remova as ofertas antes de excluir.",
      409,
      id,
    );
  const result = await env.DB.prepare(`DELETE FROM partners WHERE id=?`)
    .bind(partnerId)
    .run();
  if (!result.meta.changes)
    return fail(
      req,
      env,
      "PARTNER_NOT_FOUND",
      "Parceiro não encontrado",
      404,
      id,
    );
  return ok(req, env, { deleted: true }, id);
}

function optionalDate(value) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function validDestination(value) {
  const destination = String(value || "").trim();
  if (
    /^(?:produto|categoria|promocoes|produtos|busca|novidades)\.html(?:[?#].*)?$/.test(
      destination,
    )
  )
    return destination;
  try {
    const parsed = new URL(destination);
    return ["http:", "https:"].includes(parsed.protocol) ? destination : null;
  } catch {
    return null;
  }
}

async function storeSiteImage(env, file, prefix, ownerId) {
  if (
    !(file instanceof File) ||
    !file.type.startsWith("image/") ||
    file.size > 8 * 1024 * 1024
  )
    throw new Error("Envie uma imagem válida de até 8 MB");
  const extension = (file.name.split(".").pop() || "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const key = `site/${prefix}/${ownerId}/${crypto.randomUUID()}.${extension}`;
  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: { ownerId, originalName: file.name.slice(0, 120) },
  });
  return key;
}

async function adminBanners(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const { results } = await env.DB.prepare(
    `SELECT id,name,eyebrow,title,message,button_text buttonText,link_url linkUrl,desktop_storage_key desktopStorageKey,mobile_storage_key mobileStorageKey,alt_text altText,starts_at startsAt,ends_at endsAt,is_active isActive,sort_order sortOrder,created_at createdAt FROM banners ORDER BY sort_order,created_at DESC`,
  ).all();
  return ok(req, env, results || [], id);
}

async function saveBanner(req, env, bannerId, id, creating) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  if (!env.MEDIA)
    return fail(
      req,
      env,
      "R2_NOT_CONFIGURED",
      "O binding R2 MEDIA não foi configurado",
      503,
      id,
    );
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 18 * 1024 * 1024)
    return fail(
      req,
      env,
      "FILE_TOO_LARGE",
      "As imagens devem ter no máximo 8 MB cada",
      413,
      id,
    );
  const existing = creating
    ? null
    : await env.DB.prepare(
        "SELECT desktop_storage_key desktopStorageKey,mobile_storage_key mobileStorageKey FROM banners WHERE id=?",
      )
        .bind(bannerId)
        .first();
  if (!creating && !existing)
    return fail(req, env, "BANNER_NOT_FOUND", "Banner não encontrado", 404, id);
  const form = await req.formData();
  const name = String(form.get("name") || "")
    .trim()
    .slice(0, 140);
  const linkUrl = validDestination(form.get("linkUrl"));
  if (!name || !linkUrl)
    return fail(
      req,
      env,
      "VALIDATION_ERROR",
      "Informe o nome e um destino válido",
      422,
      id,
    );
  const startsAt = optionalDate(form.get("startsAt"));
  const endsAt = optionalDate(form.get("endsAt"));
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt))
    return fail(
      req,
      env,
      "VALIDATION_ERROR",
      "O término deve ser posterior ao início",
      422,
      id,
    );
  const desktopFile = form.get("desktopImage");
  const mobileFile = form.get("mobileImage");
  let desktopStorageKey = existing?.desktopStorageKey || null;
  let mobileStorageKey = existing?.mobileStorageKey || null;
  try {
    if (desktopFile instanceof File && desktopFile.size)
      desktopStorageKey = await storeSiteImage(
        env,
        desktopFile,
        "banners",
        bannerId,
      );
    if (mobileFile instanceof File && mobileFile.size)
      mobileStorageKey = await storeSiteImage(
        env,
        mobileFile,
        "banners",
        bannerId,
      );
  } catch (error) {
    return fail(req, env, "INVALID_FILE", error.message, 422, id);
  }
  if (!desktopStorageKey)
    return fail(
      req,
      env,
      "VALIDATION_ERROR",
      "Envie a imagem para computador",
      422,
      id,
    );
  const values = [
    name,
    String(form.get("eyebrow") || "").slice(0, 80),
    String(form.get("title") || "").slice(0, 180),
    String(form.get("message") || "").slice(0, 500),
    String(form.get("buttonText") || "Ver oferta").slice(0, 80),
    linkUrl,
    desktopStorageKey,
    mobileStorageKey,
    String(form.get("altText") || "").slice(0, 250),
    startsAt,
    endsAt,
    String(form.get("isActive")) === "true" ? 1 : 0,
    clamp(form.get("sortOrder"), -10000, 10000, 0),
  ];
  if (creating)
    await env.DB.prepare(
      `INSERT INTO banners(id,name,eyebrow,title,message,button_text,link_url,desktop_storage_key,mobile_storage_key,alt_text,starts_at,ends_at,is_active,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(bannerId, ...values)
      .run();
  else
    await env.DB.prepare(
      `UPDATE banners SET name=?,eyebrow=?,title=?,message=?,button_text=?,link_url=?,desktop_storage_key=?,mobile_storage_key=?,alt_text=?,starts_at=?,ends_at=?,is_active=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    )
      .bind(...values, bannerId)
      .run();
  const staleKeys = creating
    ? []
    : [
        existing.desktopStorageKey !== desktopStorageKey &&
          existing.desktopStorageKey,
        existing.mobileStorageKey !== mobileStorageKey &&
          existing.mobileStorageKey,
      ].filter(Boolean);
  if (staleKeys.length) await env.MEDIA.delete(staleKeys);
  return ok(req, env, { id: bannerId }, id);
}

async function createBanner(req, env, id) {
  return saveBanner(req, env, crypto.randomUUID(), id, true);
}

async function updateBanner(req, env, bannerId, id) {
  return saveBanner(req, env, bannerId, id, false);
}

async function deleteBanner(req, env, bannerId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const banner = await env.DB.prepare(
    "SELECT desktop_storage_key desktopStorageKey,mobile_storage_key mobileStorageKey FROM banners WHERE id=?",
  )
    .bind(bannerId)
    .first();
  if (!banner)
    return fail(req, env, "BANNER_NOT_FOUND", "Banner não encontrado", 404, id);
  await env.DB.prepare("DELETE FROM banners WHERE id=?").bind(bannerId).run();
  const keys = [
    ...new Set(
      [banner.desktopStorageKey, banner.mobileStorageKey].filter(Boolean),
    ),
  ];
  if (keys.length && env.MEDIA) await env.MEDIA.delete(keys);
  return ok(req, env, { deleted: true }, id);
}

const THEME_COLORS = [
  "headerBackground",
  "headerTextColor",
  "accentColor",
  "pageTextColor",
  "mutedTextColor",
];

function validateTheme(body) {
  if (!body || !String(body.name || "").trim()) return "Informe o nome do tema";
  for (const field of THEME_COLORS)
    if (!/^#[0-9a-fA-F]{6}$/.test(String(body[field] || "")))
      return `A cor ${field} deve estar no formato #RRGGBB`;
  if (!/^#[0-9a-fA-F]{6}$/.test(String(body.headerBackgroundEnd || "")))
    return "A segunda cor do cabeçalho deve estar no formato #RRGGBB";
  if (!/^#[0-9a-fA-F]{6}$/.test(String(body.logoTextColor || "")))
    return "A cor do logo deve estar no formato #RRGGBB";
  const startsAt = optionalDate(body.startsAt);
  const endsAt = optionalDate(body.endsAt);
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt))
    return "O término deve ser posterior ao início";
  return null;
}

function themeValues(body) {
  return [
    String(body.name).trim().slice(0, 140),
    String(body.holiday || "").slice(0, 140),
    String(body.headerBackground).toLowerCase(),
    String(body.headerBackgroundEnd).toLowerCase(),
    body.headerGradientEnabled ? 1 : 0,
    clamp(body.headerGradientAngle, 0, 360, 90),
    String(body.headerTextColor).toLowerCase(),
    String(body.accentColor).toLowerCase(),
    String(body.pageTextColor).toLowerCase(),
    String(body.mutedTextColor).toLowerCase(),
    String(body.logoText || "SHOPLAB")
      .trim()
      .slice(0, 40) || "SHOPLAB",
    String(body.logoTextColor).toLowerCase(),
    clamp(body.logoHeight, 20, 80, 36),
    body.logoStorageKey || null,
    body.logoHoverStorageKey || null,
    body.headerMediaStorageKey || null,
    Math.min(1, Math.max(0, Number(body.headerMediaOpacity) || 0)),
    ["left", "center", "right", "top", "bottom"].includes(
      body.headerMediaPosition,
    )
      ? body.headerMediaPosition
      : "center",
    ["cover", "contain", "auto", "custom"].includes(body.headerMediaSize)
      ? body.headerMediaSize
      : "cover",
    clamp(body.headerMediaScale, 10, 400, 100),
    body.headerMediaRepeat ? 1 : 0,
    optionalDate(body.startsAt),
    optionalDate(body.endsAt),
    body.isActive ? 1 : 0,
  ];
}

async function adminThemes(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const { results } = await env.DB.prepare(
    `SELECT id,name,holiday,header_background headerBackground,header_background_end headerBackgroundEnd,header_gradient_enabled headerGradientEnabled,header_gradient_angle headerGradientAngle,header_text_color headerTextColor,accent_color accentColor,page_text_color pageTextColor,muted_text_color mutedTextColor,logo_text logoText,logo_text_color logoTextColor,logo_height logoHeight,logo_storage_key logoStorageKey,logo_hover_storage_key logoHoverStorageKey,header_media_storage_key headerMediaStorageKey,header_media_opacity headerMediaOpacity,header_media_position headerMediaPosition,header_media_size headerMediaSize,header_media_scale headerMediaScale,header_media_repeat headerMediaRepeat,starts_at startsAt,ends_at endsAt,is_active isActive,created_at createdAt FROM seasonal_themes ORDER BY is_active DESC,created_at DESC`,
  ).all();
  return ok(req, env, results || [], id);
}

async function createTheme(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 30000);
  const validation = validateTheme(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const themeId = crypto.randomUUID();
  const statements = [];
  if (body.isActive)
    statements.push(
      env.DB.prepare(
        "UPDATE seasonal_themes SET is_active=0,updated_at=CURRENT_TIMESTAMP WHERE is_active=1",
      ),
    );
  statements.push(
    env.DB.prepare(
      `INSERT INTO seasonal_themes(id,name,holiday,header_background,header_background_end,header_gradient_enabled,header_gradient_angle,header_text_color,accent_color,page_text_color,muted_text_color,logo_text,logo_text_color,logo_height,logo_storage_key,logo_hover_storage_key,header_media_storage_key,header_media_opacity,header_media_position,header_media_size,header_media_scale,header_media_repeat,starts_at,ends_at,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(themeId, ...themeValues(body)),
  );
  await env.DB.batch(statements);
  return respond(
    req,
    env,
    {
      success: true,
      data: { id: themeId },
      meta: { requestId: id },
      error: null,
    },
    201,
  );
}

async function updateTheme(req, env, themeId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 30000);
  const validation = validateTheme(body);
  if (validation)
    return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const exists = await env.DB.prepare(
    "SELECT id,header_media_storage_key headerMediaStorageKey,logo_storage_key logoStorageKey,logo_hover_storage_key logoHoverStorageKey FROM seasonal_themes WHERE id=?",
  )
    .bind(themeId)
    .first();
  if (!exists)
    return fail(req, env, "THEME_NOT_FOUND", "Tema não encontrado", 404, id);
  body.headerMediaStorageKey = exists.headerMediaStorageKey;
  body.logoStorageKey = exists.logoStorageKey;
  body.logoHoverStorageKey = exists.logoHoverStorageKey;
  const statements = [];
  if (body.isActive)
    statements.push(
      env.DB.prepare(
        "UPDATE seasonal_themes SET is_active=0,updated_at=CURRENT_TIMESTAMP WHERE is_active=1 AND id<>?",
      ).bind(themeId),
    );
  statements.push(
    env.DB.prepare(
      `UPDATE seasonal_themes SET name=?,holiday=?,header_background=?,header_background_end=?,header_gradient_enabled=?,header_gradient_angle=?,header_text_color=?,accent_color=?,page_text_color=?,muted_text_color=?,logo_text=?,logo_text_color=?,logo_height=?,logo_storage_key=?,logo_hover_storage_key=?,header_media_storage_key=?,header_media_opacity=?,header_media_position=?,header_media_size=?,header_media_scale=?,header_media_repeat=?,starts_at=?,ends_at=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).bind(...themeValues(body), themeId),
  );
  await env.DB.batch(statements);
  return ok(req, env, { id: themeId }, id);
}

async function uploadThemeHeaderMedia(req, env, themeId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  if (!env.MEDIA)
    return fail(
      req,
      env,
      "R2_NOT_CONFIGURED",
      "O binding R2 MEDIA não foi configurado",
      503,
      id,
    );
  const theme = await env.DB.prepare(
    "SELECT header_media_storage_key headerMediaStorageKey FROM seasonal_themes WHERE id=?",
  )
    .bind(themeId)
    .first();
  if (!theme)
    return fail(req, env, "THEME_NOT_FOUND", "Tema não encontrado", 404, id);
  const form = await req.formData();
  const file = form.get("file");
  let storageKey;
  try {
    storageKey = await storeSiteImage(env, file, "theme-headers", themeId);
  } catch (error) {
    return fail(req, env, "INVALID_FILE", error.message, 422, id);
  }
  await env.DB.prepare(
    "UPDATE seasonal_themes SET header_media_storage_key=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
  )
    .bind(storageKey, themeId)
    .run();
  if (theme.headerMediaStorageKey)
    await env.MEDIA.delete(theme.headerMediaStorageKey);
  return ok(req, env, { id: themeId, headerMediaStorageKey: storageKey }, id);
}

async function uploadThemeLogoMedia(req, env, themeId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  if (!env.MEDIA)
    return fail(req, env, "R2_NOT_CONFIGURED", "O binding R2 MEDIA não foi configurado", 503, id);
  const theme = await env.DB.prepare(
    "SELECT logo_storage_key logoStorageKey,logo_hover_storage_key logoHoverStorageKey FROM seasonal_themes WHERE id=?",
  ).bind(themeId).first();
  if (!theme)
    return fail(req, env, "THEME_NOT_FOUND", "Tema não encontrado", 404, id);
  const form = await req.formData();
  const kind = form.get("kind") === "hover" ? "hover" : "main";
  let storageKey;
  try {
    storageKey = await storeSiteImage(env, form.get("file"), "theme-logos", themeId);
  } catch (error) {
    return fail(req, env, "INVALID_FILE", error.message, 422, id);
  }
  const column = kind === "hover" ? "logo_hover_storage_key" : "logo_storage_key";
  await env.DB.prepare(
    `UPDATE seasonal_themes SET ${column}=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(storageKey, themeId).run();
  const staleKey = kind === "hover" ? theme.logoHoverStorageKey : theme.logoStorageKey;
  if (staleKey) await env.MEDIA.delete(staleKey);
  return ok(req, env, { id: themeId, kind, storageKey }, id);
}

async function deleteTheme(req, env, themeId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const theme = await env.DB.prepare(
    "SELECT header_media_storage_key headerMediaStorageKey,logo_storage_key logoStorageKey,logo_hover_storage_key logoHoverStorageKey FROM seasonal_themes WHERE id=?",
  )
    .bind(themeId)
    .first();
  const result = await env.DB.prepare("DELETE FROM seasonal_themes WHERE id=?")
    .bind(themeId)
    .run();
  if (!result.meta.changes)
    return fail(req, env, "THEME_NOT_FOUND", "Tema não encontrado", 404, id);
  if (theme?.headerMediaStorageKey && env.MEDIA)
    await env.MEDIA.delete(theme.headerMediaStorageKey);
  if (env.MEDIA) {
    const logoKeys = [theme?.logoStorageKey, theme?.logoHoverStorageKey].filter(Boolean);
    if (logoKeys.length) await env.MEDIA.delete(logoKeys);
  }
  return ok(req, env, { deleted: true }, id);
}

async function requireAdmin(req, env) {
  const token = cookie(req, "shoplab_session");
  if (!token) return false;
  const row = await env.DB.prepare(
    `SELECT id FROM admin_sessions WHERE token_hash=? AND expires_at>CURRENT_TIMESTAMP`,
  )
    .bind(await sha256(token))
    .first();
  return Boolean(row);
}
async function verifyTurnstile(token, req, env) {
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", String(token).slice(0, 2048));
  body.append("remoteip", req.headers.get("CF-Connecting-IP") || "");
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  return res.json();
}
function validateProduct(b) {
  if (!b || typeof b !== "object") return "Dados inválidos";
  if (!String(b.name || "").trim() || String(b.name).length > 160)
    return "Nome inválido";
  if (!/^[a-z0-9-]{2,160}$/.test(String(b.slug || ""))) return "Slug inválido";
  if (
    b.editorialScore !== null &&
    b.editorialScore !== "" &&
    (!Number.isFinite(Number(b.editorialScore)) ||
      Number(b.editorialScore) < 0 ||
      Number(b.editorialScore) > 100)
  )
    return "A nota editorial deve ficar entre 0 e 100";
  return null;
}
async function readJson(req, max) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > max)
    throw Object.assign(new Error("Payload muito grande"), { status: 413 });
  return req.json();
}
function normalizeProduct(r) {
  const price = Number(r.price || 0),
    old = Number(r.oldPrice || 0);
  return {
    ...r,
    price,
    oldPrice: old,
    discount: old > price ? Math.round((1 - price / old) * 100) : 0,
    tag: r.isFeatured ? "Escolha SHOPLAB" : "Analisado",
  };
}
function parse(v, fallback) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function text(value, maxLength) {
  return value == null ? null : String(value).slice(0, maxLength);
}

function clamp(value, min, max, fallback) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, Math.trunc(number)))
    : fallback;
}

function cookie(req, name) {
  return (
    req.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ""
  );
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function safeEqual(a, b = "") {
  const aa = enc.encode(a);
  const bb = enc.encode(b);

  if (aa.length !== bb.length) {
    await crypto.subtle.digest("SHA-256", aa);
    return false;
  }

  let difference = 0;
  for (let index = 0; index < aa.length; index += 1) {
    difference |= aa[index] ^ bb[index];
  }
  return difference === 0;
}
function ok(req, env, data, id, meta = {}) {
  return respond(req, env, {
    success: true,
    data,
    meta: { ...meta, requestId: id },
    error: null,
  });
}
function fail(req, env, code, message, status, id) {
  return respond(
    req,
    env,
    {
      success: false,
      data: null,
      meta: null,
      error: { code, message, requestId: id },
    },
    status,
  );
}
function respond(req, env, body, status = 200) {
  return cors(
    req,
    env,
    new Response(JSON.stringify(body), { status, headers: JSON_HEADERS }),
  );
}
function cors(req, env, res) {
  const origin = req.headers.get("origin"),
    allowed = allowedOrigins(env);
  if (origin && allowed.includes(origin)) {
    res.headers.set("access-control-allow-origin", origin);
    res.headers.set("vary", "Origin");
    res.headers.set("access-control-allow-credentials", "true");
  }
  res.headers.set(
    "access-control-allow-methods",
    "GET,POST,PUT,DELETE,OPTIONS",
  );
  res.headers.set("access-control-allow-headers", "Content-Type");
  return res;
}
