const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
};
const enc = new TextEncoder();
const BUILT_IN_ORIGINS = ["https://shoplab.com.br"];
const SUPABASE_URL = "https://oqfizduaciuutvtlqmni.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VYMjF0XGyXzJSiZ9H1Tt_w_nr_ynDyQ";
const REFERRAL_PUBLIC_ORIGIN = "https://link.shoplab.com.br";
const WORKER_BUILD = "2026-07-21-premium-comparison-insights-v10";

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
      if (/no such table:.*header_spotlight/i.test(detail))
        return respond(
          request,
          env,
          {
            success: false,
            data: null,
            meta: null,
            error: {
              code: "HEADER_SPOTLIGHT_MIGRATION_REQUIRED",
              message:
                "Execute header-spotlight-upgrade.sql no banco D1 e publique novamente.",
              requestId,
            },
          },
          503,
        );
      if (/no such column:.*(?:spotlight_position_x|spotlight_position_y|spotlight_scale)/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"HEADER_SPOTLIGHT_IMAGE_CONTROLS_MIGRATION_REQUIRED",message:"Execute header-spotlight-image-controls-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such table:.*user_profiles/i.test(detail))
        return respond(
          request,
          env,
          {
            success: false,
            data: null,
            meta: null,
            error: {
              code: "USER_AUTH_MIGRATION_REQUIRED",
              message: "Execute user-auth-upgrade.sql no banco D1 e publique novamente.",
              requestId,
            },
          },
          503,
        );
      if (/no such table:.*(?:user_favorites|user_ratings|user_cart|user_view_history)/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"USER_LIBRARY_MIGRATION_REQUIRED",message:"Execute user-library-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such column:.*user_id/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"PERSONALIZATION_MIGRATION_REQUIRED",message:"Execute personalized-recommendations-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such column:.*targeting_json/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"BANNER_PERSONALIZATION_MIGRATION_REQUIRED",message:"Execute banner-personalization-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such column:.*(?:desktop_position_x|desktop_position_y|desktop_scale|mobile_position_x|mobile_position_y|mobile_scale)/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"BANNER_IMAGE_CONTROLS_MIGRATION_REQUIRED",message:"Execute banner-image-controls-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such (?:table|column):.*(?:user_sessions|share_links|share_visits|referrals|referral_rewards|last_seen_at|blocked_until|moderation_note)/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"USER_ENGAGEMENT_MIGRATION_REQUIRED",message:"Execute user-engagement-referrals-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such table:.*(?:gift_card_types|reward_gift_cards)/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"GIFT_CARD_MIGRATION_REQUIRED",message:"Execute gift-card-rewards-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such table:.*manual_user_rewards/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"MANUAL_REWARDS_MIGRATION_REQUIRED",message:"Execute manual-user-rewards-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such column:.*redeemed_at/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"MANUAL_REWARD_REDEMPTION_MIGRATION_REQUIRED",message:"Execute manual-reward-redemption-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such column:.*price_(?:source|sync)/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"PRICE_SYNC_MIGRATION_REQUIRED",message:"Execute mercadolivre-price-sync-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
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
      if (/no such column:.*logo_url/i.test(detail))
        return respond(
          request,
          env,
          {
            success: false,
            data: null,
            meta: null,
            error: {
              code: "BRAND_STORE_LOGO_MIGRATION_REQUIRED",
              message:
                "Execute brand-store-logo-upgrade.sql no banco D1 e publique novamente.",
              requestId,
            },
          },
          503,
        );
      if (/no such column:.*image_storage_key/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"CATEGORY_IMAGE_MIGRATION_REQUIRED",message:"Execute category-image-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such column:.*image_scale/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"CATEGORY_IMAGE_SCALE_MIGRATION_REQUIRED",message:"Execute category-image-scale-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such column:.*image_position_/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"CATEGORY_IMAGE_POSITION_MIGRATION_REQUIRED",message:"Execute category-image-position-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such table:.*comparison_analysis_cache/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"COMPARISON_CACHE_MIGRATION_REQUIRED",message:"Execute comparison-analysis-cache-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such table:.*(?:premium_subscriptions|premium_ai_usage|premium_pass_payments|premium_notification_log)/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"PREMIUM_SUBSCRIPTIONS_MIGRATION_REQUIRED",message:"Execute premium-subscriptions-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
      if (/no such table:.*premium_settings/i.test(detail))
        return respond(request,env,{success:false,data:null,meta:null,error:{code:"PREMIUM_SETTINGS_MIGRATION_REQUIRED",message:"Execute premium-settings-upgrade.sql no banco D1 e publique novamente.",requestId}},503);
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
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(Promise.allSettled([
      syncMercadoLivrePrices(env, { limit: 40 }),
      sendPremiumPassExpiryReminders(env),
    ]));
  },
};

async function route(request, env, ctx, requestId) {
  const url = new URL(request.url),
    path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS")
    return cors(request, env, new Response(null, { status: 204 }));
  if (path === "/api/v1/health")
    return ok(request, env, { status: "ok", build: WORKER_BUILD }, requestId);

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
  if (request.method === "GET" && /^\/s\/[^/]+$/.test(path))
    return attributedShareRedirect(request, env, path.split("/").pop());
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
  if (request.method === "POST" && path === "/api/v1/comparisons/analyze")
    return analyzeProductComparison(request, env, ctx, requestId);
  if (request.method === "POST" && path === "/api/v1/payments/mercadopago/webhook")
    return mercadoPagoWebhook(request, env);
  if (request.method === "POST" && path === "/api/v1/payments/stripe/webhook")
    return stripeWebhook(request, env);
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
    return suggestionsV2(request, env, url, ctx, requestId);
  if (request.method === "GET" && path === "/api/v1/search/trending")
    return trendingSearches(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/ratings")
    return publicRatingSummaries(request, env, url, requestId);
  if (request.method === "GET" && path.startsWith("/go/"))
    return redirectOffer(request, env, path, ctx);
  if (request.method === "GET" && path.startsWith("/media/"))
    return serveMedia(request, env, decodeURIComponent(path.slice(7)));
  if (request.method === "POST" && path === "/api/v1/events")
    return recordEvent(request, env, ctx, requestId);
  if (path === "/api/v1/user/profile" && request.method === "GET")
    return userProfile(request, env, requestId);
  if (path === "/api/v1/user/profile" && request.method === "PUT")
    return updateUserProfile(request, env, requestId);
  if (path === "/api/v1/user/subscription" && request.method === "GET")
    return userPremiumSubscription(request, env, requestId);
  if (path === "/api/v1/user/subscription/checkout" && request.method === "POST")
    return createPremiumCheckout(request, env, requestId);
  if (path === "/api/v1/user/subscription/payment-config" && request.method === "GET")
    return premiumPaymentConfig(request, env, requestId);
  if (path === "/api/v1/user/subscription/pass-checkout" && request.method === "POST")
    return createPremiumPassCheckout(request, env, requestId);
  if (path === "/api/v1/user/subscription/cancel" && request.method === "PUT")
    return cancelPremiumSubscription(request, env, requestId);
  if (path === "/api/v1/user/library" && request.method === "GET")
    return userLibrary(request, env, requestId);
  if (path === "/api/v1/user/recommendations" && request.method === "GET")
    return personalizedRecommendations(request, env, requestId);
  if (path === "/api/v1/user/history/sync" && request.method === "POST")
    return syncUserHistory(request, env, requestId);
  if (path === "/api/v1/user/presence" && request.method === "POST")
    return recordUserPresence(request, env, requestId);
  if (path === "/api/v1/user/referrals" && request.method === "GET")
    return userReferrals(request, env, requestId);
  if (path === "/api/v1/user/rewards" && request.method === "GET")
    return userManualRewards(request, env, requestId);
  if (request.method === "PUT" && /^\/api\/v1\/user\/rewards\/[^/]+\/redeem$/.test(path))
    return redeemManualUserReward(request, env, path.split("/").at(-2), requestId);
  if (path === "/api/v1/user/share-links" && request.method === "POST")
    return createUserShareLink(request, env, requestId);
  if (request.method === "PUT" && /^\/api\/v1\/user\/(favorites|ratings|cart)\/[^/]+$/.test(path))
    return updateUserLibraryItem(request, env, path, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/auth/login")
    return login(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/auth/logout")
    return logout(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/auth/session")
    return sessionStatus(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/dashboard")
    return adminDashboard(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/premium-settings")
    return adminPremiumSettings(request, env, requestId);
  if (request.method === "PUT" && path === "/api/v1/admin/premium-settings")
    return updateAdminPremiumSettings(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/users")
    return adminUsers(request, env, url, requestId);
  if (request.method === "GET" && /^\/api\/v1\/admin\/users\/[^/]+\/events$/.test(path))
    return adminUserEvents(request, env, path.split("/").at(-2), url, requestId);
  if (request.method === "GET" && /^\/api\/v1\/admin\/users\/[^/]+$/.test(path))
    return adminUserDetail(request, env, path.split("/").pop(), requestId);
  if (request.method === "PUT" && /^\/api\/v1\/admin\/users\/[^/]+\/access$/.test(path))
    return updateAdminUserAccess(request, env, path.split("/").at(-2), requestId);
  if (request.method === "POST" && /^\/api\/v1\/admin\/users\/[^/]+\/rewards$/.test(path))
    return createManualUserReward(request, env, path.split("/").at(-2), requestId);
  if (request.method === "DELETE" && /^\/api\/v1\/admin\/users\/[^/]+\/rewards\/[^/]+$/.test(path))
    return deleteManualUserReward(request, env, path.split("/").at(-3), path.split("/").pop(), requestId);
  if (request.method === "GET" && path === "/api/v1/admin/referral-rewards")
    return adminReferralRewards(request, env, url, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/gift-card-types")
    return adminGiftCardTypes(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/gift-card-types")
    return createGiftCardType(request, env, requestId);
  if (request.method === "PUT" && /^\/api\/v1\/admin\/gift-card-types\/[^/]+$/.test(path))
    return updateGiftCardType(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && /^\/api\/v1\/admin\/gift-card-types\/[^/]+$/.test(path))
    return deleteGiftCardType(request, env, path.split("/").pop(), requestId);
  if (request.method === "PUT" && /^\/api\/v1\/admin\/referral-rewards\/[^/]+\/gift-card$/.test(path))
    return deliverReferralGiftCard(request, env, path.split("/").at(-2), requestId);
  if (request.method === "PUT" && /^\/api\/v1\/admin\/referral-rewards\/[^/]+$/.test(path))
    return updateReferralReward(request, env, path.split("/").pop(), requestId);
  if (request.method === "POST" && path === "/api/v1/admin/ai/product-draft")
    return adminAiProductDraft(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/products/import-link")
    return adminImportProductLink(request, env, requestId);
  if (request.method === "POST" && /^\/api\/v1\/admin\/products\/[^/]+\/sync-price$/.test(path))
    return adminSyncProductPrice(request, env, path.split("/").at(-2), requestId);
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
  if (request.method === "GET" && path === "/api/v1/admin/brands")
    return adminBrands(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/brands")
    return createBrand(request, env, requestId);
  if (request.method === "PUT" && path.startsWith("/api/v1/admin/brands/"))
    return updateBrand(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && path.startsWith("/api/v1/admin/brands/"))
    return deleteBrand(request, env, path.split("/").pop(), requestId);
  if (request.method === "POST" && path === "/api/v1/admin/partners")
    return createPartner(request, env, requestId);
  if (request.method === "PUT" && path.startsWith("/api/v1/admin/partners/"))
    return updatePartner(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && path.startsWith("/api/v1/admin/partners/"))
    return deletePartner(request, env, path.split("/").pop(), requestId);
  if (request.method === "GET" && path === "/api/v1/admin/banners")
    return adminBanners(request, env, requestId);
  if (request.method === "GET" && path === "/api/v1/admin/header-spotlights")
    return adminHeaderSpotlights(request, env, requestId);
  if (request.method === "POST" && path === "/api/v1/admin/header-spotlights")
    return createHeaderSpotlight(request, env, requestId);
  if (
    request.method === "POST" &&
    /^\/api\/v1\/admin\/header-spotlights\/[^/]+\/media$/.test(path)
  )
    return uploadHeaderSpotlightMedia(request, env, path.split("/").at(-2), requestId);
  if (request.method === "PUT" && /^\/api\/v1\/admin\/header-spotlights\/[^/]+$/.test(path))
    return updateHeaderSpotlight(request, env, path.split("/").pop(), requestId);
  if (request.method === "DELETE" && /^\/api\/v1\/admin\/header-spotlights\/[^/]+$/.test(path))
    return deleteHeaderSpotlight(request, env, path.split("/").pop(), requestId);
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
    `SELECT c.id,c.name,c.slug,c.description,c.icon,c.image_storage_key imageStorageKey,c.image_scale imageScale,c.image_position_x imagePositionX,c.image_position_y imagePositionY,COUNT(p.id) count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.status='published' WHERE c.is_active=1 GROUP BY c.id ORDER BY c.sort_order,c.name`,
  ).all();
  const origin=new URL(req.url).origin;
  return ok(req, env, (results||[]).map(category=>({...category,imageUrl:category.imageStorageKey?`${origin}/media/${encodeURIComponent(category.imageStorageKey)}`:null})), id);
}

async function publicSiteConfig(req, env, id) {
  const [banners, theme, stores, brands, headerPromotions, headerSpotlights] = await env.DB.batch([
    env.DB.prepare(
      `SELECT id,name,eyebrow,title,message,button_text buttonText,link_url linkUrl,desktop_storage_key desktopStorageKey,mobile_storage_key mobileStorageKey,alt_text altText,desktop_position_x desktopPositionX,desktop_position_y desktopPositionY,desktop_scale desktopScale,mobile_position_x mobilePositionX,mobile_position_y mobilePositionY,mobile_scale mobileScale,targeting_json targetingJson,sort_order sortOrder FROM banners WHERE is_active=1 AND (starts_at IS NULL OR datetime(starts_at)<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR datetime(ends_at)>=CURRENT_TIMESTAMP) ORDER BY sort_order,created_at DESC`,
    ),
    env.DB.prepare(
      `SELECT id,name,holiday,header_background headerBackground,header_background_end headerBackgroundEnd,header_gradient_enabled headerGradientEnabled,header_gradient_angle headerGradientAngle,header_text_color headerTextColor,accent_color accentColor,page_text_color pageTextColor,muted_text_color mutedTextColor,logo_text logoText,logo_text_color logoTextColor,logo_height logoHeight,logo_storage_key logoStorageKey,logo_hover_storage_key logoHoverStorageKey,header_media_storage_key headerMediaStorageKey,header_media_opacity headerMediaOpacity,header_media_position headerMediaPosition,CASE WHEN lower(header_media_storage_key) LIKE '%.gif' AND header_media_size='cover' THEN 'contain' ELSE header_media_size END headerMediaSize,header_media_scale headerMediaScale,header_media_repeat headerMediaRepeat FROM seasonal_themes WHERE is_active=1 AND (starts_at IS NULL OR datetime(starts_at)<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR datetime(ends_at)>=CURRENT_TIMESTAMP) LIMIT 1`,
    ),
    env.DB.prepare(
      `SELECT pa.id,pa.name,pa.slug,pa.logo_url logoUrl,COUNT(DISTINCT o.product_id) productCount FROM partners pa JOIN offers o ON o.partner_id=pa.id AND o.availability='available' JOIN products p ON p.id=o.product_id AND p.status='published' WHERE pa.is_active=1 GROUP BY pa.id ORDER BY productCount DESC,pa.name`,
    ),
    env.DB.prepare(
      `SELECT b.id,b.name,b.slug,b.logo_url logoUrl,COUNT(p.id) productCount FROM brands b JOIN products p ON p.brand_id=b.id AND p.status='published' WHERE b.is_active=1 GROUP BY b.id ORDER BY productCount DESC,b.name`,
    ),
    env.DB.prepare(
      `SELECT name,slug,coupon_code couponCode,rules_json rulesJson FROM promotions WHERE is_active=1 AND datetime(starts_at)<=CURRENT_TIMESTAMP AND datetime(ends_at)>=CURRENT_TIMESTAMP ORDER BY datetime(ends_at) LIMIT 3`,
    ),
    env.DB.prepare(
      `SELECT id,name,storage_key storageKey,link_url linkUrl,alt_text altText,spotlight_position_x imagePositionX,spotlight_position_y imagePositionY,spotlight_scale imageScale FROM header_spotlights WHERE is_active=1 AND storage_key IS NOT NULL AND (starts_at IS NULL OR datetime(starts_at)<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR datetime(ends_at)>=CURRENT_TIMESTAMP) ORDER BY sort_order,created_at LIMIT 12`,
    ),
  ]);
  const origin = new URL(req.url).origin;
  const rankedBanners=await personalizeBanners(req,env,banners.results||[]);
  const mediaUrl = (key) =>
    key ? `${origin}/media/${encodeURIComponent(key)}` : null;
  const response = ok(
    req,
    env,
    {
      banners: rankedBanners.map((banner) => ({
        ...banner,
        targetingJson: undefined,
        personalizationScore: undefined,
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
      headerSpotlights: (headerSpotlights.results || []).map((spotlight) => ({
        ...spotlight,
        mediaUrl: mediaUrl(spotlight.storageKey),
      })),
      stores: stores.results || [],
      brands: brands.results || [],
      headerPromotions: (headerPromotions.results || []).map((promotion) => ({
        ...promotion,
        ...parse(promotion.rulesJson, {}),
      })),
    },
    id,
  );
  response.headers.set("cache-control", "no-store, max-age=0");
  return response;
}

async function personalizeBanners(req,env,banners){
  if(banners.length<2||!req.headers.has("authorization"))return banners;
  const user=await authenticatedUser(req);
  if(!user)return banners;
  const [searches,categories]=await env.DB.batch([
    env.DB.prepare(`SELECT query_text query,COUNT(*) weight FROM events WHERE user_id=? AND event_type IN ('search','search_no_results') AND query_text IS NOT NULL AND created_at>=datetime('now','-30 days') GROUP BY query_text ORDER BY MAX(created_at) DESC LIMIT 20`).bind(user.id),
    env.DB.prepare(`WITH signals AS (
      SELECT product_slug,8 weight FROM user_favorites WHERE user_id=?
      UNION ALL SELECT product_slug,10 FROM user_cart WHERE user_id=?
      UNION ALL SELECT product_slug,rating*2 FROM user_ratings WHERE user_id=?
      UNION ALL SELECT product_slug,2 FROM user_view_history WHERE user_id=?
      UNION ALL SELECT product_slug,CASE event_type WHEN 'offer_click' THEN 12 WHEN 'search_result_click' THEN 6 WHEN 'product_view' THEN 3 ELSE 0 END FROM events WHERE user_id=? AND product_slug IS NOT NULL AND created_at>=datetime('now','-90 days')
    ) SELECT c.slug,SUM(signals.weight) weight FROM signals JOIN products p ON p.slug=signals.product_slug JOIN categories c ON c.id=p.category_id GROUP BY c.id`).bind(user.id,user.id,user.id,user.id,user.id),
  ]);
  const queryWeights=new Map((searches.results||[]).map(row=>[normalizeSearch(row.query),Number(row.weight||1)]));
  const categoryWeights=new Map((categories.results||[]).map(row=>[row.slug,Number(row.weight||0)]));
  return banners.map((banner,index)=>{
    const targeting=parse(banner.targetingJson,{}),keywords=Array.isArray(targeting.keywords)?targeting.keywords:[],categorySlugs=Array.isArray(targeting.categories)?targeting.categories:[];
    let score=0;
    for(const keyword of keywords){const normalized=normalizeSearch(keyword);for(const [query,weight] of queryWeights)if(normalized&&(query.includes(normalized)||normalized.includes(query)))score+=weight*5}
    for(const slug of categorySlugs)score+=(categoryWeights.get(slug)||0)*2;
    return {...banner,personalizationScore:score,_originalIndex:index};
  }).sort((a,b)=>b.personalizationScore-a.personalizationScore||a._originalIndex-b._originalIndex).map(({_originalIndex,...banner})=>banner);
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
      COALESCE(o.current_price_cents,p.base_price_cents) price,
      COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,
      (SELECT pm.storage_key FROM product_media pm WHERE pm.product_id=p.id AND pm.type='image' ORDER BY pm.is_primary DESC,pm.sort_order,pm.created_at LIMIT 1) storageKey,
      (SELECT pm.external_url FROM product_media pm WHERE pm.product_id=p.id AND pm.type='image' ORDER BY pm.is_primary DESC,pm.sort_order,pm.created_at LIMIT 1) externalUrl
    FROM products p
    LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1
      AND o.availability='available'
      AND (o.starts_at IS NULL OR datetime(o.starts_at)<=CURRENT_TIMESTAMP)
      AND (o.ends_at IS NULL OR datetime(o.ends_at)>=CURRENT_TIMESTAMP)
    WHERE p.slug=? AND p.status='published'`,
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
  const price = Number(product.price || 0);
  const oldPrice = Number(product.oldPrice || 0);
  const money = (value) =>
    (Number(value) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  const priceDescription = price
    ? oldPrice > price
      ? `De ${money(oldPrice)} por ${money(price)}.`
      : `Por ${money(price)}.`
    : "";
  const productDescription = String(product.shortDescription || "").trim();
  const description = [priceDescription, productDescription]
    .filter(Boolean)
    .join(" ") || `Confira ${product.name} na SHOPLAB.`;
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
    category = url.searchParams.get("category"),
    store = url.searchParams.get("store");
  let where = `p.status='published'`,
    args = [];
  if (category) {
    where += ` AND c.slug=?`;
    args.push(category);
  }
  if (store) {
    where += ` AND EXISTS (SELECT 1 FROM offers store_offer JOIN partners store_partner ON store_partner.id=store_offer.partner_id WHERE store_offer.product_id=p.id AND store_offer.availability='available' AND store_partner.slug=? AND store_partner.is_active=1)`;
    args.push(store);
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
    `SELECT p.id,p.name,p.slug,p.product_type productType,p.short_description shortDescription,p.editorial_score editorialScore,p.is_featured isFeatured,p.updated_at updatedAt,c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId,pm.storage_key primaryStorageKey,pm.external_url primaryExternalUrl,pm.alt_text primaryImageAlt FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 LEFT JOIN partners pa ON pa.id=o.partner_id LEFT JOIN product_media pm ON pm.id=(SELECT selected_media.id FROM product_media selected_media WHERE selected_media.product_id=p.id AND selected_media.type='image' ORDER BY selected_media.is_primary DESC,selected_media.sort_order,selected_media.created_at LIMIT 1) WHERE ${where} ORDER BY p.is_featured DESC,p.updated_at DESC LIMIT ? OFFSET ?`,
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
      `SELECT p.id,p.name,p.slug,p.product_type productType,p.short_description shortDescription,p.editorial_score editorialScore,p.is_featured isFeatured,p.view_count viewCount,p.updated_at updatedAt,c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId,pm.storage_key primaryStorageKey,pm.external_url primaryExternalUrl,pm.alt_text primaryImageAlt,pp.promotion_id promotionId FROM promotion_products pp JOIN products p ON p.id=pp.product_id LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 LEFT JOIN partners pa ON pa.id=o.partner_id LEFT JOIN product_media pm ON pm.id=(SELECT selected_media.id FROM product_media selected_media WHERE selected_media.product_id=p.id AND selected_media.type='image' ORDER BY selected_media.is_primary DESC,selected_media.sort_order,selected_media.created_at LIMIT 1) JOIN promotions pr ON pr.id=pp.promotion_id WHERE p.status='published' AND pr.is_active=1 AND datetime(pr.starts_at)<=CURRENT_TIMESTAMP AND datetime(pr.ends_at)>=CURRENT_TIMESTAMP ORDER BY p.is_featured DESC,p.editorial_score DESC`,
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
  COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId,
  pm.storage_key primaryStorageKey,pm.external_url primaryExternalUrl,pm.alt_text primaryImageAlt
  FROM products p
  LEFT JOIN categories c ON c.id=p.category_id
  LEFT JOIN brands b ON b.id=p.brand_id
  LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1
  LEFT JOIN partners pa ON pa.id=o.partner_id
  LEFT JOIN product_media pm ON pm.id=(
    SELECT selected_media.id FROM product_media selected_media
    WHERE selected_media.product_id=p.id AND selected_media.type='image'
    ORDER BY selected_media.is_primary DESC,selected_media.sort_order,selected_media.created_at
    LIMIT 1
  )`;

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
    `SELECT id,name,slug,category_id categoryId,brand_id brandId,product_type productType,short_description shortDescription,full_description fullDescription,target_audience targetAudience,tags_json tagsJson,specifications_json specificationsJson,editorial_score editorialScore FROM products WHERE slug=? AND status='published'`,
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
    ) DESC,p.updated_at DESC LIMIT 30`,
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
  const candidates = results.map(normalizeProduct);
  const aiRanked = await rankRelatedProductsWithAi(env, source, candidates);
  const response = ok(req, env, (aiRanked || candidates).slice(0, 8), id, {
    strategy: aiRanked
      ? "ai-context+manual+category+brand+type+score+activity"
      : "manual+category+brand+type+score+activity",
    aiRanked: Boolean(aiRanked),
    candidatesEvaluated: candidates.length,
  });
  response.headers.set("cache-control", "public, max-age=300");
  return response;
}

const RELATED_PRODUCTS_SCHEMA = {
  type: "object",
  properties: {
    productIds: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
  },
  required: ["productIds"],
  additionalProperties: false,
};

const PRODUCT_COMPARISON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    criteria: {
      type: "array",
      maxItems: 24,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          explanation: { type: "string" },
          winnerSlugs: { type: "array", maxItems: 3, items: { type: "string" } },
          values: {
            type: "array",
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                productSlug: { type: "string" },
                sourceName: { type: ["string", "null"] },
                assessment: { type: "string", enum: ["best", "good", "neutral", "weak"] },
                note: { type: "string" },
              },
              required: ["productSlug", "sourceName", "assessment", "note"],
              additionalProperties: false,
            },
          },
        },
        required: ["label", "explanation", "winnerSlugs", "values"],
        additionalProperties: false,
      },
    },
    verdict: {
      type: "object",
      properties: {
        bestValueSlug: { type: ["string", "null"] },
        bestOverallSlug: { type: ["string", "null"] },
        headline: { type: "string" },
        reasoning: { type: "string" },
        tradeoffs: { type: "array", maxItems: 4, items: { type: "string" } },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        worthPayingMore: { type: "string", enum: ["yes", "no", "depends"] },
        worthPayingMoreReason: { type: "string" },
        evidence: { type: "array", maxItems: 6, items: { type: "string" } },
      },
      required: ["bestValueSlug", "bestOverallSlug", "headline", "reasoning", "tradeoffs", "confidence", "worthPayingMore", "worthPayingMoreReason", "evidence"],
      additionalProperties: false,
    },
    profileScores: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          productSlug: { type: "string" },
          performance: { type: "integer", minimum: 0, maximum: 100 },
          value: { type: "integer", minimum: 0, maximum: 100 },
          work: { type: "integer", minimum: 0, maximum: 100 },
          gaming: { type: "integer", minimum: 0, maximum: 100 },
          study: { type: "integer", minimum: 0, maximum: 100 },
          portability: { type: "integer", minimum: 0, maximum: 100 },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          missingData: { type: "array", maxItems: 6, items: { type: "string" } },
        },
        required: ["productSlug", "performance", "value", "work", "gaming", "study", "portability", "confidence", "missingData"],
        additionalProperties: false,
      },
    },

    recommendations: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          productSlug: { type: "string" },
          bestFor: { type: "string" },
          highlights: { type: "array", maxItems: 4, items: { type: "string" } },
        },
        required: ["productSlug", "bestFor", "highlights"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "criteria", "verdict", "recommendations"],
  additionalProperties: false,
};

const PREMIUM_COMPARISON_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    verdict: {
      type: "object",
      properties: {
        bestValueSlug: { type: ["string", "null"] },
        bestOverallSlug: { type: ["string", "null"] },
        headline: { type: "string" },
        reasoning: { type: "string" },
        tradeoffs: { type: "array", maxItems: 4, items: { type: "string" } },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        worthPayingMore: { type: "string", enum: ["yes", "no", "depends"] },
        worthPayingMoreReason: { type: "string" },
        evidence: { type: "array", maxItems: 6, items: { type: "string" } },
      },
      required: ["bestValueSlug", "bestOverallSlug", "headline", "reasoning", "tradeoffs", "confidence", "worthPayingMore", "worthPayingMoreReason", "evidence"],
      additionalProperties: false,
    },
    profileScores: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          productSlug: { type: "string" },
          performance: { type: "integer", minimum: 0, maximum: 100 },
          value: { type: "integer", minimum: 0, maximum: 100 },
          work: { type: "integer", minimum: 0, maximum: 100 },
          gaming: { type: "integer", minimum: 0, maximum: 100 },
          study: { type: "integer", minimum: 0, maximum: 100 },
          portability: { type: "integer", minimum: 0, maximum: 100 },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          missingData: { type: "array", maxItems: 6, items: { type: "string" } },
        },
        required: ["productSlug", "performance", "value", "work", "gaming", "study", "portability", "confidence", "missingData"],
        additionalProperties: false,
      },
    },
    recommendations: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          productSlug: { type: "string" },
          bestFor: { type: "string" },
          highlights: { type: "array", maxItems: 4, items: { type: "string" } },
        },
        required: ["productSlug", "bestFor", "highlights"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "verdict", "profileScores", "recommendations"],
  additionalProperties: false,
};

function comparisonSpecifications(product) {
  return parse(product.specificationsJson, [])
    .flatMap((group) => group?.items || group?.specifications || [])
    .map((item) => ({
      name: String(item?.name || item?.label || "").trim().slice(0, 100),
      value: String(item?.value ?? "").trim().slice(0, 300),
    }))
    .filter((item) => item.name && item.value)
    .slice(0, 40);
}

function comparisonText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function comparisonEqualityKey(value) {
  return comparisonText(value).replace(/\s+/g, "");
}

function canonicalComparisonLabel(value) {
  const label = comparisonText(value);
  const aliases = [
    [/^(?:memoria ram|ram|memoria principal)$/, "Memória RAM"],
    [/^(?:armazenamento|memoria interna|capacidade interna|ssd|hd)$/, "Armazenamento"],
    [/^(?:tamanho da tela|tela em polegadas|diagonal da tela)$/, "Tamanho da tela"],
    [/^(?:taxa de atualizacao|frequencia da tela|refresh rate)$/, "Taxa de atualização"],
    [/^(?:resolucao|resolucao da tela)$/, "Resolução"],
    [/^(?:processador|cpu|chipset principal)$/, "Processador"],
    [/^(?:placa de video|gpu|chip grafico|graficos)$/, "Placa de vídeo"],
    [/^(?:camera principal|camera traseira|camera posterior)$/, "Câmera principal"],
    [/^(?:camera frontal|camera de selfie|selfie)$/, "Câmera frontal"],
    [/^(?:bateria|capacidade da bateria)$/, "Bateria"],
    [/^(?:sistema operacional|sistema|os)$/, "Sistema operacional"],
    [/^(?:peso|peso do produto)$/, "Peso"],
    [/^(?:conectividade|conexoes sem fio)$/, "Conectividade"],
  ];
  return aliases.find(([pattern]) => pattern.test(label))?.[1] || String(value).trim();
}

function comparisonNumber(label, rawValue) {
  const value = String(rawValue || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/resolucao/.test(comparisonText(label))) {
    const resolution = value.match(/(\d{3,5})\s*[x×]\s*(\d{3,5})/);
    if (resolution) return Number(resolution[1]) * Number(resolution[2]);
  }
  const match = value.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  let number = Number(match[0].replace(",", "."));
  if (!Number.isFinite(number)) return null;
  if (/\btb\b/.test(value)) number *= 1024;
  if (/\bkg\b/.test(value)) number *= 1000;
  if (/\bghz\b/.test(value)) number *= 1000;
  return number;
}

function deterministicComparisonDirection(label) {
  const value = comparisonText(label);
  if (/(?:peso|tempo de resposta|latencia|consumo|tdp)/.test(value)) return "lower";
  if (/(?:memoria ram|armazenamento|bateria|taxa de atualizacao|resolucao|brilho|nucleos|threads|clock|cache|camera|potencia|leitura|gravacao)/.test(value)) return "higher";
  return null;
}

function rankComparisonValues(label, values) {
  const direction = deterministicComparisonDirection(label);
  if (!direction) return null;
  const measured = values
    .map((item) => ({ item, number: comparisonNumber(label, item.rawValue) }))
    .filter((entry) => entry.number != null);
  if (measured.length < 2) return null;
  const equal = new Set(measured.map((entry) => entry.number)).size === 1;
  if (equal) {
    return {
      equal: true,
      winnerSlugs: [],
      values: values.map((item) => ({ ...item, assessment: "neutral", note: "" })),
    };
  }
  const target = direction === "higher"
    ? Math.max(...measured.map((entry) => entry.number))
    : Math.min(...measured.map((entry) => entry.number));
  const winners = new Set(measured.filter((entry) => entry.number === target).map((entry) => entry.item.productSlug));
  return {
    equal: false,
    winnerSlugs: [...winners],
    values: values.map((item) => ({
      ...item,
      assessment: winners.has(item.productSlug) ? "best" : item.rawValue ? "neutral" : "weak",
    })),
  };
}

function fallbackProductComparison(products) {
  const grouped = new Map();
  for (const product of products) {
    for (const specification of product.specifications) {
      const label = canonicalComparisonLabel(specification.name);
      const key = comparisonText(label);
      if (!grouped.has(key)) grouped.set(key, { label, bySlug: new Map() });
      grouped.get(key).bySlug.set(product.slug, specification.value);
    }
  }
  const criteria = [...grouped.values()].map(({ label, bySlug }) => {
    let values = products.map((product) => ({
      productSlug: product.slug,
      rawValue: bySlug.get(product.slug) || "",
      displayValue: bySlug.get(product.slug) || "",
      assessment: "neutral",
      note: "",
    }));
    const ranked = rankComparisonValues(label, values);
    if (ranked) values = ranked.values;
    const presentValues = values.filter((item) => item.rawValue).map((item) => comparisonEqualityKey(item.rawValue));
    const equal = presentValues.length === products.length && new Set(presentValues).size === 1;
    return {
      label,
      explanation: equal || ranked?.equal ? "" : ranked?.winnerSlugs.length ? "Comparação calculada pelos valores informados na ficha técnica." : "Valores informados pelo cadastro do produto.",
      winnerSlugs: equal || ranked?.equal ? [] : ranked?.winnerSlugs || [],
      values: equal ? values.map((item) => ({ ...item, assessment: "neutral", note: "" })) : values,
    };
  });
  return {
    aiUsed: false,
    summary: "Compare os dados técnicos lado a lado. Campos numéricos compatíveis são avaliados automaticamente.",
    criteria,
    recommendations: [],
  };
}

function hasUsefulAiComparison(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.summary === "string" &&
    value.summary.trim().length >= 20 &&
    value.verdict &&
    typeof value.verdict.headline === "string" &&
    value.verdict.headline.trim().length >= 5 &&
    typeof value.verdict.reasoning === "string" &&
    value.verdict.reasoning.trim().length >= 20 &&
    ["high", "medium", "low"].includes(value.verdict.confidence)
  );
}

function sanitizeAiComparison(value, products, fallback) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const criteria = (Array.isArray(value?.criteria) ? value.criteria : []).slice(0, 24).map((criterion) => {
    const label = String(criterion?.label || "").trim().slice(0, 100);
    if (!label) return null;
    let values = products.map((product) => {
      const proposed = (criterion.values || []).find((item) => item?.productSlug === product.slug);
      const sourceName = String(proposed?.sourceName || "").trim();
      const source = product.specifications.find((item) => comparisonText(item.name) === comparisonText(sourceName));
      return {
        productSlug: product.slug,
        rawValue: source?.value || "",
        displayValue: source?.value || "",
        assessment: ["best", "good", "neutral", "weak"].includes(proposed?.assessment) ? proposed.assessment : "neutral",
        note: String(proposed?.note || "").trim().slice(0, 220),
      };
    });
    if (!values.some((item) => item.rawValue)) return null;
    const ranked = rankComparisonValues(label, values);
    if (ranked) values = ranked.values;
    const presentValues = values.filter((item) => item.rawValue).map((item) => comparisonEqualityKey(item.rawValue));
    const equal = presentValues.length === products.length && new Set(presentValues).size === 1;
    if (equal) values = values.map((item) => ({ ...item, assessment: "neutral", note: "" }));
    return {
      label,
      explanation: equal || ranked?.equal ? "" : String(criterion?.explanation || "").trim().slice(0, 300),
      winnerSlugs: equal || ranked?.equal ? [] : ranked?.winnerSlugs || [...new Set((criterion.winnerSlugs || []).filter((slug) => bySlug.has(slug)))],
      values,
    };
  }).filter(Boolean);
  const recommendations = (Array.isArray(value?.recommendations) ? value.recommendations : [])
    .filter((item) => bySlug.has(item?.productSlug))
    .slice(0, 3)
    .map((item) => ({
      productSlug: item.productSlug,
      productName: bySlug.get(item.productSlug).name,
      bestFor: String(item.bestFor || "").trim().slice(0, 240),
      highlights: (Array.isArray(item.highlights) ? item.highlights : []).map((entry) => String(entry).trim().slice(0, 160)).filter(Boolean).slice(0, 4),
    }));
  const aiLabels = new Set(criteria.map((criterion) => comparisonText(criterion.label)));
  const mergedCriteria = [
    ...criteria,
    ...fallback.criteria.filter((criterion) => !aiLabels.has(comparisonText(criterion.label))),
  ].slice(0, 32);
  const pricedProducts = products
    .filter((product) => Number(product.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price));
  const cheaper = pricedProducts[0] || null;
  const moreExpensive = pricedProducts.at(-1) || null;
  const differenceCents = cheaper && moreExpensive
    ? Math.max(0, Number(moreExpensive.price) - Number(cheaper.price))
    : 0;
  const priceComparison = cheaper && moreExpensive && cheaper.slug !== moreExpensive.slug
    ? {
        cheaperSlug: cheaper.slug,
        moreExpensiveSlug: moreExpensive.slug,
        differenceCents,
        differencePercent: Number(cheaper.price) > 0
          ? Math.round((differenceCents / Number(cheaper.price)) * 100)
          : 0,
      }
    : null;
  const score = (number) => Math.max(0, Math.min(100, Math.round(Number(number) || 0)));
  const profileScores = (Array.isArray(value?.profileScores) ? value.profileScores : [])
    .filter((item) => bySlug.has(item?.productSlug))
    .slice(0, 3)
    .map((item) => ({
      productSlug: item.productSlug,
      productName: bySlug.get(item.productSlug).name,
      performance: score(item.performance),
      value: score(item.value),
      work: score(item.work),
      gaming: score(item.gaming),
      study: score(item.study),
      portability: score(item.portability),
      confidence: ["high", "medium", "low"].includes(item.confidence) ? item.confidence : "low",
      missingData: (Array.isArray(item.missingData) ? item.missingData : [])
        .map((item) => String(item).trim().slice(0, 100))
        .filter(Boolean)
        .slice(0, 6),
    }));
  return {
    aiUsed: true,
    algorithm: "premium-ai-v10",
    summary: String(value?.summary || fallback.summary).trim().slice(0, 600),
    priceComparison,
    verdict: {
      bestValueSlug: bySlug.has(value?.verdict?.bestValueSlug) ? value.verdict.bestValueSlug : null,
      bestOverallSlug: bySlug.has(value?.verdict?.bestOverallSlug) ? value.verdict.bestOverallSlug : null,
      headline: String(value?.verdict?.headline || "Conclusão da comparação").trim().slice(0, 180),
      reasoning: String(value?.verdict?.reasoning || value?.summary || fallback.summary).trim().slice(0, 900),
      tradeoffs: (Array.isArray(value?.verdict?.tradeoffs) ? value.verdict.tradeoffs : []).map((item) => String(item).trim().slice(0, 220)).filter(Boolean).slice(0, 4),
      confidence: ["high", "medium", "low"].includes(value?.verdict?.confidence) ? value.verdict.confidence : "low",
      worthPayingMore: ["yes", "no", "depends"].includes(value?.verdict?.worthPayingMore) ? value.verdict.worthPayingMore : "depends",
      worthPayingMoreReason: String(value?.verdict?.worthPayingMoreReason || "Depende do uso e das características valorizadas.").trim().slice(0, 500),
      evidence: (Array.isArray(value?.verdict?.evidence) ? value.verdict.evidence : [])
        .map((item) => String(item).trim().slice(0, 220))
        .filter(Boolean)
        .slice(0, 6),
    },
    criteria: mergedCriteria.length ? mergedCriteria : fallback.criteria,
    profileScores,
    recommendations,
  };
}

function cacheComparisonAtEdge(ctx, cacheKey, analysis) {
  try {
    const write = caches.default.put(cacheKey, new Response(JSON.stringify(analysis), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=31536000",
      },
    }));
    if (ctx?.waitUntil) ctx.waitUntil(write.catch((error) => console.warn(JSON.stringify({ event: "comparison_cache_write_failed", error: String(error?.message || error) }))));
  } catch (error) {
    console.warn(JSON.stringify({ event: "comparison_cache_write_failed", error: String(error?.message || error) }));
  }
}

async function generateAndPersistProductComparison(env, ctx, { version, cacheKey, slugs, products, fallback, userId, usagePeriod }) {
  try {
    const model = String(env.PREMIUM_COMPARISON_AI_MODEL || "@cf/qwen/qwen3-30b-a3b-fp8");
    const messages = [
        {
          role: "system",
          content: "Você é o algoritmo Premium de comparação da SHOPLAB. Compare somente os dados fornecidos, reconhecendo nomes equivalentes como RAM/memória, CPU/processador, armazenamento/SSD e tela/display. Nunca invente benchmarks, autonomia, desempenho ou especificações. Campo ausente significa dado não informado, nunca produto pior. Avalie preço, equilíbrio técnico, limitações e adequação ao uso. O melhor custo-benefício deve justificar a diferença de preço. O melhor geral precisa ser sustentado pelos dados. Informe se vale pagar mais usando yes, no ou depends e explique para qual uso. Em evidence, cite fatos exatos presentes na entrada. Gere notas comparativas de 0 a 100 para desempenho, custo-benefício, trabalho, jogos, estudos e portabilidade; elas comparam apenas estes produtos e não são benchmarks absolutos. Quando faltarem dados relevantes, reduza a confiança e liste-os em missingData. Recomende usos concretos e diferentes. Escreva em português brasileiro claro e direto. Retorne somente o JSON solicitado.",
        },
        {
          role: "user",
          content: JSON.stringify({ category: products[0].category, products: products.map(({ slug, name, productType, brand, price, editorialScore, shortDescription, editorialReview, specifications }) => ({ slug, name, productType, brand, priceCents: price, editorialScore, shortDescription, editorialReview, specifications })) }),
        },
      ];
    const runComparisonModel = () => env.AI.run(model, {
        messages,
        response_format: { type: "json_schema", json_schema: PREMIUM_COMPARISON_SUMMARY_SCHEMA },
        temperature: 0,
        max_tokens: 1600,
      }, {
        gateway: {
        id: String(env.AI_GATEWAY_ID || "default"),
        skipCache: false,
        cacheTtl: 2592000,
        cacheKey: `premium-comparison-v10:${version}`,
        collectLog: true,
        metadata: { feature: "premium-product-comparison", comparisonVersion: "v10", productSlugs: [...slugs].sort().join(",") },
        },
      });
    const responseValue = (result) => {
      if (result?.response && typeof result.response === "object") return result.response;
      const text = String(result?.response || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      return text ? JSON.parse(text) : null;
    };
    const raw = responseValue(await runComparisonModel());
    if (!hasUsefulAiComparison(raw)) throw new Error("AI_COMPARISON_RESPONSE_INCOMPLETE");

    const analysis = sanitizeAiComparison(raw, products, fallback);
    await env.DB.prepare(
      `UPDATE comparison_analysis_cache SET product_slugs=?,analysis_json=?,updated_at=CURRENT_TIMESTAMP WHERE cache_key=?`,
    ).bind(JSON.stringify([...slugs].sort()), JSON.stringify(analysis), version).run();
    cacheComparisonAtEdge(ctx, cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.warn(JSON.stringify({ event: "ai_product_comparison_failed", cacheKey: version, error: String(error?.message || error) }));
    await env.DB.batch([
      env.DB.prepare(`UPDATE comparison_analysis_cache SET updated_at=CURRENT_TIMESTAMP WHERE cache_key=? AND analysis_json='null'`).bind(version),
      env.DB.prepare(`UPDATE premium_ai_usage SET generations=MAX(generations-1,0),updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND period_key=?`).bind(userId, usagePeriod),
    ]);
    return null;
  }
}

async function reservePremiumAiGeneration(env, userId) {
  const plan = await resolvedPremiumPlan(env);
  const period = premiumPeriodKey();
  const row = await env.DB.prepare(
    `INSERT INTO premium_ai_usage(user_id,period_key,generations) VALUES(?,?,1)
     ON CONFLICT(user_id,period_key) DO UPDATE SET generations=generations+1,updated_at=CURRENT_TIMESTAMP
     WHERE generations<? RETURNING generations`,
  ).bind(userId, period, plan.aiMonthlyLimit).first();
  const used = Number(row?.generations || 0);
  return { allowed: Boolean(row), used, limit: plan.aiMonthlyLimit, remaining: Math.max(0, plan.aiMonthlyLimit - used), period };
}

async function analyzeProductComparison(req, env, ctx, id) {
  const body = await readJson(req, 4096);
  const slugs = [...new Set((Array.isArray(body.slugs) ? body.slugs : []).map((slug) => String(slug).trim()).filter((slug) => /^[a-z0-9-]{2,160}$/.test(slug)))].slice(0, 3);
  if (slugs.length < 2) return fail(req, env, "VALIDATION_ERROR", "Escolha pelo menos dois produtos para comparar", 422, id);
  const placeholders = slugs.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT p.slug,p.name,p.product_type productType,p.short_description shortDescription,p.editorial_review editorialReview,
      p.editorial_score editorialScore,p.specifications_json specificationsJson,p.updated_at updatedAt,
      COALESCE(o.current_price_cents,p.base_price_cents) price,c.id categoryId,c.name category,b.name brand
     FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id
     LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1
     WHERE p.slug IN (${placeholders}) AND p.status='published'`,
  ).bind(...slugs).all();
  const bySlug = new Map((results || []).map((product) => [product.slug, product]));
  const products = slugs.map((slug) => bySlug.get(slug)).filter(Boolean).map((product) => ({ ...product, specifications: comparisonSpecifications(product) }));
  if (products.length !== slugs.length) return fail(req, env, "PRODUCT_NOT_FOUND", "Um dos produtos não está disponível", 404, id);
  if (products.some((product) => product.categoryId !== products[0].categoryId)) return fail(req, env, "COMPARISON_CATEGORY_MISMATCH", "Compare produtos da mesma categoria", 422, id);
  const fallback = fallbackProductComparison(products);
  const user = await activeUser(req, env);
  const premium = user ? await premiumSubscriptionData(env, user.id) : { premium: false, status: "free", plan: await resolvedPremiumPlan(env), usage: null };
  const technicalResult = {
    ...fallback,
    premium: premium.premium,
    premiumRequired: !premium.premium,
    subscriptionStatus: premium.status,
    plan: premium.plan,
    usage: premium.usage,
  };
  if (!products.some((product) => product.specifications.length)) return ok(req, env, technicalResult, id);
  if (!premium.premium) return ok(req, env, technicalResult, id);
  const version = await sha256(`comparison-v10|${products.map((product) => `${product.slug}:${product.updatedAt}:${product.price}:${JSON.stringify(product.specifications)}`).join("|")}`);
  const cacheKey = new Request(`https://comparison.shoplab.internal/v1/${version}`);
  try {
    const cached = await caches.default.match(cacheKey);
    if (cached) return ok(req, env, { ...(await cached.json()), premium: true, usage: premium.usage }, id);
  } catch (error) {
    console.warn(JSON.stringify({ event: "comparison_cache_read_failed", error: String(error?.message || error) }));
  }
  const durableCache = await env.DB.prepare(
    `SELECT analysis_json analysisJson,updated_at updatedAt FROM comparison_analysis_cache WHERE cache_key=?`,
  ).bind(version).first();
  if (durableCache?.analysisJson) {
    try {
      const analysis = JSON.parse(durableCache.analysisJson);
      if (analysis && typeof analysis === "object") {
        cacheComparisonAtEdge(ctx, cacheKey, analysis);
        return ok(req, env, { ...analysis, premium: true, usage: premium.usage }, id);
      }
    } catch (error) {
      console.warn(JSON.stringify({ event: "comparison_durable_cache_invalid", cacheKey: version, error: String(error?.message || error) }));
    }
  }
  if (!env.AI) return ok(req, env, technicalResult, id);
  let claimed = false;
  if (!durableCache) {
    const claim = await env.DB.prepare(
      `INSERT OR IGNORE INTO comparison_analysis_cache(cache_key,product_slugs,analysis_json) VALUES(?,?,'null')`,
    ).bind(version, JSON.stringify([...slugs].sort())).run();
    claimed = Boolean(claim.meta.changes);
  } else if (!durableCache.analysisJson || durableCache.analysisJson === "null") {
    const claim = await env.DB.prepare(
      `UPDATE comparison_analysis_cache SET updated_at=CURRENT_TIMESTAMP WHERE cache_key=? AND analysis_json='null' AND datetime(updated_at)<=datetime('now','-2 minutes')`,
    ).bind(version).run();
    claimed = Boolean(claim.meta.changes);
  }
  if (claimed) {
    const usage = await reservePremiumAiGeneration(env, user.id);
    if (!usage.allowed) {
      await env.DB.prepare(`DELETE FROM comparison_analysis_cache WHERE cache_key=? AND analysis_json='null'`).bind(version).run();
      return ok(req, env, { ...technicalResult, premium: true, premiumRequired: false, quotaExceeded: true, usage }, id);
    }
    const analysis = await generateAndPersistProductComparison(env, ctx, {
      version,
      cacheKey,
      slugs,
      products,
      fallback,
      userId: user.id,
      usagePeriod: usage.period,
    });
    premium.usage = usage;
    if (analysis)
      return ok(req, env, { ...analysis, premium: true, usage }, id);
    return ok(req, env, {
      ...technicalResult,
      premium: true,
      premiumRequired: false,
      generationFailed: true,
      usage: { ...usage, used: Math.max(0, usage.used - 1), remaining: Math.min(usage.limit, usage.remaining + 1) },
    }, id);
  }
  return ok(req, env, { ...fallback, premium: true, processing: true, usage: premium.usage }, id);
}

async function rankRelatedProductsWithAi(env, source, candidates) {
  if (!env.AI || candidates.length < 2) return null;
  try {
    const sourceContext = {
      name: source.name,
      productType: source.productType,
      shortDescription: source.shortDescription,
      fullDescription: String(source.fullDescription || "").slice(0, 1800),
      targetAudience: source.targetAudience,
      tags: parse(source.tagsJson, []),
      specifications: parse(source.specificationsJson, []).slice(0, 6),
    };
    const candidateContext = candidates.map((product) => ({
      id: product.id,
      name: product.name,
      productType: product.productType,
      category: product.category,
      brand: product.brand,
      shortDescription: String(product.shortDescription || "").slice(0, 350),
      editorialScore: product.editorialScore,
      price: product.price,
    }));
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        {
          role: "system",
          content:
            "Você reranqueia produtos relacionados de uma loja brasileira. Escolha somente IDs fornecidos. Priorize: mesma finalidade e público, mesmo tipo de produto, características compatíveis, alternativas diretas e complementos realmente úteis. Não relacione produtos apenas porque compartilham uma categoria ampla. Evite itens sem conexão prática. Retorne no máximo 8 IDs, do mais relevante ao menos relevante.",
        },
        {
          role: "user",
          content: JSON.stringify({ source: sourceContext, candidates: candidateContext }),
        },
      ],
      response_format: {
        type: "json_schema",
        schema: RELATED_PRODUCTS_SCHEMA,
      },
      temperature: 0,
      max_tokens: 300,
    });
    const value =
      typeof result?.response === "string"
        ? JSON.parse(result.response)
        : result?.response;
    const byId = new Map(candidates.map((product) => [product.id, product]));
    const ids = Array.isArray(value?.productIds)
      ? [...new Set(value.productIds)].filter((productId) => byId.has(productId))
      : [];
    if (!ids.length) return null;
    const selected = ids.map((productId) => byId.get(productId));
    const selectedIds = new Set(ids);
    return [
      ...selected,
      ...candidates.filter((product) => !selectedIds.has(product.id)),
    ];
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "ai_related_products_fallback",
        productSlug: source.slug,
        error: String(error?.message || error),
      }),
    );
    return null;
  }
}

async function getProductV2(req, env, slug, id) {
  const row = await env.DB.prepare(
    `SELECT p.*,c.name category,c.slug categorySlug,b.name brand,b.logo_url brandLogoUrl FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id WHERE p.slug=? AND p.status='published'`,
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
        `SELECT o.id,o.current_price_cents price,o.previous_price_cents oldPrice,o.currency,o.coupon_code coupon,o.installment_text installments,o.shipping_text shipping,o.availability,o.button_text buttonText,o.last_checked_at lastCheckedAt,pa.name store,pa.logo_url storeLogoUrl FROM offers o JOIN partners pa ON pa.id=o.partner_id WHERE o.product_id=? AND o.availability='available' AND (o.starts_at IS NULL OR datetime(o.starts_at)<=CURRENT_TIMESTAMP) AND (o.ends_at IS NULL OR datetime(o.ends_at)>=CURRENT_TIMESTAMP) ORDER BY o.is_primary DESC,o.priority DESC,o.current_price_cents`,
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
    storeLogoUrl: offer.storeLogoUrl,
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
    "product_impression",
    "offer_click",
    "search_result_click",
    "share",
    "favorite",
  ]);
  const inputEvents=(Array.isArray(body.events)?body.events:[body]).slice(0,20);
  if (!inputEvents.length||inputEvents.some(event=>!allowed.has(String(event?.type||"").slice(0,60))))
    return fail(req, env, "VALIDATION_ERROR", "Evento inválido", 422, id);
  const user=req.headers.has("authorization")?await authenticatedUser(req):null;
  const statements=inputEvents.map(event=>env.DB.prepare(
    `INSERT INTO events(id,event_type,product_slug,offer_id,query_text,metadata_json,user_id) VALUES(?,?,?,?,?,?,?)`,
  ).bind(crypto.randomUUID(),String(event.type).slice(0,60),text(event.slug,160),text(event.offerId,100),text(event.query,200),JSON.stringify(event.metadata||{}).slice(0,2000),user?.id||null));
  const viewed=[...new Set(inputEvents.filter(event=>event.type==="product_view"&&event.slug).map(event=>String(event.slug).slice(0,160)))];
  for(const slug of viewed)
    statements.push(
      env.DB.prepare(
        `UPDATE products SET view_count=view_count+1 WHERE slug=? AND status='published'`,
      ).bind(slug),
    );
  ctx.waitUntil(env.DB.batch(statements));
  return ok(req, env, { accepted: inputEvents.length }, id);
}
async function publicRatingSummaries(req, env, url, id) {
  const slugs = [...new Set(String(url.searchParams.get("slugs") || "")
    .split(",").map((slug) => slug.trim())
    .filter((slug) => /^[a-z0-9-]{2,160}$/.test(slug)))]
    .slice(0, 50);
  if (!slugs.length) return ok(req, env, [], id);
  const placeholders = slugs.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT product_slug slug,ROUND(AVG(rating),1) average,COUNT(*) total
     FROM user_ratings WHERE product_slug IN (${placeholders})
     GROUP BY product_slug`,
  ).bind(...slugs).all();
  const bySlug = new Map((results || []).map((row) => [row.slug, row]));
  const response = ok(req, env, slugs.map((slug) => bySlug.get(slug) || { slug, average: 0, total: 0 }), id);
  response.headers.set("cache-control", "no-store, max-age=0");
  return response;
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

function productPriceSyncInput(body) {
  const source = body?.priceSource === "mercadolivre" ? "mercadolivre" : null;
  const itemId = mercadoLivreItemId(body?.priceSourceItemId);
  const offerId = mercadoLivreItemId(body?.priceSourceOfferId);
  let sourceUrl = null;
  try {
    const parsed = new URL(String(body?.priceSourceUrl || ""));
    if (parsed.protocol === "https:" && mercadoLivreHostname(parsed.hostname)) sourceUrl = String(parsed).slice(0, 2000);
  } catch {}
  const enabled = source && itemId && offerId && sourceUrl && body?.priceSyncEnabled !== false;
  return { supplied: Object.prototype.hasOwnProperty.call(body || {}, "priceSource"), source: enabled ? source : null, itemId: enabled ? itemId : null, offerId: enabled ? offerId : null, sourceUrl: enabled ? sourceUrl : null, enabled: enabled ? 1 : 0 };
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
  const priceSync = productPriceSyncInput(body),
    productId = crypto.randomUUID(),
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
      `INSERT INTO products(id,name,slug,product_type,status,category_id,brand_id,short_description,full_description,editorial_score,base_price_cents,compare_at_price_cents,is_featured,specifications_json,price_source,price_source_item_id,price_source_offer_id,price_source_url,price_sync_enabled,price_synced_at,price_sync_status,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE NULL END,CASE WHEN ?=1 THEN 'ok' ELSE NULL END,CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
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
      JSON.stringify(Array.isArray(body.specificationGroups) ? body.specificationGroups : []),
      priceSync.source,
      priceSync.itemId,
      priceSync.offerId,
      priceSync.sourceUrl,
      priceSync.enabled,
      priceSync.enabled,
      priceSync.enabled,
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
  const priceSync = productPriceSyncInput(body),
    productType = body.productType || "affiliate",
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
      `UPDATE products SET name=?,slug=?,product_type=?,status=?,category_id=?,brand_id=?,short_description=?,full_description=?,editorial_score=?,base_price_cents=?,compare_at_price_cents=?,is_featured=?,specifications_json=?,price_source=CASE WHEN ?=1 THEN ? ELSE price_source END,price_source_item_id=CASE WHEN ?=1 THEN ? ELSE price_source_item_id END,price_source_offer_id=CASE WHEN ?=1 THEN ? ELSE price_source_offer_id END,price_source_url=CASE WHEN ?=1 THEN ? ELSE price_source_url END,price_sync_enabled=CASE WHEN ?=1 THEN ? ELSE price_sync_enabled END,price_synced_at=CASE WHEN ?=1 AND ?=1 THEN CURRENT_TIMESTAMP ELSE price_synced_at END,price_sync_status=CASE WHEN ?=1 AND ?=1 THEN 'ok' ELSE price_sync_status END,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
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
      JSON.stringify(Array.isArray(body.specificationGroups) ? body.specificationGroups : []),
      priceSync.supplied ? 1 : 0,priceSync.source,
      priceSync.supplied ? 1 : 0,priceSync.itemId,
      priceSync.supplied ? 1 : 0,priceSync.offerId,
      priceSync.supplied ? 1 : 0,priceSync.sourceUrl,
      priceSync.supplied ? 1 : 0,priceSync.enabled,
      priceSync.supplied ? 1 : 0,priceSync.enabled,
      priceSync.supplied ? 1 : 0,priceSync.enabled,
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
  leitor: ["ereader", "kindle", "ebook", "leitura"],
  ereader: ["leitor", "kindle", "ebook", "leitura"],
  kindle: ["ereader", "leitor", "ebook", "leitura"],
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

const SEARCH_STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "ate", "com", "da", "das", "de", "do", "dos",
  "e", "em", "eu", "mais", "melhor", "menos", "na", "nas", "no", "nos",
  "o", "os", "para", "por", "pra", "quero", "reais", "um", "uma",
]);

function buildIntentFtsQuery(query) {
  const terms = correctedSearch(query)
    .split(" ")
    .filter((term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term));
  const core = terms[0];
  if (!core) return buildFtsQuery(query);
  const expanded = new Set([core, ...(SEARCH_SYNONYMS[core] || [])]);
  return [...expanded]
    .flatMap((term) => term.split(" "))
    .filter((term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term))
    .slice(0, 12)
    .map((term) => `"${term.replace(/"/g, "")}"*`)
    .join(" OR ");
}

async function searchV2(req, env, url, ctx, id) {
  const originalQuery = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const normalizedQuery = normalizeSearch(originalQuery);
  if (normalizedQuery.length < 2)
    return ok(req, env, [], id, { query: originalQuery, total: 0 });
  const intent = await cachedSearchIntent(env, originalQuery, ctx);
  const correctedQuery = correctedSearch(intent?.searchTerms || normalizedQuery);
  const ftsQuery = intent
    ? buildIntentFtsQuery(correctedQuery)
    : buildFtsQuery(correctedQuery);
  const explicitCategory = normalizeSearch(url.searchParams.get("category")).replace(
    /\s+/g,
    "-",
  );
  const category = explicitCategory || intent?.category || "";
  const brand = explicitCategory ? "" : intent?.brand || "";
  const minPriceCents = toPriceCents(intent?.minPrice);
  const maxPriceCents = toPriceCents(intent?.maxPrice);
  const sort = url.searchParams.get("sort") || intent?.sort || "";
  const order =
    sort === "price-asc"
      ? "COALESCE(o.current_price_cents,2147483647) ASC,rank ASC"
      : sort === "discount"
        ? "CASE WHEN o.previous_price_cents>o.current_price_cents THEN (o.previous_price_cents-o.current_price_cents)*1.0/o.previous_price_cents ELSE 0 END DESC,rank ASC"
        : "rank ASC,COALESCE(p.editorial_score,0) DESC,p.is_featured DESC,p.view_count DESC";
  const args = [ftsQuery];
  let intentFilters = "";
  const categoryFilter = category ? " AND c.slug=?" : "";
  if (category) args.push(category);
  if (brand) {
    intentFilters += " AND lower(b.name)=?";
    args.push(brand);
  }
  if (minPriceCents != null) {
    intentFilters += " AND COALESCE(o.current_price_cents,p.base_price_cents)>=?";
    args.push(minPriceCents);
  }
  if (maxPriceCents != null) {
    intentFilters += " AND COALESCE(o.current_price_cents,p.base_price_cents)<=?";
    args.push(maxPriceCents);
  }
  let { results } = await env.DB.prepare(
    `
    SELECT p.id,p.name,p.slug,p.short_description shortDescription,
      p.editorial_score editorialScore,p.is_featured isFeatured,p.view_count viewCount,
      c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,
      COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,pa.name store,o.id offerId,
      pm.storage_key primaryStorageKey,pm.external_url primaryExternalUrl,pm.alt_text primaryImageAlt,
      bm25(products_fts,0,10.0,4.0,3.0,1.0) rank
    FROM products_fts
    JOIN products p ON p.id=products_fts.product_id
    LEFT JOIN categories c ON c.id=p.category_id
    LEFT JOIN brands b ON b.id=p.brand_id
    LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1
    LEFT JOIN partners pa ON pa.id=o.partner_id
    LEFT JOIN product_media pm ON pm.id=(
      SELECT selected_media.id FROM product_media selected_media
      WHERE selected_media.product_id=p.id AND selected_media.type='image'
      ORDER BY selected_media.is_primary DESC,selected_media.sort_order,selected_media.created_at
      LIMIT 1
    )
    WHERE products_fts MATCH ? AND p.status='published'${categoryFilter}${intentFilters}
    ORDER BY ${order}
    LIMIT 50
  `,
  )
    .bind(...args)
    .all();
  if (!results.length && !intent) {
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
  const searchUser=req.headers.has("authorization")?await authenticatedUser(req):null;
  ctx.waitUntil(
    env.DB.prepare(
      `INSERT INTO events(id,event_type,query_text,metadata_json,user_id) VALUES(?,?,?,?,?)`,
    )
      .bind(
        crypto.randomUUID(),
        results.length ? "search" : "search_no_results",
        normalizedQuery,
        JSON.stringify({ originalQuery, resultCount: results.length }).slice(
          0,
          2000,
        ),
        searchUser?.id||null,
      )
      .run(),
  );
  return ok(req, env, results.map(normalizeProduct), id, {
    query: originalQuery,
    normalizedQuery,
    correctedQuery,
    corrected: correctedQuery !== normalizedQuery,
    intent: intent
      ? {
          understood: true,
          searchTerms: intent.searchTerms,
          category: category || null,
          brand: brand || null,
          minPrice: intent.minPrice,
          maxPrice: intent.maxPrice,
          sort: sort || null,
          explanation: intent.explanation,
        }
      : { understood: false },
    total: results.length,
  });
}

const SEARCH_INTENT_SCHEMA = {
  type: "object",
  properties: {
    searchTerms: { type: "string" },
    category: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    minPrice: { type: ["number", "null"] },
    maxPrice: { type: ["number", "null"] },
    sort: { type: ["string", "null"], enum: ["price-asc", "discount", null] },
    explanation: { type: "string" },
  },
  required: ["searchTerms", "category", "brand", "minPrice", "maxPrice", "sort", "explanation"],
  additionalProperties: false,
};

const ADMIN_PRODUCT_DRAFT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" }, slug: { type: "string" },
    shortDescription: { type: "string" }, fullDescription: { type: "string" },
    categoryId: { type: ["string", "null"] },
    productType: { type: "string", enum: ["affiliate", "book", "digital"] },
    imageAlt: { type: "string" },
    specifications: { type: "array", maxItems: 20, items: {
      type: "object", properties: { name: { type: "string" }, value: { type: "string" } },
      required: ["name", "value"], additionalProperties: false,
    } },
  },
  required: ["name", "slug", "shortDescription", "fullDescription", "categoryId", "productType", "imageAlt", "specifications"],
  additionalProperties: false,
};

function mercadoLivreHostname(hostname) {
  const value = String(hostname || "").toLowerCase();
  return [
    "mercadolivre.com.br",
    "mercadolivre.com",
    "mercadolibre.com.br",
    "mercadolibre.com",
    "meli.la",
  ].some((domain) => value === domain || value.endsWith(`.${domain}`));
}

function mercadoLivreItemId(value) {
  const match = String(value || "").match(/\bMLB-?(\d{8,})\b/i);
  return match ? `MLB${match[1]}` : null;
}

function mercadoLivrePageData(html) {
  const source = String(html || "");
  const normalized = source.replace(/\\"/g, '"');
  const visibleText = source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&(?:aacute|Aacute);/g, "a")
    .replace(/&(?:iacute|Iacute);/g, "i")
    .replace(/\s+/g, " ");
  const moneyMatches = [...visibleText.matchAll(/R\$\s*([0-9.]+)(?:,([0-9]{2}))?/g)];
  const explicitPixMatch = visibleText.match(
    /R\$\s*([0-9.]+)(?:,|\s+)([0-9]{2})(?:\s+\d+%\s*OFF)?\s+no\s+Pix(?:\s+ou\s+Saldo)?/i,
  );
  const pixPosition = visibleText.search(/no\s+Pix(?:\s+ou\s+Saldo)?/i);
  const pixMatch = pixPosition < 0
    ? null
    : moneyMatches.filter((match) => match.index < pixPosition && pixPosition - match.index < 120).at(-1);
  const selectedPixMatch = explicitPixMatch || pixMatch;
  const pixPrice = selectedPixMatch
    ? Number(`${selectedPixMatch[1].replace(/\./g, "")}.${selectedPixMatch[2] || "00"}`)
    : 0;
  let product = null;
  const visit = (value) => {
    if (!value || product) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value !== "object") return;
    const types = Array.isArray(value["@type"])
      ? value["@type"]
      : [value["@type"]];
    if (types.some((type) => String(type).toLowerCase() === "product")) {
      product = value;
      return;
    }
    for (const child of Object.values(value)) visit(child);
  };
  for (const match of source.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try { visit(JSON.parse(match[1])); } catch {}
    if (product) break;
  }
  const offers = Array.isArray(product?.offers)
    ? product.offers[0]
    : product?.offers || {};
  const numberFrom = (...values) => {
    for (const value of values) {
      const number = Number(String(value ?? "").replace(",", "."));
      if (Number.isFinite(number) && number > 0) return number;
    }
    return 0;
  };
  const matchNumber = (...patterns) => {
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) return numberFrom(match[1]);
    }
    return 0;
  };
  const price = numberFrom(
    offers?.price,
    offers?.lowPrice,
    matchNumber(
      /<meta[^>]+(?:itemprop|property)=["'](?:price|product:price:amount)["'][^>]+content=["']([0-9.,]+)["']/i,
      /"price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
    ),
  );
  const previousPrice = numberFrom(
    matchNumber(
      /"original_price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
      /"originalPrice"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
      /"regular_amount"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i,
    ),
    Number(offers?.highPrice) > price ? offers.highPrice : 0,
  );
  const productImages = Array.isArray(product?.image)
    ? product.image
    : product?.image ? [product.image] : [];
  return {
    name: String(product?.name || "").trim(),
    description: String(product?.description || "").trim(),
    price,
    pixPrice: Number.isFinite(pixPrice) && pixPrice > 0 ? pixPrice : 0,
    previousPrice: previousPrice > price ? previousPrice : 0,
    pictures: productImages.filter((url) => /^https:\/\//i.test(String(url))),
  };
}

async function mercadoLivrePublicPageData(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || !mercadoLivreHostname(url.hostname)) return null;
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; SHOPLAB-Price-Sync/1.0)",
      },
    });
    if (!response.ok) return null;
    return mercadoLivrePageData((await response.text()).slice(0, 1000000));
  } catch {
    return null;
  }
}

async function resolveMercadoLivreUrl(value) {
  let url;
  try { url = new URL(String(value || "").trim()); }
  catch { throw new Error("Cole um link válido do Mercado Livre"); }
  if (url.protocol !== "https:" || !mercadoLivreHostname(url.hostname))
    throw new Error("O link deve pertencer ao Mercado Livre");
  for (let index = 0; index < 8; index += 1) {
    const directItemId = mercadoLivreItemId(`${url.pathname}${url.search}`);
    const catalogPage = /\/p\/MLB-?\d+/i.test(url.pathname);
    if (directItemId && !catalogPage)
      return { url: String(url), itemIds: [directItemId], pageData: null };
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; SHOPLAB-Product-Importer/1.0)",
      },
    });
    const location = response.headers.get("location");
    if (location) {
      const next = new URL(location, url);
      if (next.protocol !== "https:" || !mercadoLivreHostname(next.hostname))
        throw new Error("O link encurtado redirecionou para um domínio não permitido");
      url = next;
      continue;
    }
    if (response.status === 403 && url.hostname.toLowerCase() === "meli.la")
      throw new Error(
        "O Mercado Livre bloqueou a abertura automática deste link curto. Abra o link em seu navegador, copie a URL completa do anúncio após o redirecionamento e cole-a no campo Link completo do produto.",
      );
    if (response.ok) {
      const html = (await response.text()).slice(0, 1000000);
      const pageData = mercadoLivrePageData(html);
      const prioritized = [
        ...html.matchAll(/(?:item[_-]?id|itemId)["'\s:=]+["']?(MLB-?\d{8,})/gi),
        ...html.matchAll(/(?:canonical|og:url)[\s\S]{0,300}?(MLB-?\d{8,})/gi),
        ...html.matchAll(/https:\/\/[^"'<>\s]*\/(MLB-?\d{8,})[^"'<>\s]*/gi),
      ].map((entry) => mercadoLivreItemId(entry[1])).filter(Boolean);
      const all = [...html.matchAll(/\bMLB-?\d{8,}\b/gi)]
        .map((entry) => mercadoLivreItemId(entry[0]))
        .filter(Boolean);
      const itemIds = [...new Set([directItemId, ...prioritized, ...all].filter(Boolean))].slice(0, 30);
      if (itemIds.length) return { url: String(url), itemIds, pageData };
      const refreshTag = html.match(
        /<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/i,
      )?.[0];
      const refreshContent = refreshTag?.match(
        /\bcontent\s*=\s*["']([^"']+)["']/i,
      )?.[1];
      const refreshTarget = refreshContent
        ?.match(/\burl\s*=\s*(.+)$/i)?.[1]
        ?.trim()
        .replace(/^["']|["']$/g, "");
      const scriptTarget = html.match(
        /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']|(?:window\.)?location\.replace\(\s*["']([^"']+)["']/i,
      );
      const refresh = refreshTarget || scriptTarget?.[1] || scriptTarget?.[2];
      if (refresh) {
        const next = new URL(refresh.replace(/&amp;/g, "&"), url);
        if (next.protocol !== "https:" || !mercadoLivreHostname(next.hostname))
          throw new Error("A página intermediária apontou para um domínio não permitido");
        url = next;
        continue;
      }
    }
    break;
  }
  throw new Error("Não encontrei o código MLB nesse link");
}

async function mercadoLivreAppToken(env) {
  const clientId = String(env.MERCADOLIVRE_CLIENT_ID || "");
  const clientSecret = String(env.MERCADOLIVRE_CLIENT_SECRET || "");
  if (!clientId || !clientSecret)
    throw new Error("Configure MERCADOLIVRE_CLIENT_ID e MERCADOLIVRE_CLIENT_SECRET no Worker");
  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token)
    throw new Error(`Mercado Livre recusou as credenciais: ${String(result.message || result.error || response.status).slice(0, 300)}`);
  return result.access_token;
}

async function mercadoLivreJson(path, token, optional = false) {
  const endpoint = `https://api.mercadolibre.com${path}`;
  let response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${token}` },
  });
  if ([401, 403].includes(response.status)) {
    response = await fetch(endpoint, {
      headers: {
        accept: "application/json",
        "user-agent": "SHOPLAB-Product-Importer/1.0",
      },
    });
  }
  if (optional && response.status === 404) return null;
  const result = await response.json().catch(() => ({}));
  if (optional && [400, 403].includes(response.status)) return null;
  if (!response.ok)
    throw new Error(`Mercado Livre respondeu ${response.status}: ${String(result.message || result.error || "consulta recusada").slice(0, 300)}`);
  return result;
}

function mercadoLivrePriceValues(item, prices, salePrice, fallback = {}) {
  const rows = Array.isArray(prices?.prices) ? prices.prices : [];
  const instantPayment = rows.find((price) => {
    const context = JSON.stringify(price?.conditions || price?.metadata || {});
    return /(?:pix|account_money|bank_transfer)/i.test(context) &&
      !/(?:coupon|cupom)/i.test(context) && Number(price?.amount) > 0;
  });
  const promotional = rows.find((price) =>
    ["promotion", "deal", "custom", "price_discount"].includes(
      String(price.type || "").toLowerCase(),
    ),
  );
  const standard = rows.find((price) => price.type === "standard") || rows[0] || {};
  const current = Number(
    instantPayment?.amount ?? salePrice?.amount ?? promotional?.amount ?? standard.amount ??
    item?.price ?? fallback.price ?? fallback.sale_price ?? 0,
  );
  const previous = Number(
    instantPayment?.regular_amount ?? salePrice?.regular_amount ?? promotional?.regular_amount ??
    promotional?.original_amount ??
    (Number(standard.amount) > current ? standard.amount : null) ??
    item?.original_price ?? fallback.original_price ?? fallback.regular_amount ?? 0,
  );
  if (!Number.isFinite(current) || current <= 0)
    throw new Error("O Mercado Livre não informou um preço público válido");
  return {
    currentPriceCents: Math.round(current * 100),
    previousPriceCents: previous > current ? Math.round(previous * 100) : null,
  };
}

async function mercadoLivrePriceSnapshot(token, sourceItemId, storedOfferId, sourceUrl) {
  let offerId = mercadoLivreItemId(storedOfferId);
  let fallback = {};
  const sourceId = mercadoLivreItemId(sourceItemId);
  if (!sourceId) throw new Error("Identificador de origem inválido");
  if (offerId === sourceId) {
    const direct = await mercadoLivreJson(`/items/${encodeURIComponent(sourceId)}`, token, true);
    if (!direct?.id) throw new Error("O anúncio não está mais disponível");
    fallback = direct;
  } else {
    const catalog = await mercadoLivreJson(`/products/${encodeURIComponent(sourceId)}/items`, token, true);
    const rows = Array.isArray(catalog?.results) ? catalog.results : Array.isArray(catalog) ? catalog : [];
    fallback = rows.find((row) => Boolean(row?.winner || row?.buy_box_winner)) ||
      rows.filter((row) => mercadoLivreItemId(row?.item_id || row?.id) && Number(row?.price || row?.sale_price || 0) > 0)
        .sort((a, b) => Number(a.price || a.sale_price) - Number(b.price || b.sale_price))[0] || {};
    offerId = mercadoLivreItemId(fallback.item_id || fallback.id);
  }
  if (!offerId) throw new Error("Nenhuma oferta ativa foi encontrada para esse catálogo");
  const [item, prices, salePrice, pageData] = await Promise.all([
    mercadoLivreJson(`/items/${encodeURIComponent(offerId)}`, token, true),
    mercadoLivreJson(`/items/${encodeURIComponent(offerId)}/prices`, token, true),
    mercadoLivreJson(`/items/${encodeURIComponent(offerId)}/sale_price?context=channel_marketplace`, token, true),
    mercadoLivrePublicPageData(sourceUrl),
  ]);
  const values = mercadoLivrePriceValues(item, prices, salePrice, fallback);
  if (Number(pageData?.pixPrice) > 0)
    values.currentPriceCents = Math.round(Number(pageData.pixPrice) * 100);
  return { ...values, offerId, priceKind: Number(pageData?.pixPrice) > 0 ? "pix" : "marketplace" };
}

async function syncMercadoLivreProductPrice(env, product, token) {
  try {
    const price = await mercadoLivrePriceSnapshot(
      token,
      product.priceSourceItemId,
      product.priceSourceOfferId,
      product.priceSourceUrl,
    );
    await env.DB.batch([
      env.DB.prepare(`UPDATE products SET base_price_cents=?,compare_at_price_cents=?,price_source_offer_id=?,price_synced_at=CURRENT_TIMESTAMP,price_sync_status='ok',price_sync_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND price_sync_enabled=1`).bind(price.currentPriceCents,price.previousPriceCents,price.offerId,product.id),
      env.DB.prepare(`UPDATE offers SET current_price_cents=?,previous_price_cents=?,last_checked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=(SELECT id FROM offers WHERE product_id=? ORDER BY is_primary DESC,priority DESC LIMIT 1)`).bind(price.currentPriceCents,price.previousPriceCents,product.id),
    ]);
    return { id: product.id, success: true, ...price };
  } catch (error) {
    const detail = String(error?.message || error).slice(0, 500);
    await env.DB.prepare(`UPDATE products SET price_synced_at=CURRENT_TIMESTAMP,price_sync_status='error',price_sync_error=? WHERE id=?`).bind(detail,product.id).run();
    console.warn(JSON.stringify({ event: "mercadolivre_price_sync_failed", productId: product.id, error: detail }));
    return { id: product.id, success: false, error: detail };
  }
}

async function syncMercadoLivrePrices(env, { limit = 40, productId = null } = {}) {
  const args = [];
  let filter = `price_sync_enabled=1 AND price_source='mercadolivre'`;
  if (productId) { filter += " AND id=?"; args.push(productId); }
  const { results } = await env.DB.prepare(`SELECT id,price_source_item_id priceSourceItemId,price_source_offer_id priceSourceOfferId,price_source_url priceSourceUrl FROM products WHERE ${filter} ORDER BY COALESCE(datetime(price_synced_at),datetime('1970-01-01')) LIMIT ?`).bind(...args,Math.max(1,Math.min(100,Number(limit)||40))).all();
  if (!results?.length) return { processed: 0, updated: 0, failed: 0, items: [] };
  const token = await mercadoLivreAppToken(env);
  const items = [];
  for (const product of results) items.push(await syncMercadoLivreProductPrice(env, product, token));
  return { processed: items.length, updated: items.filter(item=>item.success).length, failed: items.filter(item=>!item.success).length, items };
}

async function adminSyncProductPrice(req, env, productId, id) {
  if (!(await requireAdmin(req, env))) return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const product = await env.DB.prepare(`SELECT id,price_sync_enabled priceSyncEnabled FROM products WHERE id=?`).bind(productId).first();
  if (!product) return fail(req, env, "PRODUCT_NOT_FOUND", "Produto não encontrado", 404, id);
  if (!product.priceSyncEnabled) return fail(req, env, "PRICE_SYNC_DISABLED", "Ative a sincronização importando e salvando um produto do Mercado Livre", 409, id);
  const result = await syncMercadoLivrePrices(env, { productId, limit: 1 });
  if (!result.updated) return fail(req, env, "PRICE_SYNC_FAILED", result.items[0]?.error || "Não foi possível atualizar o preço", 502, id);
  return ok(req, env, result.items[0], id);
}

async function adminImportProductLink(req, env, id) {
  if (!(await requireAdmin(req, env))) return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  try {
    const body = await readJson(req, 8000);
    const source = await resolveMercadoLivreUrl(body.url);
    const token = await mercadoLivreAppToken(env);
    let item = null, itemId = "", resourceType = "item";
    for (const candidate of source.itemIds || []) {
      item = await mercadoLivreJson(`/items/${encodeURIComponent(candidate)}`, token, true);
      if (item?.id) {
        itemId = candidate;
        resourceType = "item";
        break;
      }
    }
    if (!item) for (const candidate of source.itemIds || []) {
      item = await mercadoLivreJson(`/products/${encodeURIComponent(candidate)}`, token, true);
      if (item?.id) {
        itemId = candidate;
        resourceType = "catalog_product";
        break;
      }
    }
    if (!item) {
      const detected = (source.itemIds || []).slice(0, 3).join(", ");
      throw new Error(
        detected
          ? `O código ${detected} foi encontrado, mas o Mercado Livre não disponibilizou os dados desse anúncio. Confirme se a URL abre a página individual e se o anúncio está ativo.`
          : "Nenhum código MLB foi encontrado. Copie a URL da página individual do produto, cujo endereço contém MLB seguido de números.",
      );
    }
    const catalogItems = resourceType === "catalog_product"
      ? await mercadoLivreJson(
          `/products/${encodeURIComponent(itemId)}/items`,
          token,
          true,
        )
      : null;
    const catalogRows = Array.isArray(catalogItems?.results)
      ? catalogItems.results
      : Array.isArray(catalogItems)
        ? catalogItems
        : [];
    const catalogOffer =
      catalogRows.find((offer) =>
        Boolean(offer?.winner || offer?.buy_box_winner),
      ) ||
      catalogRows
        .filter((offer) =>
          mercadoLivreItemId(offer?.item_id || offer?.id) &&
          Number(offer?.price || offer?.sale_price || 0) > 0,
        )
        .sort(
          (a, b) =>
            Number(a.price || a.sale_price) - Number(b.price || b.sale_price),
        )[0] ||
      catalogRows.find((offer) =>
        mercadoLivreItemId(offer?.item_id || offer?.id),
      );
    const winnerItemId = mercadoLivreItemId(
      item.buy_box_winner?.item_id || item.buy_box_winner?.id ||
      catalogOffer?.item_id || catalogOffer?.id,
    );
    const priceItemId = resourceType === "item" ? itemId : winnerItemId;
    const [description, prices, salePrice, winnerItem] = await Promise.all([
      resourceType === "item"
        ? mercadoLivreJson(`/items/${encodeURIComponent(itemId)}/description`, token, true)
        : null,
      priceItemId
        ? mercadoLivreJson(`/items/${encodeURIComponent(priceItemId)}/prices`, token, true)
        : null,
      priceItemId
        ? mercadoLivreJson(`/items/${encodeURIComponent(priceItemId)}/sale_price?context=channel_marketplace`, token, true)
        : null,
      resourceType === "catalog_product" && priceItemId
        ? mercadoLivreJson(`/items/${encodeURIComponent(priceItemId)}`, token, true)
        : null,
    ]);
    const priceValues = mercadoLivrePriceValues(
      winnerItem || item,
      prices,
      salePrice,
      {
        price: catalogOffer?.price ?? catalogOffer?.sale_price ?? item.price ?? item.buy_box_winner?.price ?? source.pageData?.price,
        original_price: catalogOffer?.original_price ?? catalogOffer?.regular_amount ?? item.original_price ?? item.buy_box_winner?.original_price ?? source.pageData?.previousPrice,
      },
    );
    if (Number(source.pageData?.pixPrice) > 0)
      priceValues.currentPriceCents = Math.round(Number(source.pageData.pixPrice) * 100);
    const apiPictures = (Array.isArray(item.pictures) ? item.pictures : []).map((picture) => picture.secure_url || picture.url);
    const pictures = [...new Set([...apiPictures, ...(source.pageData?.pictures || [])])].filter((url) => /^https:\/\//i.test(String(url))).slice(0, 12);
    const specifications = (Array.isArray(item.attributes) ? item.attributes : [])
      .map((attribute) => {
        const name = String(attribute?.name || "").trim();
        const value = String(attribute?.value_name || attribute?.value_struct?.number || "").trim();
        return name && value ? { name, value } : null;
      })
      .filter(Boolean)
      .slice(0, 30);
    const attributesDescription = specifications.map((entry) => `${entry.name}: ${entry.value}`).join("\n");
    const plainDescription = String(
      description?.plain_text || item.short_description?.content || source.pageData?.description || attributesDescription,
    ).trim();
    const productName = String(item.title || item.name || source.pageData?.name || "").trim();
    return ok(req, env, {
      provider: "mercadolivre", itemId, priceItemId, resourceType, sourceUrl: source.url,
      name: productName.slice(0, 160),
      slug: normalizeSearch(productName).replace(/\s+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160),
      shortDescription: plainDescription.slice(0, 500), fullDescription: plainDescription.slice(0, 30000),
      basePriceCents: priceValues.currentPriceCents,
      compareAtPriceCents: priceValues.previousPriceCents,
      priceKind: Number(source.pageData?.pixPrice) > 0 ? "pix" : "marketplace",
      pictures, specifications, permalink: String(item.permalink || source.url),
    }, id);
  } catch (error) {
    return fail(req, env, "PRODUCT_IMPORT_FAILED", String(error?.message || error), 422, id);
  }
}

async function adminAiProductDraft(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "NÃ£o autorizado", 401, id);
  if (!env.AI)
    return fail(req, env, "AI_NOT_CONFIGURED", "O binding Workers AI chamado AI nÃ£o foi configurado", 503, id);
  const body = await readJson(req, 24000);
  const source = String(body.source || "").trim().slice(0, 12000);
  const current = body.current && typeof body.current === "object" ? body.current : {};
  if (!source && !String(current.name || "").trim() && !String(current.fullDescription || "").trim())
    return fail(req, env, "VALIDATION_ERROR", "Informe um tÃ­tulo, descriÃ§Ã£o ou texto de origem", 422, id);
  const categories = await env.DB.prepare(
    "SELECT id,name FROM categories WHERE is_active=1 ORDER BY sort_order,name LIMIT 100",
  ).all();
  const categoryList = (categories.results || []).map((item) => `${item.name} (id=${item.id})`).join(", ");
  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        { role: "system", content: `VocÃª auxilia o cadastro editorial de produtos da SHOPLAB. Gere portuguÃªs brasileiro claro, objetivo e sem exageros. Preserve marca, modelo, capacidade e medidas. Nunca invente especificaÃ§Ãµes, avaliaÃ§Ãµes, preÃ§os, garantias ou benefÃ­cios. Se um dado nÃ£o estiver na entrada, omita-o. O slug deve usar somente a-z, 0-9 e hÃ­fen. categoryId deve ser exatamente um ID desta lista ou null: ${categoryList || "nenhuma categoria"}. productType deve ser book para livro fÃ­sico, digital para produto digital e affiliate nos demais casos. A descriÃ§Ã£o curta deve ter atÃ© 300 caracteres. imageAlt deve descrever o produto de forma curta.` },
        { role: "user", content: JSON.stringify({ source, current }).slice(0, 16000) },
      ],
      response_format: { type: "json_schema", json_schema: ADMIN_PRODUCT_DRAFT_SCHEMA },
      temperature: 0.2, max_tokens: 1200,
    });
    const raw = typeof result?.response === "string" ? JSON.parse(result.response) : result?.response;
    if (!raw || typeof raw.name !== "string") throw new Error("Resposta estruturada invÃ¡lida");
    const validCategories = new Set((categories.results || []).map((item) => item.id));
    const slug = normalizeSearch(raw.slug || raw.name).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
    const specifications = (Array.isArray(raw.specifications) ? raw.specifications : [])
      .map((item) => ({ name: String(item?.name || "").trim().slice(0, 100), value: String(item?.value || "").trim().slice(0, 300) }))
      .filter((item) => item.name && item.value).slice(0, 20);
    return ok(req, env, {
      name: String(raw.name).trim().slice(0, 160), slug: slug.slice(0, 160),
      shortDescription: String(raw.shortDescription || "").trim().slice(0, 500),
      fullDescription: String(raw.fullDescription || "").trim().slice(0, 10000),
      categoryId: validCategories.has(raw.categoryId) ? raw.categoryId : null,
      productType: ["affiliate", "book", "digital"].includes(raw.productType) ? raw.productType : "affiliate",
      imageAlt: String(raw.imageAlt || "").trim().slice(0, 250), specifications,
    }, id);
  } catch (error) {
    console.warn(JSON.stringify({ event: "admin_ai_product_draft_failed", requestId: id, error: String(error?.message || error) }));
    return fail(req, env, "AI_GENERATION_FAILED", "NÃ£o foi possÃ­vel gerar as sugestÃµes agora", 502, id);
  }
}

function toPriceCents(value) {
  if (value == null || value === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) : null;
}

function shouldInterpretSearch(query) {
  const normalized = normalizeSearch(query);
  return normalized.split(" ").filter(Boolean).length >= 3 ||
    /\b(ate|acima|abaixo|menos|mais|barato|melhor|para|por|entre|reais)\b/.test(normalized);
}

function shouldEnhanceSuggestions(query) {
  const normalized = normalizeSearch(query);
  const words = normalized.split(" ").filter(Boolean);
  return normalized.length >= 12 && words.length >= 3 &&
    /\b(ate|acima|abaixo|menos|mais|barato|melhor|para|por|entre|reais|estudar|trabalhar|jogar|correr|presente)\b/.test(normalized);
}

async function cachedSearchIntent(env, originalQuery, ctx) {
  if (!env.AI || !shouldInterpretSearch(originalQuery)) return null;
  const normalized = normalizeSearch(originalQuery);
  const cacheKey = new Request(
    `https://search-intent.shoplab.internal/v1?q=${encodeURIComponent(normalized)}`,
  );
  try {
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached.json();
  } catch (error) {
    console.warn(JSON.stringify({ event: "ai_search_cache_read_failed", error: String(error?.message || error) }));
  }
  const intent = await interpretSearchIntent(env, originalQuery);
  if (!intent) return null;
  try {
    const response = new Response(JSON.stringify(intent), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=604800",
      },
    });
    const write = caches.default.put(cacheKey, response);
    if (ctx?.waitUntil)
      ctx.waitUntil(write.catch((error) =>
        console.warn(JSON.stringify({ event: "ai_search_cache_write_failed", error: String(error?.message || error) })),
      ));
    else await write;
  } catch (error) {
    console.warn(JSON.stringify({ event: "ai_search_cache_write_failed", error: String(error?.message || error) }));
  }
  return intent;
}

async function interpretSearchIntent(env, originalQuery) {
  if (!env.AI || !shouldInterpretSearch(originalQuery)) return null;
  try {
    const [categories, brands] = await env.DB.batch([
      env.DB.prepare("SELECT name,slug FROM categories WHERE is_active=1 ORDER BY sort_order,name LIMIT 100"),
      env.DB.prepare("SELECT name FROM brands ORDER BY name LIMIT 100"),
    ]);
    const categoryList = (categories.results || []).map((item) => `${item.name}=${item.slug}`).join(", ");
    const brandList = (brands.results || []).map((item) => item.name).join(", ");
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        {
          role: "system",
          content: `Interprete buscas de um comparador brasileiro. searchTerms deve comecar pelo tipo canonico de produto que a pessoa quer, mesmo quando ela descreve apenas a finalidade. Exemplos: "dispositivo para ler" vira "leitor ereader"; "computador para faculdade" vira "notebook estudar"; "fone para correr" vira "fone esporte". Depois mantenha modelo e caracteristicas uteis, removendo conectivos, orcamento e ordenacao. Extraia apenas filtros pedidos ou inequivocos. Use somente um slug de categoria ou null: ${categoryList || "nenhuma"}. Use somente uma marca desta lista, em minusculas, ou null: ${brandList || "nenhuma"}. Precos sao em reais. sort: price-asc para menor preco, discount para desconto, ou null. Nunca invente dados. explanation deve ser uma frase curta em portugues.`,
        },
        { role: "user", content: originalQuery },
      ],
      response_format: { type: "json_schema", json_schema: SEARCH_INTENT_SCHEMA },
      temperature: 0,
      max_tokens: 250,
    });
    const value = result?.response;
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed.searchTerms !== "string") return null;
    const validCategories = new Set((categories.results || []).map((item) => item.slug));
    const validBrands = new Set((brands.results || []).map((item) => normalizeSearch(item.name)));
    const searchTerms = normalizeSearch(parsed.searchTerms).slice(0, 100);
    if (searchTerms.length < 2) return null;
    return {
      searchTerms,
      category: validCategories.has(parsed.category) ? parsed.category : null,
      brand: validBrands.has(normalizeSearch(parsed.brand)) ? normalizeSearch(parsed.brand) : null,
      minPrice: parsed.minPrice != null && Number(parsed.minPrice) > 0 ? Number(parsed.minPrice) : null,
      maxPrice: parsed.maxPrice != null && Number(parsed.maxPrice) > 0 ? Number(parsed.maxPrice) : null,
      sort: ["price-asc", "discount"].includes(parsed.sort) ? parsed.sort : null,
      explanation: String(parsed.explanation || "").slice(0, 180),
    };
  } catch (error) {
    console.warn(JSON.stringify({ event: "ai_search_fallback", error: String(error?.message || error) }));
    return null;
  }
}

async function suggestionProducts(env, ftsQuery) {
  if (!ftsQuery) return [];
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
  ).bind(ftsQuery).all();
  return results || [];
}

async function suggestionsV2(req, env, url, ctx, id) {
  const query = normalizeSearch(url.searchParams.get("q"));
  if (query.length < 2) return ok(req, env, [], id);
  const correctedQuery = correctedSearch(query),
    ftsQuery = buildFtsQuery(correctedQuery);
  const regular = await suggestionProducts(env, ftsQuery);
  const aiRequested = url.searchParams.get("ai") === "1";
  if (!aiRequested || !shouldEnhanceSuggestions(query))
    return ok(req, env, regular, id, { aiUsed: false });
  const intent = await cachedSearchIntent(env, query, ctx);
  if (!intent?.searchTerms)
    return ok(req, env, regular, id, { aiUsed: false });
  const interpretedQuery = correctedSearch(intent.searchTerms);
  const intelligent = interpretedQuery === correctedQuery
    ? []
    : await suggestionProducts(env, buildIntentFtsQuery(interpretedQuery));
  const merged = [...intelligent, ...regular]
    .filter((item, index, items) => items.findIndex((other) => other.slug === item.slug) === index)
    .slice(0, 8);
  return ok(req, env, merged, id, {
    aiUsed: true,
    interpretedQuery,
    explanation: intent.explanation,
  });
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
    `SELECT id,name,slug,subtitle,product_type productType,status,category_id categoryId,brand_id brandId,short_description shortDescription,full_description fullDescription,editorial_review editorialReview,editorial_score editorialScore,base_price_cents basePriceCents,compare_at_price_cents compareAtPriceCents,is_featured isFeatured,specifications_json specificationsJson,price_source priceSource,price_source_item_id priceSourceItemId,price_source_offer_id priceSourceOfferId,price_source_url priceSourceUrl,price_sync_enabled priceSyncEnabled,price_synced_at priceSyncedAt,price_sync_status priceSyncStatus,price_sync_error priceSyncError FROM products WHERE id=?`,
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
  const [offers, media, partners, brands] = await env.DB.batch([
    env.DB.prepare(
      `SELECT id,partner_id partnerId,affiliate_url affiliateUrl,current_price_cents currentPriceCents,previous_price_cents previousPriceCents,coupon_code couponCode,availability,button_text buttonText,is_primary isPrimary FROM offers WHERE product_id=? ORDER BY is_primary DESC,priority DESC`,
    ).bind(productId),
    env.DB.prepare(
      `SELECT id,type,storage_key storageKey,external_url externalUrl,alt_text altText,caption,is_primary isPrimary,sort_order sortOrder FROM product_media WHERE product_id=? ORDER BY is_primary DESC,sort_order`,
    ).bind(productId),
    env.DB.prepare(
      `SELECT id,name,logo_url logoUrl FROM partners WHERE is_active=1 ORDER BY name`,
    ),
    env.DB.prepare(`SELECT id,name,logo_url logoUrl FROM brands WHERE is_active=1 ORDER BY name`),
  ]);
  return ok(
    req,
    env,
    {
      ...product,
      specificationGroups: parse(product.specificationsJson, []),
      offers: offers.results || [],
      media: media.results || [],
      partners: partners.results || [],
      brands: brands.results || [],
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

  if (!("body" in object)) {
    const cacheValidatorMatched =
      req.headers.has("if-none-match") ||
      req.headers.has("if-modified-since");
    return new Response(null, {
      status: cacheValidatorMatched ? 304 : 412,
      headers,
    });
  }

  return new Response(object.body, { status: 200, headers });
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

async function adminUsers(req,env,url,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const q=String(url.searchParams.get("q")||"").trim().slice(0,100),limit=clamp(url.searchParams.get("limit"),1,50,20),offset=clamp(url.searchParams.get("offset"),0,100000,0),like=`%${q}%`;
  const {results}=await env.DB.prepare(`SELECT up.user_id userId,up.email,up.display_name displayName,up.status,up.blocked_until blockedUntil,COALESCE((SELECT MAX(us.last_seen_at) FROM user_sessions us WHERE us.user_id=up.user_id),up.last_seen_at) lastSeenAt,up.created_at createdAt,
    COALESCE((SELECT SUM(active_seconds) FROM user_sessions us WHERE us.user_id=up.user_id),0) activeSeconds,
    (SELECT COUNT(*) FROM share_links sl WHERE sl.user_id=up.user_id) sharedProducts,
    COALESCE((SELECT SUM(click_count) FROM share_links sl WHERE sl.user_id=up.user_id),0) shareClicks,
    (SELECT COUNT(*) FROM referrals r WHERE r.referrer_user_id=up.user_id AND r.status='qualified') qualifiedInvites
    FROM user_profiles up WHERE (?='' OR up.display_name LIKE ? OR up.email LIKE ?) ORDER BY datetime(up.last_seen_at) DESC,datetime(up.created_at) DESC LIMIT ? OFFSET ?`).bind(q,like,like,limit+1,offset).all();
  const rows=results||[],hasMore=rows.length>limit;
  return ok(req,env,{items:rows.slice(0,limit),hasMore,nextOffset:offset+limit},id);
}

async function adminUserDetail(req,env,userId,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const [profile,shares,referrals,rewards,sessions,events,usage,topProducts,activityByDay,eventBreakdown,topSearches,topCategories,manualRewards]=await env.DB.batch([
    env.DB.prepare(`SELECT up.user_id userId,up.email,up.display_name displayName,up.status,up.blocked_until blockedUntil,up.moderation_note moderationNote,COALESCE((SELECT MAX(us.last_seen_at) FROM user_sessions us WHERE us.user_id=up.user_id),up.last_seen_at) lastSeenAt,up.created_at createdAt FROM user_profiles up WHERE up.user_id=?`).bind(userId),
    env.DB.prepare(`SELECT sl.product_slug productSlug,p.name,sl.click_count clickCount,sl.unique_click_count uniqueClicks,sl.last_clicked_at lastClickedAt FROM share_links sl LEFT JOIN products p ON p.slug=sl.product_slug WHERE sl.user_id=? ORDER BY sl.created_at DESC LIMIT 20`).bind(userId),
    env.DB.prepare(`SELECT r.status,r.created_at createdAt,r.qualified_at qualifiedAt,up.display_name displayName,up.email FROM referrals r LEFT JOIN user_profiles up ON up.user_id=r.referred_user_id WHERE r.referrer_user_id=? ORDER BY r.created_at DESC LIMIT 30`).bind(userId),
    env.DB.prepare(`SELECT id,milestone,status,admin_note adminNote,created_at createdAt FROM referral_rewards WHERE user_id=? ORDER BY milestone`).bind(userId),
    env.DB.prepare(`SELECT id,started_at startedAt,last_seen_at lastSeenAt,active_seconds activeSeconds FROM user_sessions WHERE user_id=? ORDER BY last_seen_at DESC LIMIT 20`).bind(userId),
    env.DB.prepare(`SELECT id,event_type eventType,product_slug productSlug,query_text queryText,metadata_json metadataJson,created_at createdAt FROM events WHERE user_id=? ORDER BY created_at DESC LIMIT 30`).bind(userId),
    env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM user_favorites WHERE user_id=?) favorites,
      (SELECT COUNT(*) FROM user_cart WHERE user_id=?) cartProducts,
      (SELECT COALESCE(SUM(quantity),0) FROM user_cart WHERE user_id=?) cartItems,
      (SELECT COUNT(*) FROM user_ratings WHERE user_id=?) ratings,
      (SELECT COUNT(*) FROM user_view_history WHERE user_id=?) viewedProducts,
      (SELECT COUNT(*) FROM events WHERE user_id=? AND event_type IN ('search','search_no_results')) searches,
      (SELECT COUNT(*) FROM events WHERE user_id=? AND event_type='offer_click') offerClicks,
      (SELECT COUNT(*) FROM events WHERE user_id=? AND created_at>=datetime('now','-7 days')) events7d,
      (SELECT COUNT(*) FROM events WHERE user_id=? AND created_at>=datetime('now','-30 days')) events30d,
      (SELECT COUNT(*) FROM user_sessions WHERE user_id=?) sessionCount,
      (SELECT COALESCE(SUM(active_seconds),0) FROM user_sessions WHERE user_id=?) totalActiveSeconds,
      (SELECT COALESCE(SUM(active_seconds),0) FROM user_sessions WHERE user_id=? AND last_seen_at>=datetime('now','-7 days')) activeSeconds7d`).bind(userId,userId,userId,userId,userId,userId,userId,userId,userId,userId,userId,userId),
    env.DB.prepare(`SELECT e.product_slug productSlug,p.name,COUNT(*) interactions,
      SUM(e.event_type='product_view') views,SUM(e.event_type='offer_click') offerClicks
      FROM events e LEFT JOIN products p ON p.slug=e.product_slug
      WHERE e.user_id=? AND e.product_slug IS NOT NULL
      GROUP BY e.product_slug ORDER BY interactions DESC,MAX(e.created_at) DESC LIMIT 8`).bind(userId),
    env.DB.prepare(`WITH RECURSIVE days(day) AS (SELECT date('now','-29 days') UNION ALL SELECT date(day,'+1 day') FROM days WHERE day<date('now')) SELECT days.day,COUNT(e.id) events,COUNT(DISTINCT e.product_slug) products FROM days LEFT JOIN events e ON e.user_id=? AND date(e.created_at)=days.day GROUP BY days.day ORDER BY days.day`).bind(userId),
    env.DB.prepare(`SELECT event_type eventType,COUNT(*) total,MAX(created_at) lastAt FROM events WHERE user_id=? AND created_at>=datetime('now','-30 days') GROUP BY event_type ORDER BY total DESC`).bind(userId),
    env.DB.prepare(`SELECT query_text query,COUNT(*) total,MAX(created_at) lastAt FROM events WHERE user_id=? AND event_type IN ('search','search_no_results') AND query_text IS NOT NULL GROUP BY query_text ORDER BY total DESC,lastAt DESC LIMIT 10`).bind(userId),
    env.DB.prepare(`SELECT COALESCE(c.name,'Sem categoria') name,c.slug,COUNT(*) interactions,SUM(e.event_type='offer_click') offerClicks FROM events e JOIN products p ON p.slug=e.product_slug LEFT JOIN categories c ON c.id=p.category_id WHERE e.user_id=? AND e.product_slug IS NOT NULL AND e.created_at>=datetime('now','-90 days') GROUP BY c.id ORDER BY interactions DESC LIMIT 8`).bind(userId),
    env.DB.prepare(`SELECT mr.id,mr.title,mr.reason,mr.status,mr.value_cents valueCents,mr.email_status emailStatus,mr.email_error emailError,mr.delivered_at deliveredAt,mr.redeemed_at redeemedAt,gct.name giftCardType FROM manual_user_rewards mr JOIN gift_card_types gct ON gct.id=mr.gift_card_type_id WHERE mr.user_id=? ORDER BY mr.created_at DESC LIMIT 20`).bind(userId),
  ]);
  const row=profile.results?.[0];if(!row)return fail(req,env,"USER_NOT_FOUND","Usuário não encontrado",404,id);
  return ok(req,env,{profile:row,shares:shares.results||[],referrals:referrals.results||[],rewards:rewards.results||[],manualRewards:manualRewards.results||[],sessions:sessions.results||[],events:events.results||[],usage:usage.results?.[0]||{},topProducts:topProducts.results||[],analytics:{activityByDay:activityByDay.results||[],eventBreakdown:eventBreakdown.results||[],topSearches:topSearches.results||[],topCategories:topCategories.results||[]}},id);
}

async function adminUserEvents(req,env,userId,url,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const limit=clamp(url.searchParams.get("limit"),1,50,30),offset=clamp(url.searchParams.get("offset"),0,100000,0);
  const {results}=await env.DB.prepare(`SELECT id,event_type eventType,product_slug productSlug,query_text queryText,metadata_json metadataJson,created_at createdAt FROM events WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(userId,limit+1,offset).all();
  const rows=results||[];return ok(req,env,{items:rows.slice(0,limit),hasMore:rows.length>limit,nextOffset:offset+limit},id);
}

async function updateAdminUserAccess(req,env,userId,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const body=await readJson(req,4096),action=String(body.action||""),note=String(body.note||"").slice(0,500);
  let status="active",until=null;if(action==="block")status="blocked";else if(action==="timeout"){const minutes=clamp(body.minutes,5,43200,60);until=new Date(Date.now()+minutes*60000).toISOString()}else if(action!=="activate")return fail(req,env,"VALIDATION_ERROR","Ação inválida",422,id);
  const result=await env.DB.prepare(`UPDATE user_profiles SET status=?,blocked_until=?,moderation_note=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(status,until,note,userId).run();
  if(!result.meta.changes)return fail(req,env,"USER_NOT_FOUND","Usuário não encontrado",404,id);
  return ok(req,env,{userId,status,blockedUntil:until},id);
}

async function adminReferralRewards(req,env,url,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const status=String(url.searchParams.get("status")??"pending");
  const {results}=await env.DB.prepare(`SELECT rr.id,rr.milestone,rr.status,rr.admin_note adminNote,rr.created_at createdAt,up.user_id userId,up.display_name displayName,up.email,
    rgc.id giftCardId,rgc.value_cents giftCardValueCents,rgc.currency giftCardCurrency,rgc.expires_at giftCardExpiresAt,rgc.delivered_at giftCardDeliveredAt,
    gct.name giftCardType,gct.logo_storage_key giftCardLogoStorageKey
    FROM referral_rewards rr JOIN user_profiles up ON up.user_id=rr.user_id
    LEFT JOIN reward_gift_cards rgc ON rgc.reward_id=rr.id
    LEFT JOIN gift_card_types gct ON gct.id=rgc.gift_card_type_id
    WHERE (?='' OR rr.status=?) ORDER BY rr.created_at`).bind(status,status).all();
  const origin=new URL(req.url).origin;
  return ok(req,env,(results||[]).map(row=>({...row,effectiveStatus:row.giftCardId&&row.status==="approved"?"delivered":row.status,giftCardLogoUrl:row.giftCardLogoStorageKey?`${origin}/media/${encodeURIComponent(row.giftCardLogoStorageKey)}`:null})),id);
}

async function updateReferralReward(req,env,rewardId,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const body=await readJson(req,4096),status=String(body.status||"");if(!["approved","redeemed","rejected"].includes(status))return fail(req,env,"VALIDATION_ERROR","Status inválido",422,id);
  const result=await env.DB.prepare(`UPDATE referral_rewards SET status=?,admin_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,String(body.note||"").slice(0,500),rewardId).run();
  if(!result.meta.changes)return fail(req,env,"REWARD_NOT_FOUND","Recompensa não encontrada",404,id);return ok(req,env,{id:rewardId,status},id);
}

function giftCardTypeValues(form){
  const allowedValues=[...new Set(String(form.get("allowedValues")||"").split(",").map(value=>Number(String(value).trim().replace(",","."))).filter(value=>Number.isFinite(value)&&value>0&&value<=100000).map(value=>Math.round(value*100)))].slice(0,30);
  return {
    name:String(form.get("name")||"").trim().slice(0,100),
    slug:normalizeSearch(form.get("slug")||form.get("name")).replace(/\s+/g,"-").replace(/^-+|-+$/g,"").slice(0,100),
    allowedValues,
    instructions:String(form.get("instructions")||"").trim().slice(0,1000),
    isActive:String(form.get("isActive"))!=="false",
  };
}

async function adminGiftCardTypes(req,env,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const {results}=await env.DB.prepare(`SELECT id,name,slug,logo_storage_key logoStorageKey,allowed_values_json allowedValuesJson,instructions,is_active isActive,created_at createdAt FROM gift_card_types ORDER BY is_active DESC,name`).all();
  const origin=new URL(req.url).origin;
  return ok(req,env,(results||[]).map(item=>({...item,allowedValues:parse(item.allowedValuesJson,[]),logoUrl:item.logoStorageKey?`${origin}/media/${encodeURIComponent(item.logoStorageKey)}`:null})),id);
}

async function saveGiftCardType(req,env,typeId,id,creating){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  if(!env.MEDIA)return fail(req,env,"R2_NOT_CONFIGURED","O binding R2 MEDIA não foi configurado",503,id);
  const existing=creating?null:await env.DB.prepare(`SELECT logo_storage_key logoStorageKey FROM gift_card_types WHERE id=?`).bind(typeId).first();
  if(!creating&&!existing)return fail(req,env,"GIFT_CARD_TYPE_NOT_FOUND","Tipo de gift card não encontrado",404,id);
  const form=await req.formData(),values=giftCardTypeValues(form);
  if(!values.name||!/^[a-z0-9-]{2,100}$/.test(values.slug))return fail(req,env,"VALIDATION_ERROR","Informe nome e identificador válidos",422,id);
  if(!values.allowedValues.length)return fail(req,env,"VALIDATION_ERROR","Informe pelo menos um valor disponível",422,id);
  let logoStorageKey=existing?.logoStorageKey||null;
  const logo=form.get("logo");
  try{if(logo instanceof File&&logo.size)logoStorageKey=await storeSiteImage(env,logo,"gift-card-types",typeId)}catch(error){return fail(req,env,"INVALID_FILE",error.message,422,id)}
  if(!logoStorageKey)return fail(req,env,"VALIDATION_ERROR","Envie o logo do gift card",422,id);
  if(creating)await env.DB.prepare(`INSERT INTO gift_card_types(id,name,slug,logo_storage_key,allowed_values_json,instructions,is_active) VALUES(?,?,?,?,?,?,?)`).bind(typeId,values.name,values.slug,logoStorageKey,JSON.stringify(values.allowedValues),values.instructions,values.isActive?1:0).run();
  else await env.DB.prepare(`UPDATE gift_card_types SET name=?,slug=?,logo_storage_key=?,allowed_values_json=?,instructions=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(values.name,values.slug,logoStorageKey,JSON.stringify(values.allowedValues),values.instructions,values.isActive?1:0,typeId).run();
  if(existing?.logoStorageKey&&existing.logoStorageKey!==logoStorageKey)await env.MEDIA.delete(existing.logoStorageKey);
  return ok(req,env,{id:typeId},id);
}

async function createGiftCardType(req,env,id){return saveGiftCardType(req,env,crypto.randomUUID(),id,true)}
async function updateGiftCardType(req,env,typeId,id){return saveGiftCardType(req,env,typeId,id,false)}

async function deleteGiftCardType(req,env,typeId,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const [type,referralUsage,manualUsage]=await env.DB.batch([
    env.DB.prepare(`SELECT id,logo_storage_key logoStorageKey FROM gift_card_types WHERE id=?`).bind(typeId),
    env.DB.prepare(`SELECT COUNT(*) total FROM reward_gift_cards WHERE gift_card_type_id=?`).bind(typeId),
    env.DB.prepare(`SELECT COUNT(*) total FROM manual_user_rewards WHERE gift_card_type_id=?`).bind(typeId),
  ]);
  const row=type.results?.[0];
  if(!row)return fail(req,env,"GIFT_CARD_TYPE_NOT_FOUND","Tipo de gift card não encontrado",404,id);
  const usage=Number(referralUsage.results?.[0]?.total||0)+Number(manualUsage.results?.[0]?.total||0);
  if(usage)return fail(req,env,"GIFT_CARD_TYPE_IN_USE","Este gift card já foi usado em recompensas. Desative o tipo para preservar o histórico dos usuários.",409,id);
  await env.DB.prepare(`DELETE FROM gift_card_types WHERE id=?`).bind(typeId).run();
  if(row.logoStorageKey&&env.MEDIA){
    try{await env.MEDIA.delete(row.logoStorageKey)}catch(error){console.warn(JSON.stringify({event:"gift_card_type_logo_delete_failed",typeId,error:String(error?.message||error)}))}
  }
  return ok(req,env,{id:typeId,deleted:true},id);
}

async function deliverReferralGiftCard(req,env,rewardId,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  if(String(env.GIFT_CARD_ENCRYPTION_KEY||"").length<24)return fail(req,env,"GIFT_CARD_KEY_NOT_CONFIGURED","Configure o secret GIFT_CARD_ENCRYPTION_KEY com pelo menos 24 caracteres antes de entregar cartões",503,id);
  const body=await readJson(req,12000),typeId=String(body.typeId||""),valueCents=nullableCents(body.valueCents),code=String(body.code||"").trim().slice(0,300),pin=String(body.pin||"").trim().slice(0,100),expiresAt=optionalExpiryDate(body.expiresAt);
  const [reward,type]=await env.DB.batch([
    env.DB.prepare(`SELECT id,status FROM referral_rewards WHERE id=?`).bind(rewardId),
    env.DB.prepare(`SELECT id,allowed_values_json allowedValuesJson,instructions FROM gift_card_types WHERE id=? AND is_active=1`).bind(typeId),
  ]);
  const rewardRow=reward.results?.[0],typeRow=type.results?.[0];
  if(!rewardRow)return fail(req,env,"REWARD_NOT_FOUND","Recompensa não encontrada",404,id);
  if(rewardRow.status!=="approved")return fail(req,env,"REWARD_NOT_APPROVED","Aprove a recompensa antes de entregar o gift card",409,id);
  if(!typeRow)return fail(req,env,"GIFT_CARD_TYPE_NOT_FOUND","Tipo de gift card indisponível",404,id);
  if(!valueCents||!parse(typeRow.allowedValuesJson,[]).includes(valueCents))return fail(req,env,"VALIDATION_ERROR","Selecione um valor permitido para este gift card",422,id);
  if(code.length<4)return fail(req,env,"VALIDATION_ERROR","Informe o código do gift card",422,id);
  const codeEncrypted=await encryptGiftCardSecret(env,code),pinEncrypted=pin?await encryptGiftCardSecret(env,pin):null,instructions=String(body.instructions||typeRow.instructions||"").trim().slice(0,1000);
  await env.DB.prepare(`INSERT INTO reward_gift_cards(id,reward_id,gift_card_type_id,value_cents,code_encrypted,pin_encrypted,expires_at,instructions) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(reward_id) DO UPDATE SET gift_card_type_id=excluded.gift_card_type_id,value_cents=excluded.value_cents,code_encrypted=excluded.code_encrypted,pin_encrypted=excluded.pin_encrypted,expires_at=excluded.expires_at,instructions=excluded.instructions,delivered_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(crypto.randomUUID(),rewardId,typeId,valueCents,codeEncrypted,pinEncrypted,expiresAt,instructions).run();
  return ok(req,env,{id:rewardId,status:"delivered"},id);
}

async function sendRewardNotificationEmail(apiKey,from,accountUrl,reward,recipient){
  const safeName=htmlAttribute(recipient.displayName||"cliente"),safeTitle=htmlAttribute(reward.title),safeReason=htmlAttribute(reward.reason),safeValue=(reward.valueCents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),safeAccountUrl=htmlAttribute(accountUrl);
  const reasonBlock=safeReason?`<tr><td style="padding:0 32px 24px"><div style="background:#f4f8f7;border-left:4px solid #0a7b6f;border-radius:8px;padding:16px 18px"><p style="margin:0 0 6px;color:#526963;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Motivo da recompensa</p><p style="margin:0;color:#173b34;font-size:15px;line-height:1.6">${safeReason}</p></div></td></tr>`:"";
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Você recebeu uma recompensa da SHOPLAB</title></head><body style="margin:0;padding:0;background:#eef4f2;font-family:Arial,Helvetica,sans-serif;color:#173b34"><div style="display:none;max-height:0;overflow:hidden;opacity:0">Sua recompensa já está disponível na sua conta SHOPLAB.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef4f2"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #dfe9e6;border-radius:18px;overflow:hidden"><tr><td style="background:#0a5148;padding:24px 32px"><p style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:.04em">SHOPLAB</p><p style="margin:5px 0 0;color:#cce7e1;font-size:13px">Recompensas</p></td></tr><tr><td style="padding:34px 32px 16px"><p style="margin:0 0 10px;color:#0a7b6f;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Uma surpresa para você</p><h1 style="margin:0 0 18px;color:#173b34;font-size:28px;line-height:1.2">Você recebeu uma recompensa!</h1><p style="margin:0 0 14px;color:#405951;font-size:16px;line-height:1.65">Olá, ${safeName}.</p><p style="margin:0;color:#405951;font-size:16px;line-height:1.65">A SHOPLAB enviou <strong style="color:#173b34">${safeTitle}</strong>, no valor de <strong style="color:#0a7b6f">${safeValue}</strong>.</p></td></tr>${reasonBlock}<tr><td align="center" style="padding:4px 32px 28px"><a href="${safeAccountUrl}" style="display:inline-block;background:#0a7b6f;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 24px;border-radius:10px">Acessar e resgatar recompensa</a></td></tr><tr><td style="padding:0 32px 30px"><div style="border-top:1px solid #e4ecea;padding-top:20px"><p style="margin:0 0 8px;color:#526963;font-size:13px;line-height:1.6"><strong>Importante:</strong> por segurança, o código da recompensa fica disponível somente na sua conta. A SHOPLAB nunca solicitará sua senha por e-mail.</p><p style="margin:0;color:#71837e;font-size:12px;line-height:1.6">Se o botão não funcionar, acesse: <a href="${safeAccountUrl}" style="color:#0a7b6f;word-break:break-all">${safeAccountUrl}</a></p></div></td></tr><tr><td style="background:#f7faf9;padding:20px 32px;text-align:center"><p style="margin:0;color:#71837e;font-size:12px;line-height:1.5">Esta é uma mensagem automática da SHOPLAB. Não responda a este e-mail.</p></td></tr></table></td></tr></table></body></html>`;
  const text=`Você recebeu uma recompensa da SHOPLAB\n\nOlá, ${recipient.displayName||"cliente"}.\n\nRecompensa: ${reward.title}\nValor: ${safeValue}${reward.reason?`\nMotivo: ${reward.reason}`:""}\n\nAcesse sua conta para visualizar e resgatar com segurança: ${accountUrl}\n\nA SHOPLAB nunca solicitará sua senha por e-mail.`;
  const payload={from,to:[recipient.email],subject:"Você recebeu uma recompensa da SHOPLAB",html,text,tags:[{name:"category",value:"manual_reward"},{name:"reward_id",value:reward.id.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,256)}]};
  try{
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json","user-agent":"SHOPLAB-Worker/1.0","idempotency-key":`manual-reward-${reward.id}`},body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(String(result.message||result.name||`Resend ${response.status}`).slice(0,500));
    return {status:"sent",id:String(result.id||"").slice(0,200)||null,error:""};
  }catch(error){
    const detail=String(error?.message||error).slice(0,500);
    console.error(JSON.stringify({event:"manual_reward_email_failed",rewardId:reward.id,recipient:recipient.email,error:detail}));
    return {status:"failed",id:null,error:detail};
  }
}

async function sendManualRewardEmail(env,reward,recipient){
  const apiKey=String(env.RESEND_API_KEY||""),from=String(env.REWARD_EMAIL_FROM||"");
  if(!apiKey||!from)return {status:"skipped",id:null,error:"RESEND_API_KEY ou REWARD_EMAIL_FROM não configurado"};
  const accountUrl=`${String(env.PUBLIC_SITE_URL||allowedOrigins(env)[0]||"").replace(/\/+$/,"")}/conta.html#invites`;
  return sendRewardNotificationEmail(apiKey,from,accountUrl,reward,recipient);
}

async function createManualUserReward(req,env,userId,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  if(String(env.GIFT_CARD_ENCRYPTION_KEY||"").length<24)return fail(req,env,"GIFT_CARD_KEY_NOT_CONFIGURED","Configure GIFT_CARD_ENCRYPTION_KEY antes de entregar recompensas",503,id);
  const body=await readJson(req,12000),typeId=String(body.typeId||""),title=String(body.title||"Recompensa SHOPLAB").trim().slice(0,140),reason=String(body.reason||"").trim().slice(0,1000),valueCents=nullableCents(body.valueCents),code=String(body.code||"").trim().slice(0,300),pin=String(body.pin||"").trim().slice(0,100),expiresAt=optionalExpiryDate(body.expiresAt);
  const [profileResult,typeResult]=await env.DB.batch([
    env.DB.prepare(`SELECT user_id userId,email,display_name displayName FROM user_profiles WHERE user_id=?`).bind(userId),
    env.DB.prepare(`SELECT id,name,allowed_values_json allowedValuesJson,instructions FROM gift_card_types WHERE id=? AND is_active=1`).bind(typeId),
  ]),profile=profileResult.results?.[0],type=typeResult.results?.[0];
  if(!profile)return fail(req,env,"USER_NOT_FOUND","Usuário não encontrado",404,id);
  if(!type)return fail(req,env,"GIFT_CARD_TYPE_NOT_FOUND","Tipo de gift card indisponível",404,id);
  if(!title||code.length<4)return fail(req,env,"VALIDATION_ERROR","Informe título e código do gift card",422,id);
  if(!valueCents||!parse(type.allowedValuesJson,[]).includes(valueCents))return fail(req,env,"VALIDATION_ERROR","Selecione um valor permitido para este gift card",422,id);
  const rewardId=crypto.randomUUID(),instructions=String(body.instructions||type.instructions||"").trim().slice(0,1000);
  await env.DB.prepare(`INSERT INTO manual_user_rewards(id,user_id,title,reason,gift_card_type_id,value_cents,code_encrypted,pin_encrypted,expires_at,instructions) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(rewardId,userId,title,reason,typeId,valueCents,await encryptGiftCardSecret(env,code),pin?await encryptGiftCardSecret(env,pin):null,expiresAt,instructions).run();
  const email=await sendManualRewardEmail(env,{id:rewardId,title,reason,valueCents},profile);
  await env.DB.prepare(`UPDATE manual_user_rewards SET email_status=?,email_id=?,email_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(email.status,email.id,email.error,rewardId).run();
  return ok(req,env,{id:rewardId,status:"delivered",emailStatus:email.status,emailError:email.error||null},id);
}

async function deleteManualUserReward(req,env,userId,rewardId,id){
  if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);
  const result=await env.DB.prepare(`DELETE FROM manual_user_rewards WHERE id=? AND user_id=?`).bind(String(rewardId).slice(0,100),String(userId).slice(0,100)).run();
  if(!result.meta.changes)return fail(req,env,"REWARD_NOT_FOUND","Recompensa não encontrada para este usuário",404,id);
  return ok(req,env,{id:rewardId,deleted:true},id);
}

async function userManualRewards(req,env,id){
  const user=await activeUser(req,env);if(!user)return fail(req,env,"UNAUTHORIZED","Entre na sua conta",401,id);
  const {results}=await env.DB.prepare(`SELECT mr.id,mr.title,mr.reason,mr.status,mr.value_cents valueCents,mr.currency,mr.code_encrypted codeEncrypted,mr.pin_encrypted pinEncrypted,mr.expires_at expiresAt,mr.instructions,mr.delivered_at deliveredAt,mr.redeemed_at redeemedAt,gct.name giftCardType,gct.logo_storage_key logoStorageKey FROM manual_user_rewards mr JOIN gift_card_types gct ON gct.id=mr.gift_card_type_id WHERE mr.user_id=? AND mr.status<>'cancelled' ORDER BY mr.created_at DESC`).bind(user.id).all();
  const origin=new URL(req.url).origin,items=[];
  for(const reward of results||[])items.push({id:reward.id,title:reward.title,reason:reward.reason,status:reward.status,valueCents:Number(reward.valueCents||0),currency:reward.currency,code:await decryptGiftCardSecret(env,reward.codeEncrypted),pin:reward.pinEncrypted?await decryptGiftCardSecret(env,reward.pinEncrypted):null,expiresAt:reward.expiresAt,instructions:reward.instructions,deliveredAt:reward.deliveredAt,redeemedAt:reward.redeemedAt,giftCardType:reward.giftCardType,logoUrl:reward.logoStorageKey?`${origin}/media/${encodeURIComponent(reward.logoStorageKey)}`:null});
  const response=ok(req,env,items,id);response.headers.set("cache-control","private, no-store, max-age=0");return response;
}

async function redeemManualUserReward(req,env,rewardId,id){
  const user=await activeUser(req,env);if(!user)return fail(req,env,"UNAUTHORIZED","Entre na sua conta",401,id);
  const reward=await env.DB.prepare(`SELECT id,status,redeemed_at redeemedAt FROM manual_user_rewards WHERE id=? AND user_id=? AND status<>'cancelled'`).bind(String(rewardId).slice(0,100),user.id).first();
  if(!reward)return fail(req,env,"REWARD_NOT_FOUND","Recompensa não encontrada",404,id);
  if(reward.status==="redeemed")return ok(req,env,{id:reward.id,status:"redeemed",redeemedAt:reward.redeemedAt},id);
  const redeemedAt=new Date().toISOString();
  const result=await env.DB.prepare(`UPDATE manual_user_rewards SET status='redeemed',redeemed_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND status='delivered'`).bind(redeemedAt,reward.id,user.id).run();
  if(!result.meta.changes)return fail(req,env,"REWARD_NOT_REDEEMABLE","Esta recompensa não pode ser marcada como resgatada",409,id);
  return ok(req,env,{id:reward.id,status:"redeemed",redeemedAt},id);
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
    env.DB.prepare("SELECT COUNT(*) total FROM user_profiles"),
    env.DB.prepare("SELECT COUNT(*) total FROM user_profiles up WHERE up.status='active' AND (up.blocked_until IS NULL OR up.blocked_until<=CURRENT_TIMESTAMP) AND EXISTS(SELECT 1 FROM user_sessions us WHERE us.user_id=up.user_id AND us.last_seen_at>=datetime('now','-90 seconds'))"),
    env.DB.prepare(`SELECT p.name,p.slug,ROUND(AVG(r.rating),1) average,COUNT(*) total FROM user_ratings r JOIN products p ON p.slug=r.product_slug GROUP BY p.slug ORDER BY average DESC,total DESC LIMIT 1`),
    env.DB.prepare(`SELECT p.name,p.slug,ROUND(AVG(r.rating),1) average,COUNT(*) total FROM user_ratings r JOIN products p ON p.slug=r.product_slug GROUP BY p.slug ORDER BY average ASC,total DESC LIMIT 1`),
    env.DB.prepare("SELECT COUNT(*) total FROM user_profiles WHERE created_at>=datetime('now','-7 days')"),
    env.DB.prepare("SELECT COUNT(*) total FROM events WHERE created_at>=datetime('now','-24 hours')"),
    env.DB.prepare("SELECT COUNT(*) total FROM events WHERE event_type IN ('search','search_no_results') AND created_at>=datetime('now','-7 days')"),
    env.DB.prepare("SELECT COUNT(*) total FROM events WHERE event_type='search_no_results' AND created_at>=datetime('now','-7 days')"),
    env.DB.prepare("SELECT COUNT(*) total FROM share_links"),
    env.DB.prepare("SELECT COUNT(*) total FROM share_visits"),
    env.DB.prepare("SELECT COUNT(*) total FROM referrals WHERE status='qualified'"),
    env.DB.prepare("SELECT COUNT(*) total FROM referral_rewards WHERE status='pending'"),
    env.DB.prepare("SELECT COUNT(*) total FROM user_favorites"),
    env.DB.prepare("SELECT COALESCE(SUM(quantity),0) total FROM user_cart"),
    env.DB.prepare(`SELECT query_text query,COUNT(*) total FROM events
      WHERE event_type IN ('search','search_no_results') AND query_text IS NOT NULL
        AND created_at>=datetime('now','-7 days')
      GROUP BY query_text ORDER BY total DESC,MAX(created_at) DESC LIMIT 8`),
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
      users: total(8),
      activeUsers: total(9),
      mostLiked: results[10].results?.[0] || null,
      mostDisliked: results[11].results?.[0] || null,
      newUsers7d: total(12),
      events24h: total(13),
      searches7d: total(14),
      searchesWithoutResults7d: total(15),
      shareLinks: total(16),
      uniqueShareVisitors: total(17),
      qualifiedReferrals: total(18),
      pendingRewards: total(19),
      favorites: total(20),
      cartItems: total(21),
      topSearches: results[22].results || [],
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
    "SELECT c.id,c.name,c.slug,c.description,c.icon,c.image_storage_key imageStorageKey,c.image_scale imageScale,c.image_position_x imagePositionX,c.image_position_y imagePositionY,c.is_active isActive,c.sort_order sortOrder,COUNT(p.id) productCount FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name",
  ).all();
  const origin=new URL(req.url).origin;
  return ok(req, env, (results||[]).map(category=>({...category,imageUrl:category.imageStorageKey?`${origin}/media/${encodeURIComponent(category.imageStorageKey)}`:null})), id);
}

async function createCategory(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  if (!env.MEDIA)
    return fail(req,env,"R2_NOT_CONFIGURED","O binding R2 MEDIA não foi configurado",503,id);
  const form=await req.formData(),name=String(form.get("name")||"").trim(),slug=String(form.get("slug")||"");
  if (!name || !/^[a-z0-9-]{2,100}$/.test(slug))
    return fail(req, env, "VALIDATION_ERROR", "Nome ou slug inválido", 422, id);
  const categoryId = crypto.randomUUID();
  let imageStorageKey=null;
  const image=form.get("image");
  try{if(image instanceof File&&image.size)imageStorageKey=await storeSiteImage(env,image,"categories",categoryId)}catch(error){return fail(req,env,"INVALID_FILE",error.message,422,id)}
  await env.DB.prepare(
    "INSERT INTO categories(id,name,slug,description,icon,image_storage_key,image_scale,image_position_x,image_position_y,is_active,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
  )
    .bind(
      categoryId,
      name.slice(0, 100),slug,String(form.get("description")||"").slice(0,1000),
      String(form.get("icon")||"⌬").slice(0,8),imageStorageKey,clamp(form.get("imageScale"),50,250,100),clamp(form.get("imagePositionX"),-100,100,0),clamp(form.get("imagePositionY"),-100,100,0),
      String(form.get("isActive"))==="false"?0:1,
      clamp(form.get("sortOrder"),-10000,10000,0),
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
  if (!env.MEDIA)
    return fail(req,env,"R2_NOT_CONFIGURED","O binding R2 MEDIA não foi configurado",503,id);
  const current=await env.DB.prepare("SELECT image_storage_key imageStorageKey FROM categories WHERE id=?").bind(categoryId).first();
  if(!current)return fail(req,env,"CATEGORY_NOT_FOUND","Categoria não encontrada",404,id);
  const form=await req.formData(),name=String(form.get("name")||"").trim(),slug=String(form.get("slug")||"");
  if (!name || !/^[a-z0-9-]{2,100}$/.test(slug))
    return fail(req, env, "VALIDATION_ERROR", "Nome ou slug inválido", 422, id);
  let imageStorageKey=current.imageStorageKey;
  const image=form.get("image");
  try{if(image instanceof File&&image.size)imageStorageKey=await storeSiteImage(env,image,"categories",categoryId)}catch(error){return fail(req,env,"INVALID_FILE",error.message,422,id)}
  const result = await env.DB.prepare(
    "UPDATE categories SET name=?,slug=?,description=?,icon=?,image_storage_key=?,image_scale=?,image_position_x=?,image_position_y=?,is_active=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
  )
    .bind(
      name.slice(0,100),slug,String(form.get("description")||"").slice(0,1000),
      String(form.get("icon")||"⌬").slice(0,8),imageStorageKey,clamp(form.get("imageScale"),50,250,100),clamp(form.get("imagePositionX"),-100,100,0),clamp(form.get("imagePositionY"),-100,100,0),
      String(form.get("isActive"))==="false"?0:1,
      clamp(form.get("sortOrder"),-10000,10000,0),categoryId,
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
  if(current.imageStorageKey&&current.imageStorageKey!==imageStorageKey)await env.MEDIA.delete(current.imageStorageKey);
  return ok(req, env, { id: categoryId,imageStorageKey }, id);
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
  const category=await env.DB.prepare("SELECT image_storage_key imageStorageKey FROM categories WHERE id=?").bind(categoryId).first();
  await env.DB.prepare("DELETE FROM categories WHERE id=?")
    .bind(categoryId)
    .run();
  if(category?.imageStorageKey&&env.MEDIA)await env.MEDIA.delete(category.imageStorageKey);
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
    `SELECT pa.id,pa.name,pa.slug,pa.website_url websiteUrl,pa.logo_url logoUrl,pa.is_active isActive,COUNT(o.id) offerCount FROM partners pa LEFT JOIN offers o ON o.partner_id=pa.id GROUP BY pa.id ORDER BY pa.name`,
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
  if (body.logoUrl && !safeImageUrl(body.logoUrl))
    return "Informe uma URL HTTP ou HTTPS válida para o logo";
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
    `INSERT INTO partners(id,name,slug,website_url,logo_url,is_active) VALUES(?,?,?,?,?,?)`,
  )
    .bind(
      partnerId,
      String(body.name).trim().slice(0, 140),
      body.slug,
      String(body.websiteUrl || "")
        .trim()
        .slice(0, 1000) || null,
      safeImageUrl(body.logoUrl),
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
    `UPDATE partners SET name=?,slug=?,website_url=?,logo_url=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  )
    .bind(
      String(body.name).trim().slice(0, 140),
      body.slug,
      String(body.websiteUrl || "")
        .trim()
        .slice(0, 1000) || null,
      safeImageUrl(body.logoUrl),
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

function safeImageUrl(value) {
  if (!value) return null;
  try { const url = new URL(String(value)); return ["http:", "https:"].includes(url.protocol) ? String(url).slice(0, 1500) : null; }
  catch { return null; }
}

async function adminBrands(req, env, id) {
  if (!(await requireAdmin(req, env))) return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const { results } = await env.DB.prepare(`SELECT b.id,b.name,b.slug,b.description,b.website_url websiteUrl,b.logo_url logoUrl,b.is_active isActive,COUNT(p.id) productCount FROM brands b LEFT JOIN products p ON p.brand_id=b.id GROUP BY b.id ORDER BY b.name`).all();
  return ok(req, env, results || [], id);
}
function validateBrand(body) {
  if (!String(body?.name || "").trim()) return "Informe o nome da marca";
  if (!/^[a-z0-9-]{2,100}$/.test(String(body.slug || ""))) return "Slug da marca inválido";
  if (body.websiteUrl && !safeImageUrl(body.websiteUrl)) return "Informe uma URL válida para o site";
  if (body.logoUrl && !safeImageUrl(body.logoUrl)) return "Informe uma URL válida para o logo";
  return null;
}
async function createBrand(req, env, id) {
  if (!(await requireAdmin(req, env))) return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body=await readJson(req,20000),validation=validateBrand(body);if(validation)return fail(req,env,"VALIDATION_ERROR",validation,422,id);
  const brandId=crypto.randomUUID();await env.DB.prepare(`INSERT INTO brands(id,name,slug,description,website_url,logo_url,is_active) VALUES(?,?,?,?,?,?,?)`).bind(brandId,String(body.name).trim().slice(0,140),body.slug,String(body.description||"").slice(0,1000),String(body.websiteUrl||"").slice(0,1000)||null,safeImageUrl(body.logoUrl),body.isActive===false?0:1).run();
  return ok(req,env,{id:brandId},id);
}
async function updateBrand(req,env,brandId,id){if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);const body=await readJson(req,20000),validation=validateBrand(body);if(validation)return fail(req,env,"VALIDATION_ERROR",validation,422,id);const result=await env.DB.prepare(`UPDATE brands SET name=?,slug=?,description=?,website_url=?,logo_url=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(String(body.name).trim().slice(0,140),body.slug,String(body.description||"").slice(0,1000),String(body.websiteUrl||"").slice(0,1000)||null,safeImageUrl(body.logoUrl),body.isActive===false?0:1,brandId).run();if(!result.meta.changes)return fail(req,env,"BRAND_NOT_FOUND","Marca não encontrada",404,id);return ok(req,env,{id:brandId},id)}
async function deleteBrand(req,env,brandId,id){if(!(await requireAdmin(req,env)))return fail(req,env,"UNAUTHORIZED","Não autorizado",401,id);const used=await env.DB.prepare(`SELECT COUNT(*) total FROM products WHERE brand_id=?`).bind(brandId).first();if(Number(used?.total||0)>0)return fail(req,env,"BRAND_IN_USE","A marca está vinculada a produtos",409,id);await env.DB.prepare(`DELETE FROM brands WHERE id=?`).bind(brandId).run();return ok(req,env,{deleted:true},id)}

function optionalDate(value) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function optionalExpiryDate(value) {
  if (!value) return null;
  const input = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const date = new Date(`${input}T23:59:59.999-03:00`);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  return optionalDate(input);
}

function validDestination(value) {
  const destination = String(value || "").trim();
  const localDestination = destination.replace(/^\.\//, "").replace(/^\//, "");
  if (
    /^(?:produto|categoria|promocoes|produtos|busca|novidades)\.html(?:[?#].*)?$/.test(
      localDestination,
    )
  )
    return localDestination;
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
    `SELECT id,name,eyebrow,title,message,button_text buttonText,link_url linkUrl,desktop_storage_key desktopStorageKey,mobile_storage_key mobileStorageKey,alt_text altText,desktop_position_x desktopPositionX,desktop_position_y desktopPositionY,desktop_scale desktopScale,mobile_position_x mobilePositionX,mobile_position_y mobilePositionY,mobile_scale mobileScale,targeting_json targetingJson,starts_at startsAt,ends_at endsAt,is_active isActive,sort_order sortOrder,created_at createdAt FROM banners ORDER BY sort_order,created_at DESC`,
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
    JSON.stringify({
      keywords:String(form.get("targetKeywords")||"").split(",").map(value=>normalizeSearch(value)).filter(Boolean).slice(0,30),
      categories:String(form.get("targetCategories")||"").split(",").map(value=>normalizeSearch(value).replace(/\s+/g,"-")).filter(value=>/^[a-z0-9-]{2,100}$/.test(value)).slice(0,30),
    }),
    startsAt,
    endsAt,
    String(form.get("isActive")) === "true" ? 1 : 0,
    clamp(form.get("sortOrder"), -10000, 10000, 0),
    clamp(form.get("desktopPositionX"), 0, 100, 50),
    clamp(form.get("desktopPositionY"), 0, 100, 50),
    clamp(form.get("desktopScale"), 10, 400, 100),
    clamp(form.get("mobilePositionX"), 0, 100, 50),
    clamp(form.get("mobilePositionY"), 0, 100, 50),
    clamp(form.get("mobileScale"), 10, 400, 100),
  ];
  if (creating)
    await env.DB.prepare(
      `INSERT INTO banners(id,name,eyebrow,title,message,button_text,link_url,desktop_storage_key,mobile_storage_key,alt_text,targeting_json,starts_at,ends_at,is_active,sort_order,desktop_position_x,desktop_position_y,desktop_scale,mobile_position_x,mobile_position_y,mobile_scale) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(bannerId, ...values)
      .run();
  else
    await env.DB.prepare(
      `UPDATE banners SET name=?,eyebrow=?,title=?,message=?,button_text=?,link_url=?,desktop_storage_key=?,mobile_storage_key=?,alt_text=?,targeting_json=?,starts_at=?,ends_at=?,is_active=?,sort_order=?,desktop_position_x=?,desktop_position_y=?,desktop_scale=?,mobile_position_x=?,mobile_position_y=?,mobile_scale=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
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

async function adminHeaderSpotlights(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const { results } = await env.DB.prepare(
    `SELECT id,name,storage_key storageKey,link_url linkUrl,alt_text altText,spotlight_position_x imagePositionX,spotlight_position_y imagePositionY,spotlight_scale imageScale,starts_at startsAt,ends_at endsAt,is_active isActive,sort_order sortOrder,updated_at updatedAt FROM header_spotlights ORDER BY sort_order,created_at`,
  ).all();
  return ok(req, env, results || [], id);
}

function headerSpotlightValues(body) {
  return [
    String(body.name || "").trim().slice(0, 140),
    validDestination(body.linkUrl),
    String(body.altText || "").slice(0, 250),
    optionalDate(body.startsAt),
    optionalDate(body.endsAt),
    body.isActive === false ? 0 : 1,
    clamp(body.sortOrder, -10000, 10000, 0),
    clamp(body.imagePositionX, 0, 100, 50),
    clamp(body.imagePositionY, 0, 100, 50),
    clamp(body.imageScale, 10, 400, 100),
  ];
}

function validateHeaderSpotlight(body) {
  const values = headerSpotlightValues(body);
  if (!values[0]) return "Informe um nome para o destaque";
  if (!values[1]) return "Informe um destino válido";
  if (values[3] && values[4] && Date.parse(values[4]) <= Date.parse(values[3]))
    return "O término deve ser posterior ao início";
  return null;
}

async function createHeaderSpotlight(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 12000);
  const validation = validateHeaderSpotlight(body);
  if (validation) return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const spotlightId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO header_spotlights(id,name,link_url,alt_text,starts_at,ends_at,is_active,sort_order,spotlight_position_x,spotlight_position_y,spotlight_scale) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(spotlightId, ...headerSpotlightValues(body)).run();
  return ok(req, env, { id: spotlightId }, id);
}

async function updateHeaderSpotlight(req, env, spotlightId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 12000);
  const validation = validateHeaderSpotlight(body);
  if (validation) return fail(req, env, "VALIDATION_ERROR", validation, 422, id);
  const result = await env.DB.prepare(
    `UPDATE header_spotlights SET name=?,link_url=?,alt_text=?,starts_at=?,ends_at=?,is_active=?,sort_order=?,spotlight_position_x=?,spotlight_position_y=?,spotlight_scale=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(...headerSpotlightValues(body), spotlightId).run();
  if (!result.meta.changes)
    return fail(req, env, "HEADER_SPOTLIGHT_NOT_FOUND", "Destaque não encontrado", 404, id);
  return ok(req, env, { id: spotlightId }, id);
}

async function uploadHeaderSpotlightMedia(req, env, spotlightId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  if (!env.MEDIA)
    return fail(req, env, "R2_NOT_CONFIGURED", "O binding R2 MEDIA não foi configurado", 503, id);
  const current = await env.DB.prepare(
    `SELECT storage_key storageKey FROM header_spotlights WHERE id=?`,
  ).bind(spotlightId).first();
  if (!current)
    return fail(req, env, "HEADER_SPOTLIGHT_NOT_FOUND", "Destaque não encontrado", 404, id);
  const form = await req.formData();
  let storageKey;
  try {
    storageKey = await storeSiteImage(
      env,
      form.get("file"),
      "header-spotlights",
      spotlightId,
    );
  } catch (error) {
    return fail(req, env, "INVALID_FILE", error.message, 422, id);
  }
  await env.DB.prepare(
    `UPDATE header_spotlights SET storage_key=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(storageKey, spotlightId).run();
  if (current?.storageKey) await env.MEDIA.delete(current.storageKey);
  return ok(req, env, { storageKey }, id);
}

async function deleteHeaderSpotlight(req, env, spotlightId, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const spotlight = await env.DB.prepare(
    `SELECT storage_key storageKey FROM header_spotlights WHERE id=?`,
  ).bind(spotlightId).first();
  if (!spotlight)
    return fail(req, env, "HEADER_SPOTLIGHT_NOT_FOUND", "Destaque não encontrado", 404, id);
  await env.DB.prepare(`DELETE FROM header_spotlights WHERE id=?`).bind(spotlightId).run();
  if (spotlight.storageKey && env.MEDIA) await env.MEDIA.delete(spotlight.storageKey);
  return ok(req, env, { deleted: true }, id);
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
    const mediaKeys = [
      theme?.logoStorageKey,
      theme?.logoHoverStorageKey,
    ].filter(Boolean);
    if (mediaKeys.length) await env.MEDIA.delete(mediaKeys);
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

function referralCookie(req) {
  return String(req.headers.get("x-shoplab-ref") || cookie(req, "shoplab_ref"))
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 100);
}

async function attributedShareRedirect(req, env, token) {
  const link = await env.DB.prepare(
    `SELECT sl.id,sl.product_slug productSlug,p.status FROM share_links sl JOIN products p ON p.slug=sl.product_slug WHERE sl.token=?`,
  ).bind(String(token).slice(0,100)).first();
  if (!link || link.status !== "published") return new Response("Link inválido", { status: 404 });
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const agent = req.headers.get("user-agent") || "unknown";
  const visitorHash = await sha256(`${env.REFERRAL_HASH_SECRET || "shoplab"}|${ip}|${agent}`);
  const visitId = crypto.randomUUID();
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO share_visits(id,share_link_id,visitor_hash) VALUES(?,?,?)`,
  ).bind(visitId,link.id,visitorHash).run();
  const attributedVisit = inserted.meta.changes
    ? { id: visitId }
    : await env.DB.prepare(
        `SELECT id FROM share_visits WHERE share_link_id=? AND visitor_hash=?`,
      ).bind(link.id, visitorHash).first();
  await env.DB.prepare(
    `UPDATE share_links SET click_count=click_count+1,unique_click_count=unique_click_count+?,last_clicked_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(inserted.meta.changes ? 1 : 0,link.id).run();
  const siteOrigin=String(env.PUBLIC_SITE_URL||allowedOrigins(env)[0]||"").replace(/\/+$/,"");
  const attributionId = attributedVisit?.id || visitId;
  const response=new Response(null,{status:302,headers:{location:`${siteOrigin}/produto?slug=${encodeURIComponent(link.productSlug)}&ref=${encodeURIComponent(attributionId)}`,"cache-control":"no-store"}});
  response.headers.append("set-cookie",`shoplab_ref=${attributionId}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000`);
  return response;
}

async function claimReferral(req, env, userId) {
  const visitId=referralCookie(req);
  if(!visitId)return;
  const visit=await env.DB.prepare(`SELECT sv.id,sv.share_link_id shareLinkId,sv.converted_user_id convertedUserId,sl.user_id referrerUserId FROM share_visits sv JOIN share_links sl ON sl.id=sv.share_link_id WHERE sv.id=?`).bind(visitId).first();
  if(!visit||visit.convertedUserId||visit.referrerUserId===userId)return;
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO referrals(id,referrer_user_id,referred_user_id,share_link_id) VALUES(?,?,?,?)`).bind(crypto.randomUUID(),visit.referrerUserId,userId,visit.shareLinkId),
    env.DB.prepare(`UPDATE share_visits SET converted_user_id=? WHERE id=? AND converted_user_id IS NULL`).bind(userId,visit.id),
  ]);
}

async function qualifyReferrals(env,userId){
  const profile=await env.DB.prepare(`SELECT created_at createdAt FROM user_profiles WHERE user_id=?`).bind(userId).first();
  const activity=await env.DB.prepare(`SELECT COALESCE(SUM(active_seconds),0) seconds FROM user_sessions WHERE user_id=?`).bind(userId).first();
  if(!profile||Date.now()-Date.parse(profile.createdAt)<86400000||Number(activity?.seconds||0)<600)return;
  const referral=await env.DB.prepare(`SELECT id,referrer_user_id referrerId FROM referrals WHERE referred_user_id=? AND status='pending'`).bind(userId).first();
  if(!referral)return;
  await env.DB.prepare(`UPDATE referrals SET status='qualified',qualified_at=CURRENT_TIMESTAMP WHERE id=?`).bind(referral.id).run();
  const count=await env.DB.prepare(`SELECT COUNT(*) total FROM referrals WHERE referrer_user_id=? AND status='qualified'`).bind(referral.referrerId).first();
  const statements=[5,10].filter(milestone=>Number(count?.total||0)>=milestone).map(milestone=>env.DB.prepare(`INSERT OR IGNORE INTO referral_rewards(id,user_id,milestone) VALUES(?,?,?)`).bind(crypto.randomUUID(),referral.referrerId,milestone));
  if(statements.length)await env.DB.batch(statements);
}

async function recordUserPresence(req,env,id){
  const user=await activeUser(req,env);
  if(!user)return fail(req,env,"UNAUTHORIZED","Entre na sua conta",401,id);
  const body=await readJson(req,4096),sessionId=String(body.sessionId||"");
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(sessionId))return fail(req,env,"VALIDATION_ERROR","Sessão inválida",422,id);
  const current=await env.DB.prepare(`SELECT last_seen_at lastSeenAt FROM user_sessions WHERE id=? AND user_id=?`).bind(sessionId,user.id).first();
  const delta=current?Math.max(0,Math.min(90,Math.round((Date.now()-Date.parse(current.lastSeenAt))/1000))):0;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO user_sessions(id,user_id) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET last_seen_at=CURRENT_TIMESTAMP,active_seconds=active_seconds+? WHERE user_id=?`).bind(sessionId,user.id,delta,user.id),
    env.DB.prepare(`UPDATE user_profiles SET last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(user.id),
  ]);
  await qualifyReferrals(env,user.id);
  return ok(req,env,{active:true,nextHeartbeatSeconds:30},id);
}

async function createUserShareLink(req,env,id){
  const user=await activeUser(req,env);if(!user)return fail(req,env,"UNAUTHORIZED","Entre na sua conta",401,id);
  const body=await readJson(req,4096),slug=String(body.slug||"");
  if(!/^[a-z0-9-]{2,160}$/.test(slug))return fail(req,env,"VALIDATION_ERROR","Produto inválido",422,id);
  const product=await env.DB.prepare(`SELECT slug FROM products WHERE slug=? AND status='published'`).bind(slug).first();
  if(!product)return fail(req,env,"PRODUCT_NOT_FOUND","Produto não encontrado",404,id);
  let link=await env.DB.prepare(`SELECT id,token FROM share_links WHERE user_id=? AND product_slug=?`).bind(user.id,slug).first();
  if(!link){link={id:crypto.randomUUID(),token:bytesToHex(crypto.getRandomValues(new Uint8Array(18)))};await env.DB.prepare(`INSERT INTO share_links(id,user_id,product_slug,token) VALUES(?,?,?,?)`).bind(link.id,user.id,slug,link.token).run()}
  const referralOrigin=String(env.REFERRAL_PUBLIC_ORIGIN||REFERRAL_PUBLIC_ORIGIN).replace(/\/+$/,"");
  return ok(req,env,{url:`${referralOrigin}/s/${link.token}`},id);
}

async function userReferrals(req,env,id){
  const user=await activeUser(req,env);if(!user)return fail(req,env,"UNAUTHORIZED","Entre na sua conta",401,id);
  const [counts,rewards]=await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) total,SUM(status='qualified') qualified,SUM(status='pending') pending FROM referrals WHERE referrer_user_id=?`).bind(user.id),
    env.DB.prepare(`SELECT rr.id,rr.milestone,rr.status,rr.created_at createdAt,rgc.id giftCardId,rgc.value_cents giftCardValueCents,rgc.currency giftCardCurrency,rgc.code_encrypted giftCardCodeEncrypted,rgc.pin_encrypted giftCardPinEncrypted,rgc.expires_at giftCardExpiresAt,rgc.instructions giftCardInstructions,rgc.delivered_at giftCardDeliveredAt,gct.name giftCardType,gct.logo_storage_key giftCardLogoStorageKey FROM referral_rewards rr LEFT JOIN reward_gift_cards rgc ON rgc.reward_id=rr.id LEFT JOIN gift_card_types gct ON gct.id=rgc.gift_card_type_id WHERE rr.user_id=? ORDER BY rr.milestone`).bind(user.id),
  ]);
  const value=counts.results?.[0]||{};
  const origin=new URL(req.url).origin,items=[];
  for(const reward of rewards.results||[]){
    let giftCard=null;
    if(reward.giftCardId){
      try{giftCard={type:reward.giftCardType,valueCents:Number(reward.giftCardValueCents||0),currency:reward.giftCardCurrency,code:await decryptGiftCardSecret(env,reward.giftCardCodeEncrypted),pin:reward.giftCardPinEncrypted?await decryptGiftCardSecret(env,reward.giftCardPinEncrypted):null,expiresAt:reward.giftCardExpiresAt,instructions:reward.giftCardInstructions,deliveredAt:reward.giftCardDeliveredAt,logoUrl:reward.giftCardLogoStorageKey?`${origin}/media/${encodeURIComponent(reward.giftCardLogoStorageKey)}`:null}}catch(error){console.warn(JSON.stringify({event:"gift_card_decryption_failed",rewardId:reward.id,error:String(error?.message||error)}))}
    }
    items.push({id:reward.id,milestone:reward.milestone,status:giftCard&&reward.status==="approved"?"delivered":reward.status,createdAt:reward.createdAt,giftCard});
  }
  const response=ok(req,env,{total:Number(value.total||0),qualified:Number(value.qualified||0),pending:Number(value.pending||0),nextMilestone:Number(value.qualified||0)<5?5:Number(value.qualified||0)<10?10:null,rewards:items,rules:"A indicação é qualificada após 24 horas e 10 minutos de uso ativo. Recompensas passam por revisão."},id);
  response.headers.set("cache-control","private, no-store, max-age=0");
  return response;
}

async function authenticatedUser(req) {
  const authorization = req.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      authorization,
    },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user?.id && user?.email ? user : null;
}
async function userProfile(req, env, id) {
  const user = await authenticatedUser(req);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const suggestedName = String(user.user_metadata?.display_name || "").trim().slice(0, 80);
  await env.DB.prepare(`INSERT INTO user_profiles(user_id,email,display_name,last_seen_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,updated_at=CURRENT_TIMESTAMP`)
    .bind(user.id, user.email, suggestedName).run();
  await claimReferral(req,env,user.id);
  const profile = await env.DB.prepare(`SELECT user_id userId,email,display_name displayName,status,created_at createdAt FROM user_profiles WHERE user_id=?`).bind(user.id).first();
  return ok(req, env, profile, id);
}
async function updateUserProfile(req, env, id) {
  const user = await authenticatedUser(req);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const body = await readJson(req, 4096), displayName = String(body.displayName || "").trim().slice(0, 80);
  await env.DB.prepare(`INSERT INTO user_profiles(user_id,email,display_name,last_seen_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,updated_at=CURRENT_TIMESTAMP`)
    .bind(user.id, user.email, displayName).run();
  return ok(req, env, { userId: user.id, email: user.email, displayName }, id);
}
async function activeUser(req, env) {
  const user = await authenticatedUser(req);
  if (!user) return null;
  const profile = await env.DB.prepare("SELECT status,blocked_until blockedUntil FROM user_profiles WHERE user_id=?").bind(user.id).first();
  if(profile?.status==="blocked")return null;
  if(profile?.blockedUntil&&Date.parse(profile.blockedUntil)>Date.now())return null;
  return user;
}

function premiumPlan(env) {
  const regularMonthlyAmountCents = clamp(env.PREMIUM_MONTHLY_PRICE_CENTS, 300, 10000000, 300);
  const regularPassAmountCents = clamp(env.PREMIUM_PASS_PRICE_CENTS, 300, 10000000, regularMonthlyAmountCents);
  const promotionEndsAt = optionalDate(env.PREMIUM_PROMO_ENDS_AT);
  const promotionInPeriod = !promotionEndsAt || Date.parse(promotionEndsAt) > Date.now();
  const promotionalMonthly = clamp(env.PREMIUM_PROMO_MONTHLY_PRICE_CENTS, 300, regularMonthlyAmountCents, regularMonthlyAmountCents);
  const promotionalPass = clamp(env.PREMIUM_PROMO_PASS_PRICE_CENTS, 300, regularPassAmountCents, regularPassAmountCents);
  const promotionActive = promotionInPeriod && (promotionalMonthly < regularMonthlyAmountCents || promotionalPass < regularPassAmountCents);
  return {
    name: String(env.PREMIUM_PLAN_NAME || "SHOPLAB Premium").slice(0, 100),
    amountCents: promotionActive ? promotionalMonthly : regularMonthlyAmountCents,
    regularAmountCents: regularMonthlyAmountCents,
    passAmountCents: promotionActive ? promotionalPass : regularPassAmountCents,
    regularPassAmountCents,
    passDays: clamp(env.PREMIUM_PASS_DAYS, 1, 3650, 30),
    currency: "BRL",
    interval: "month",
    aiMonthlyLimit: clamp(env.PREMIUM_AI_MONTHLY_LIMIT, 1, 100000, 50),
    promotion: promotionActive ? {
      label: String(env.PREMIUM_PROMO_LABEL || "Oferta por tempo limitado").slice(0, 100),
      endsAt: promotionEndsAt,
    } : null,
  };
}

async function resolvedPremiumPlan(env) {
  const fallback = premiumPlan(env);
  const row = await env.DB.prepare(
    `SELECT plan_name planName,monthly_price_cents monthlyPriceCents,pass_price_cents passPriceCents,
      pass_days passDays,ai_monthly_limit aiMonthlyLimit,promotion_enabled promotionEnabled,
      promotion_label promotionLabel,promotion_monthly_price_cents promotionMonthlyPriceCents,
      promotion_pass_price_cents promotionPassPriceCents,promotion_starts_at promotionStartsAt,
      promotion_ends_at promotionEndsAt,updated_at updatedAt FROM premium_settings WHERE id='default'`,
  ).first();
  if (!row) return fallback;
  const regularAmountCents = clamp(row.monthlyPriceCents, 300, 10000000, fallback.regularAmountCents);
  const regularPassAmountCents = clamp(row.passPriceCents, 300, 10000000, fallback.regularPassAmountCents);
  const startsAt = optionalDate(row.promotionStartsAt);
  const endsAt = optionalDate(row.promotionEndsAt);
  const now = Date.now();
  const promotionInPeriod = Number(row.promotionEnabled) === 1 &&
    (!startsAt || Date.parse(startsAt) <= now) && (!endsAt || Date.parse(endsAt) > now);
  const promotionalMonthly = clamp(row.promotionMonthlyPriceCents, 300, regularAmountCents, regularAmountCents);
  const promotionalPass = clamp(row.promotionPassPriceCents, 300, regularPassAmountCents, regularPassAmountCents);
  const promotionActive = promotionInPeriod &&
    (promotionalMonthly < regularAmountCents || promotionalPass < regularPassAmountCents);
  return {
    name: String(row.planName || fallback.name).trim().slice(0, 100),
    amountCents: promotionActive ? promotionalMonthly : regularAmountCents,
    regularAmountCents,
    passAmountCents: promotionActive ? promotionalPass : regularPassAmountCents,
    regularPassAmountCents,
    passDays: clamp(row.passDays, 1, 3650, fallback.passDays),
    currency: "BRL",
    interval: "month",
    aiMonthlyLimit: clamp(row.aiMonthlyLimit, 1, 100000, fallback.aiMonthlyLimit),
    promotion: promotionActive ? {
      label: String(row.promotionLabel || "Oferta por tempo limitado").trim().slice(0, 100),
      startsAt,
      endsAt,
    } : null,
    updatedAt: row.updatedAt,
  };
}

async function adminPremiumSettings(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const row = await env.DB.prepare(`SELECT * FROM premium_settings WHERE id='default'`).first();
  return ok(req, env, { settings: row, effectivePlan: await resolvedPremiumPlan(env) }, id);
}

async function updateAdminPremiumSettings(req, env, id) {
  if (!(await requireAdmin(req, env)))
    return fail(req, env, "UNAUTHORIZED", "Não autorizado", 401, id);
  const body = await readJson(req, 12000);
  const requiredNumbers = [
    [body.monthlyPriceCents, "Informe um valor mensal válido"],
    [body.passPriceCents, "Informe um valor válido para o acesso avulso"],
    [body.passDays, "Informe a duração válida do acesso avulso"],
    [body.aiMonthlyLimit, "Informe um limite mensal válido de análises"],
  ];
  const invalidRequired = requiredNumbers.find(
    ([value]) => !Number.isFinite(Number(value)) || Number(value) <= 0,
  );
  if (invalidRequired)
    return fail(req, env, "VALIDATION_ERROR", invalidRequired[1], 422, id);
  const monthly = clamp(body.monthlyPriceCents, 300, 10000000, 990);
  const pass = clamp(body.passPriceCents, 300, 10000000, monthly);
  if (Number(body.monthlyPriceCents) < 300 || Number(body.passPriceCents) < 300)
    return fail(req, env, "VALIDATION_ERROR", "O preço mínimo é R$ 3,00", 422, id);
  for (const value of [body.promotionMonthlyPriceCents, body.promotionPassPriceCents])
    if (value != null && (!Number.isFinite(Number(value)) || Number(value) < 300))
      return fail(req, env, "VALIDATION_ERROR", "O preço promocional mínimo é R$ 3,00", 422, id);
  const promoMonthly = body.promotionMonthlyPriceCents == null ? null : clamp(body.promotionMonthlyPriceCents, 300, monthly, monthly);
  const promoPass = body.promotionPassPriceCents == null ? null : clamp(body.promotionPassPriceCents, 300, pass, pass);
  const startsAt = optionalDate(body.promotionStartsAt);
  const endsAt = optionalDate(body.promotionEndsAt);
  if (body.promotionEnabled && promoMonthly == null && promoPass == null)
    return fail(req, env, "VALIDATION_ERROR", "Informe pelo menos um preço promocional", 422, id);
  if (body.promotionEnabled &&
      (promoMonthly == null || promoMonthly >= monthly) &&
      (promoPass == null || promoPass >= pass))
    return fail(req, env, "VALIDATION_ERROR", "A promoção precisa reduzir pelo menos um dos preços", 422, id);
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt))
    return fail(req, env, "VALIDATION_ERROR", "O fim da promoção deve ser posterior ao início", 422, id);
  await env.DB.prepare(
    `INSERT INTO premium_settings(id,plan_name,monthly_price_cents,pass_price_cents,pass_days,ai_monthly_limit,
      promotion_enabled,promotion_label,promotion_monthly_price_cents,promotion_pass_price_cents,
      promotion_starts_at,promotion_ends_at,updated_at) VALUES('default',?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET plan_name=excluded.plan_name,monthly_price_cents=excluded.monthly_price_cents,
      pass_price_cents=excluded.pass_price_cents,pass_days=excluded.pass_days,ai_monthly_limit=excluded.ai_monthly_limit,
      promotion_enabled=excluded.promotion_enabled,promotion_label=excluded.promotion_label,
      promotion_monthly_price_cents=excluded.promotion_monthly_price_cents,
      promotion_pass_price_cents=excluded.promotion_pass_price_cents,promotion_starts_at=excluded.promotion_starts_at,
      promotion_ends_at=excluded.promotion_ends_at,updated_at=CURRENT_TIMESTAMP`,
  ).bind(
    String(body.planName || "SHOPLAB Premium").trim().slice(0, 100), monthly, pass,
    clamp(body.passDays, 1, 3650, 30), clamp(body.aiMonthlyLimit, 1, 100000, 50),
    body.promotionEnabled ? 1 : 0, String(body.promotionLabel || "Oferta por tempo limitado").trim().slice(0, 100),
    promoMonthly, promoPass, startsAt, endsAt,
  ).run();
  return ok(req, env, { saved: true, effectivePlan: await resolvedPremiumPlan(env) }, id);
}

function premiumPeriodKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function stripeConfigured(env) {
  return /^sk_(?:test|live)_/i.test(String(env.STRIPE_SECRET_KEY || ""));
}

async function stripeApi(env, path, { method = "GET", params = null, idempotencyKey = "" } = {}) {
  const secret = String(env.STRIPE_SECRET_KEY || "");
  if (!stripeConfigured(env)) throw new Error("STRIPE_SECRET_KEY_NOT_CONFIGURED");
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${secret}`,
      ...(params ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: params ? new URLSearchParams(params) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`STRIPE_${response.status}:${String(result?.error?.message || "request_failed").slice(0, 500)}`);
    error.status = response.status;
    error.provider = result;
    error.providerRequestId = response.headers.get("request-id") || null;
    throw error;
  }
  return result;
}

function stripeDate(value) {
  const seconds = Number(value || 0);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function normalizedStripeSubscriptionStatus(value) {
  const status = String(value || "").toLowerCase();
  if (["active", "trialing"].includes(status)) return "authorized";
  if (["past_due", "unpaid", "paused"].includes(status)) return "paused";
  if (["canceled", "cancelled", "incomplete_expired"].includes(status)) return "cancelled";
  return "pending";
}

function stripeSubscriptionAmount(subscription) {
  const item = subscription?.items?.data?.[0];
  return Math.round(Number(item?.price?.unit_amount || 0));
}

async function updateStripeSubscriptionRecord(env, subscription, fallbackUserId = "") {
  const providerId = String(subscription?.id || "").slice(0, 200);
  const userId = String(subscription?.metadata?.shoplab_user_id || fallbackUserId || "").slice(0, 100);
  if (!/^sub_/.test(providerId) || !userId) throw new Error("STRIPE_SUBSCRIPTION_REFERENCE_INVALID");
  const existing = await env.DB.prepare(
    `SELECT id,status,amount_cents amountCents,payer_email payerEmail FROM premium_subscriptions WHERE user_id=?`,
  ).bind(userId).first();
  const profile = existing?.payerEmail ? null : await env.DB.prepare(
    `SELECT email FROM user_profiles WHERE user_id=?`,
  ).bind(userId).first();
  const status = normalizedStripeSubscriptionStatus(subscription.status);
  const plan = await resolvedPremiumPlan(env);
  const amountCents = stripeSubscriptionAmount(subscription) || Number(existing?.amountCents || plan.amountCents);
  const currency = String(subscription?.currency || subscription?.items?.data?.[0]?.price?.currency || "brl").toUpperCase().slice(0, 8);
  const nextPaymentAt = stripeDate(subscription.current_period_end);
  await env.DB.prepare(
    `INSERT INTO premium_subscriptions(id,user_id,provider,provider_subscription_id,status,payer_email,amount_cents,currency,checkout_url,next_payment_at,provider_updated_at)
     VALUES(?,?,'stripe',?,?,?,?,?,NULL,?,?)
     ON CONFLICT(user_id) DO UPDATE SET provider='stripe',provider_subscription_id=excluded.provider_subscription_id,
       status=excluded.status,payer_email=excluded.payer_email,amount_cents=excluded.amount_cents,currency=excluded.currency,
       checkout_url=NULL,next_payment_at=excluded.next_payment_at,provider_updated_at=excluded.provider_updated_at,
       updated_at=CURRENT_TIMESTAMP`,
  ).bind(
    existing?.id || crypto.randomUUID(), userId, providerId, status,
    String(existing?.payerEmail || profile?.email || "").slice(0, 320), amountCents, currency,
    nextPaymentAt, new Date().toISOString(),
  ).run();
  if (status === "authorized" && existing?.status !== "authorized")
    await sendPremiumNotification(env, { eventKey: `stripe-subscription-activated:${providerId}`, userId, kind: "subscription_activated", amountCents });
  if (status === "cancelled" && existing?.status !== "cancelled")
    await sendPremiumNotification(env, { eventKey: `stripe-subscription-cancelled:${providerId}`, userId, kind: "subscription_cancelled", amountCents });
  return { userId, status, amountCents, nextPaymentAt };
}

async function applyStripePassSession(env, session, forcedStatus = "") {
  const purchaseId = String(session?.metadata?.purchase_id || "").slice(0, 100);
  if (!purchaseId) return null;
  const purchase = await env.DB.prepare(
    `SELECT id,user_id userId,status,amount_cents amountCents,currency FROM premium_pass_payments WHERE id=?`,
  ).bind(purchaseId).first();
  if (!purchase || String(session?.metadata?.shoplab_user_id || session?.client_reference_id || "") !== purchase.userId)
    throw new Error("STRIPE_PASS_REFERENCE_MISMATCH");
  const amountCents = Number(session.amount_total || 0);
  const currency = String(session.currency || "").toUpperCase();
  if (amountCents !== Number(purchase.amountCents) || currency !== purchase.currency)
    throw new Error("STRIPE_PASS_AMOUNT_MISMATCH");
  const approved = forcedStatus === "approved" || session.payment_status === "paid";
  const rejected = forcedStatus === "rejected";
  const cancelled = forcedStatus === "cancelled" || session.status === "expired";
  const status = approved ? "approved" : rejected ? "rejected" : cancelled ? "cancelled" : "pending";
  const paidAt = approved ? new Date().toISOString() : null;
  const plan = await resolvedPremiumPlan(env);
  const accessExpiresAt = paidAt
    ? new Date(Date.parse(paidAt) + plan.passDays * 86400000).toISOString()
    : null;
  await env.DB.prepare(
    `UPDATE premium_pass_payments SET provider_preference_id=?,provider_payment_id=?,status=?,
       paid_at=CASE WHEN ?='approved' THEN COALESCE(paid_at,?) ELSE paid_at END,
       access_expires_at=CASE WHEN ?='approved' THEN COALESCE(access_expires_at,?) ELSE access_expires_at END,
       provider_updated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(
    String(session.id || "").slice(0, 200), String(session.payment_intent || "").slice(0, 200) || null,
    status, status, paidAt, status, accessExpiresAt, purchase.id,
  ).run();
  if (approved && purchase.status !== "approved") await sendPremiumNotification(env, {
    eventKey: `stripe-pass-approved:${session.id}`,
    userId: purchase.userId,
    kind: "pass_approved",
    amountCents: purchase.amountCents,
    accessExpiresAt,
  });
  if (rejected && !["rejected", "approved"].includes(purchase.status)) await sendPremiumNotification(env, {
    eventKey: `stripe-pass-rejected:${session.id}`,
    userId: purchase.userId,
    kind: "pass_rejected",
    amountCents: purchase.amountCents,
  });
  return { userId: purchase.userId, status, accessExpiresAt };
}

async function reconcileStripeCheckoutSession(env, sessionId) {
  const id = String(sessionId || "").replace(/^checkout:/, "").slice(0, 200);
  if (!/^cs_/.test(id)) return null;
  const session = await stripeApi(env, `/v1/checkout/sessions/${encodeURIComponent(id)}`);
  if (session.mode === "payment") return applyStripePassSession(env, session);
  if (session.mode === "subscription" && session.subscription) {
    const subscription = await stripeApi(env, `/v1/subscriptions/${encodeURIComponent(session.subscription)}`);
    return updateStripeSubscriptionRecord(env, subscription, session.client_reference_id);
  }
  return null;
}

async function stripeWebhookSignature(req, rawBody, secret) {
  const parts = String(req.headers.get("stripe-signature") || "").split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2) || "";
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3).toLowerCase());
  if (!/^\d+$/.test(timestamp) || !signatures.length || !secret) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${rawBody}`));
  const expected = bytesToHex(new Uint8Array(digest));
  for (const signature of signatures) if (await safeEqual(expected, signature)) return true;
  return false;
}

async function stripeWebhook(req, env) {
  const rawBody = await req.text();
  const valid = await stripeWebhookSignature(req, rawBody, String(env.STRIPE_WEBHOOK_SECRET || ""));
  if (!valid) return new Response(null, { status: 401 });
  let event;
  try { event = JSON.parse(rawBody); }
  catch { return new Response(null, { status: 400 }); }
  try {
    const object = event?.data?.object || {};
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"].includes(event.type)) {
      if (object.mode === "payment") await applyStripePassSession(
        env,
        object,
        event.type === "checkout.session.async_payment_succeeded"
          ? "approved"
          : event.type === "checkout.session.async_payment_failed"
            ? "rejected"
            : event.type === "checkout.session.expired"
              ? "cancelled"
              : "",
      );
      if (object.mode === "subscription" && object.subscription) {
        const subscription = await stripeApi(env, `/v1/subscriptions/${encodeURIComponent(object.subscription)}`);
        await updateStripeSubscriptionRecord(env, subscription, object.client_reference_id);
      }
    }
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type))
      await updateStripeSubscriptionRecord(env, object);
    if (["invoice.payment_succeeded", "invoice.payment_failed"].includes(event.type)) {
      const providerSubscriptionId = String(object.subscription || object.parent?.subscription_details?.subscription || "");
      const subscription = providerSubscriptionId ? await env.DB.prepare(
        `SELECT user_id userId,amount_cents amountCents FROM premium_subscriptions WHERE provider_subscription_id=?`,
      ).bind(providerSubscriptionId).first() : null;
      if (subscription) await sendPremiumNotification(env, {
        eventKey: `stripe-${event.type}:${object.id}`,
        userId: subscription.userId,
        kind: event.type === "invoice.payment_succeeded" ? "subscription_payment_approved" : "subscription_payment_rejected",
        amountCents: Number(object.amount_paid || object.amount_due || subscription.amountCents),
      });
    }
  } catch (error) {
    console.error(JSON.stringify({ event: "stripe_webhook_processing_failed", stripeEventId: event?.id, stripeEventType: event?.type, error: String(error?.message || error) }));
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 200 });
}

async function mercadoPagoRequest(accessToken, path, options = {}) {
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN_NOT_CONFIGURED");
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`MERCADOPAGO_${response.status}:${String(result.message || result.error || "request_failed").slice(0, 300)}`);
    error.status = response.status;
    error.provider = result;
    error.providerRequestId = response.headers.get("x-request-id") || null;
    throw error;
  }
  return result;
}

async function mercadoPagoApi(env, path, options = {}) {
  const accessToken = String(
    env.MERCADOPAGO_SUBSCRIPTION_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN || "",
  );
  return mercadoPagoRequest(accessToken, path, options);
}

async function mercadoPagoOrdersApi(env, path, options = {}) {
  const accessToken = String(
    env.MERCADOPAGO_CHECKOUT_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN || "",
  );
  return mercadoPagoRequest(accessToken, path, options);
}

async function mercadoPagoCheckoutApi(env, path, options = {}) {
  const accessToken = String(
    env.MERCADOPAGO_CHECKOUT_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN || "",
  );
  return mercadoPagoRequest(accessToken, path, options);
}

function mercadoPagoCheckoutSandbox(env) {
  return /^(?:1|true|yes|sim)$/i.test(String(env.MERCADOPAGO_CHECKOUT_SANDBOX || "")) ||
    String(env.MERCADOPAGO_CHECKOUT_PUBLIC_KEY || env.MERCADOPAGO_PUBLIC_KEY || "").startsWith("TEST-");
}

function normalizedMercadoPagoSubscriptionStatus(value) {
  const status = String(value || "").toLowerCase();
  if (status === "authorized") return "authorized";
  if (status === "paused") return "paused";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  return "pending";
}

function premiumEmailContent(kind, context = {}) {
  const planName = String(context.planName || "SHOPLAB Premium");
  const amount = Number(context.amountCents || 0)
    ? (Number(context.amountCents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
  const expiry = context.accessExpiresAt
    ? new Date(context.accessExpiresAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "";
  const values = {
    subscription_activated: ["Sua assinatura SHOPLAB Premium está ativa", `Sua assinatura ${planName}${amount ? ` de ${amount} por mês` : ""} foi ativada. Você já pode usar as comparações inteligentes.`],
    subscription_cancelled: ["Sua assinatura SHOPLAB Premium foi cancelada", `A renovação automática da sua assinatura ${planName} foi cancelada. Nenhuma nova mensalidade será criada por esta assinatura.`],
    subscription_payment_approved: ["Pagamento da assinatura confirmado", `Recebemos o pagamento${amount ? ` de ${amount}` : ""} da sua assinatura ${planName}. Seu acesso Premium continua ativo.`],
    subscription_payment_rejected: ["Não foi possível renovar sua assinatura", `O pagamento da assinatura ${planName} não foi aprovado. Atualize a forma de pagamento para evitar a interrupção do acesso.`],
    pass_approved: ["Pagamento confirmado: seu Premium está ativo", `Seu pagamento avulso${amount ? ` de ${amount}` : ""} foi confirmado. O acesso ${planName}${expiry ? ` é válido até ${expiry}` : " está ativo"}.`],
    pass_rejected: ["O pagamento avulso não foi aprovado", `O pagamento do passe ${planName} não foi aprovado. Você pode tentar novamente com outra forma de pagamento.`],
    pass_refunded: ["Pagamento do passe Premium estornado", `O pagamento do passe ${planName} foi estornado e o acesso relacionado a ele foi encerrado.`],
    pass_expiring: ["Seu SHOPLAB Premium expira em breve", `Seu passe ${planName}${expiry ? ` é válido até ${expiry}` : " está perto de vencer"}. Renove pela sua conta caso queira continuar usando as comparações inteligentes.`],
  };
  const [subject, message] = values[kind] || ["Atualização do SHOPLAB Premium", "Há uma atualização no seu acesso SHOPLAB Premium."];
  return { subject, message };
}

async function sendPremiumNotification(env, { eventKey, userId, kind, amountCents = 0, accessExpiresAt = null }) {
  const key = String(eventKey || "").replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 240);
  if (!key || !userId) return;
  const profile = await env.DB.prepare(
    `SELECT email,display_name displayName FROM user_profiles WHERE user_id=?`,
  ).bind(userId).first();
  if (!profile?.email) return;
  const reserved = await env.DB.prepare(
    `INSERT OR IGNORE INTO premium_notification_log(event_key,user_id,kind,recipient,status) VALUES(?,?,?,?,'skipped')`,
  ).bind(key, userId, kind, profile.email).run();
  if (!reserved.meta.changes) return;
  const apiKey = String(env.RESEND_API_KEY || "");
  const from = String(env.PREMIUM_EMAIL_FROM || env.REWARD_EMAIL_FROM || "");
  if (!apiKey || !from) {
    await env.DB.prepare(`UPDATE premium_notification_log SET error='RESEND_NOT_CONFIGURED' WHERE event_key=?`).bind(key).run();
    return;
  }
  const plan = await resolvedPremiumPlan(env);
  const content = premiumEmailContent(kind, { planName: plan.name, amountCents, accessExpiresAt });
  const accountUrl = `${String(env.PUBLIC_SITE_URL || allowedOrigins(env)[0] || "").replace(/\/+$/, "")}/conta.html#premium`;
  const safeName = htmlAttribute(profile.displayName || "cliente");
  const safeMessage = htmlAttribute(content.message);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "user-agent": "SHOPLAB-Worker/1.0",
        "idempotency-key": `premium-${key}`.slice(0, 256),
      },
      body: JSON.stringify({
        from,
        to: [profile.email],
        subject: content.subject,
        html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlAttribute(content.subject)}</title></head><body style="margin:0;background:#eff7f5;font-family:Arial,sans-serif;color:#173b34"><div style="max-width:600px;margin:0 auto;padding:32px 18px"><div style="padding:32px;border-radius:18px;background:#fff"><p style="margin:0 0 8px;color:#087c70;font-weight:800">SHOPLAB PREMIUM</p><h1 style="font-size:26px">${htmlAttribute(content.subject)}</h1><p>Olá, ${safeName}.</p><p style="line-height:1.6">${safeMessage}</p><p style="margin-top:26px"><a href="${htmlAttribute(accountUrl)}" style="display:inline-block;padding:14px 20px;border-radius:9px;background:#087c70;color:#fff;text-decoration:none;font-weight:700">Ver meu Premium</a></p><p style="margin-top:28px;color:#667b76;font-size:12px">Mensagem automática de segurança da SHOPLAB.</p></div></div></body></html>`,
        text: `Olá, ${profile.displayName || "cliente"}. ${content.message} Acesse: ${accountUrl}`,
        tags: [{ name: "category", value: "premium" }],
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(result.message || result.name || `Resend ${response.status}`).slice(0, 500));
    await env.DB.prepare(
      `UPDATE premium_notification_log SET status='sent',provider_message_id=?,error=NULL WHERE event_key=?`,
    ).bind(String(result.id || "").slice(0, 200) || null, key).run();
  } catch (error) {
    await env.DB.prepare(
      `UPDATE premium_notification_log SET status='failed',error=? WHERE event_key=?`,
    ).bind(String(error?.message || error).slice(0, 500), key).run();
    console.error(JSON.stringify({ event: "premium_email_failed", eventKey: key, userId, error: String(error?.message || error) }));
  }
}

async function sendPremiumPassExpiryReminders(env) {
  const { results } = await env.DB.prepare(
    `SELECT id,user_id userId,amount_cents amountCents,access_expires_at accessExpiresAt
     FROM premium_pass_payments WHERE status='approved'
       AND datetime(access_expires_at)>CURRENT_TIMESTAMP
       AND datetime(access_expires_at)<=datetime('now','+3 days')
     ORDER BY datetime(access_expires_at) LIMIT 100`,
  ).all();
  for (const pass of results || []) await sendPremiumNotification(env, {
    eventKey: `pass-expiring:${pass.id}`,
    userId: pass.userId,
    kind: "pass_expiring",
    amountCents: pass.amountCents,
    accessExpiresAt: pass.accessExpiresAt,
  });
}

async function reconcileMercadoPagoSubscription(env, providerSubscriptionId, expectedUserId = null) {
  const providerId = String(providerSubscriptionId || "").slice(0, 200);
  if (!providerId) return null;
  const existing = await env.DB.prepare(
    `SELECT id,user_id userId,status FROM premium_subscriptions WHERE provider_subscription_id=?`,
  ).bind(providerId).first();
  if (!existing || (expectedUserId && existing.userId !== expectedUserId)) return null;
  const remote = await mercadoPagoApi(env, `/preapproval/${encodeURIComponent(providerId)}`);
  if (String(remote.external_reference || "") !== `shoplab:${existing.userId}`) {
    throw new Error("MERCADOPAGO_EXTERNAL_REFERENCE_MISMATCH");
  }
  const status = normalizedMercadoPagoSubscriptionStatus(remote.status);
  const amountCents = Math.round(Number(remote.auto_recurring?.transaction_amount || 0) * 100);
  await env.DB.prepare(
    `UPDATE premium_subscriptions SET status=?,payer_email=?,amount_cents=CASE WHEN ?>0 THEN ? ELSE amount_cents END,currency=?,checkout_url=COALESCE(?,checkout_url),next_payment_at=?,provider_updated_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(
    status,
    String(remote.payer_email || "").slice(0, 320),
    amountCents,
    amountCents,
    String(remote.auto_recurring?.currency_id || "BRL").slice(0, 8),
    remote.init_point || null,
    remote.next_payment_date || null,
    remote.last_modified || new Date().toISOString(),
    existing.id,
  ).run();
  if (status === "authorized" && existing.status !== "authorized")
    await sendPremiumNotification(env, { eventKey: `subscription-activated:${providerId}`, userId: existing.userId, kind: "subscription_activated", amountCents });
  if (status === "cancelled" && existing.status !== "cancelled")
    await sendPremiumNotification(env, { eventKey: `subscription-cancelled:${providerId}`, userId: existing.userId, kind: "subscription_cancelled", amountCents });
  return { ...remote, localStatus: status, userId: existing.userId };
}

async function premiumSubscriptionData(env, userId, { reconcilePending = false } = {}) {
  let subscription = await env.DB.prepare(
    `SELECT id,provider,status,provider_subscription_id providerSubscriptionId,payer_email payerEmail,amount_cents amountCents,currency,checkout_url checkoutUrl,next_payment_at nextPaymentAt,created_at createdAt,updated_at updatedAt FROM premium_subscriptions WHERE user_id=?`,
  ).bind(userId).first();
  if (reconcilePending && subscription?.status === "pending" && subscription.providerSubscriptionId) {
    try {
      if (subscription.provider === "stripe" && stripeConfigured(env)) {
        if (subscription.providerSubscriptionId.startsWith("checkout:"))
          await reconcileStripeCheckoutSession(env, subscription.providerSubscriptionId);
        else if (subscription.providerSubscriptionId.startsWith("sub_")) {
          const remote = await stripeApi(env, `/v1/subscriptions/${encodeURIComponent(subscription.providerSubscriptionId)}`);
          await updateStripeSubscriptionRecord(env, remote, userId);
        }
      } else if (subscription.provider === "mercadopago" && env.MERCADOPAGO_ACCESS_TOKEN) {
        await reconcileMercadoPagoSubscription(env, subscription.providerSubscriptionId, userId);
      }
      subscription = await env.DB.prepare(
        `SELECT id,provider,status,provider_subscription_id providerSubscriptionId,payer_email payerEmail,amount_cents amountCents,currency,checkout_url checkoutUrl,next_payment_at nextPaymentAt,created_at createdAt,updated_at updatedAt FROM premium_subscriptions WHERE user_id=?`,
      ).bind(userId).first();
    } catch (error) {
      console.warn(JSON.stringify({ event: "premium_subscription_reconcile_failed", userId, error: String(error?.message || error) }));
    }
  }
  const plan = await resolvedPremiumPlan(env);
  let activePass = await env.DB.prepare(
    `SELECT id,status,amount_cents amountCents,currency,paid_at paidAt,access_expires_at accessExpiresAt
     FROM premium_pass_payments WHERE user_id=? AND status='approved'
       AND datetime(access_expires_at)>CURRENT_TIMESTAMP
     ORDER BY datetime(access_expires_at) DESC LIMIT 1`,
  ).bind(userId).first();
  let pendingPass = activePass ? null : await env.DB.prepare(
    `SELECT id,status,provider_preference_id providerPreferenceId,provider_payment_id providerPaymentId,amount_cents amountCents,currency,checkout_url checkoutUrl,created_at createdAt
     FROM premium_pass_payments WHERE user_id=? AND status='pending'
     ORDER BY datetime(created_at) DESC LIMIT 1`,
  ).bind(userId).first();
  if (
    reconcilePending &&
    (pendingPass?.providerPreferenceId || pendingPass?.providerPaymentId)
  ) {
    try {
      if (pendingPass.providerPreferenceId?.startsWith("cs_") && stripeConfigured(env))
        await reconcileStripeCheckoutSession(env, pendingPass.providerPreferenceId);
      else if (pendingPass.providerPaymentId && (env.MERCADOPAGO_CHECKOUT_ACCESS_TOKEN || env.MERCADOPAGO_ACCESS_TOKEN))
        await reconcileMercadoPagoPassPayment(env, pendingPass.providerPaymentId);
      activePass = await env.DB.prepare(
        `SELECT id,status,amount_cents amountCents,currency,paid_at paidAt,access_expires_at accessExpiresAt
         FROM premium_pass_payments WHERE user_id=? AND status='approved'
           AND datetime(access_expires_at)>CURRENT_TIMESTAMP
         ORDER BY datetime(access_expires_at) DESC LIMIT 1`,
      ).bind(userId).first();
      if (activePass) pendingPass = null;
    } catch (error) {
      console.warn(JSON.stringify({ event: "premium_pass_reconcile_failed", userId, error: String(error?.message || error) }));
    }
  }
  const usage = await env.DB.prepare(
    `SELECT generations FROM premium_ai_usage WHERE user_id=? AND period_key=?`,
  ).bind(userId, premiumPeriodKey()).first();
  const used = Number(usage?.generations || 0);
  return {
    premium: subscription?.status === "authorized" || Boolean(activePass),
    status: subscription?.status === "authorized" ? "authorized" : activePass ? "pass_active" : subscription?.status || (pendingPass ? "pass_pending" : "free"),
    subscription: subscription || null,
    pass: activePass || null,
    pendingPass: pendingPass || null,
    plan,
    usage: { used, limit: plan.aiMonthlyLimit, remaining: Math.max(0, plan.aiMonthlyLimit - used), period: premiumPeriodKey() },
  };
}

async function userPremiumSubscription(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const data = await premiumSubscriptionData(env, user.id, { reconcilePending: true });
  const response = ok(req, env, data, id);
  response.headers.set("cache-control", "private, no-store, max-age=0");
  return response;
}

async function premiumPaymentConfig(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta para comprar o acesso", 401, id);
  if (!stripeConfigured(env))
    return fail(req, env, "PAYMENTS_NOT_CONFIGURED", "O Stripe ainda não foi configurado", 503, id);
  const subscription = await premiumSubscriptionData(env, user.id, { reconcilePending: true });
  const response = ok(req, env, {
    provider: "stripe",
    testMode: String(env.STRIPE_SECRET_KEY || "").startsWith("sk_test_"),
    plan: subscription.plan,
    premium: subscription.premium,
  }, id);
  response.headers.set("cache-control", "private, no-store, max-age=0");
  return response;
}

async function createPremiumPassPayment(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta para pagar", 401, id);
  if (!env.MERCADOPAGO_CHECKOUT_ACCESS_TOKEN && !env.MERCADOPAGO_ACCESS_TOKEN)
    return fail(req, env, "PAYMENTS_NOT_CONFIGURED", "O pagamento Premium ainda não foi configurado", 503, id);
  const current = await premiumSubscriptionData(env, user.id, { reconcilePending: true });
  if (current.premium) return ok(req, env, current, id);
  const body = await readJson(req, 30000);
  const paymentMethodId = String(body.payment_method_id || "").toLowerCase().slice(0, 60);
  if (!/^[a-z0-9_-]{2,60}$/.test(paymentMethodId))
    return fail(req, env, "VALIDATION_ERROR", "Selecione uma forma de pagamento válida", 422, id);
  const mercadoPagoTestMode = mercadoPagoCheckoutSandbox(env);
  if (mercadoPagoTestMode && paymentMethodId === "pix")
    return fail(
      req,
      env,
      "TEST_PAYMENT_METHOD_UNAVAILABLE",
      "O Pix não está disponível com estas credenciais de teste. Use um cartão de teste; o Pix será habilitado em produção.",
      422,
      id,
    );
  const token = String(body.token || "").slice(0, 500);
  if (paymentMethodId !== "pix" && !token)
    return fail(req, env, "VALIDATION_ERROR", "Os dados do cartão não foram tokenizados. Preencha novamente o cartão.", 422, id);
  const installments = clamp(body.installments, 1, 24, 1);
  const issuerId = Number(String(body.issuer_id || "").replace(/\D/g, ""));
  const payerEmail = String(body.payer?.email || user.email || "").trim().toLowerCase().slice(0, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail))
    return fail(req, env, "VALIDATION_ERROR", "Informe um e-mail válido para o pagamento", 422, id);
  const plan = await resolvedPremiumPlan(env);
  const purchaseId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO premium_pass_payments(id,user_id,status,payer_email,amount_cents,currency)
     VALUES(?,?,'pending',?,?,?)`,
  ).bind(purchaseId, user.id, user.email, plan.passAmountCents, plan.currency).run();
  const identificationType = String(body.payer?.identification?.type || "")
    .toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10);
  const identificationNumber = String(body.payer?.identification?.number || "")
    .replace(/\D/g, "").slice(0, 30);
  const paymentBody = {
    transaction_amount: plan.passAmountCents / 100,
    ...(token ? { token } : {}),
    description: `${plan.name} por ${plan.passDays} dias`.slice(0, 120),
    installments,
    payment_method_id: paymentMethodId,
    ...(Number.isSafeInteger(issuerId) && issuerId > 0
      ? { issuer_id: issuerId }
      : {}),
    external_reference: `shoplab-pass-${purchaseId}`,
    payer: {
      email: payerEmail,
      ...(identificationType && identificationNumber
        ? { identification: { type: identificationType, number: identificationNumber } }
        : {}),
    },
  };
  let payment;
  try {
    payment = await mercadoPagoCheckoutApi(env, "/v1/payments", {
      method: "POST",
      headers: { "x-idempotency-key": crypto.randomUUID() },
      body: JSON.stringify(paymentBody),
    });
  } catch (error) {
    await env.DB.prepare(
      `UPDATE premium_pass_payments SET status='rejected',provider_updated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    ).bind(purchaseId).run();
    console.error(JSON.stringify({
      event: "premium_pass_payment_failed",
      userId: user.id,
      purchaseId,
      paymentMethodId,
      error: String(error?.message || error),
      provider: error?.provider || null,
      providerRequestId: error?.providerRequestId || null,
    }));
    const providerDetail = String(
      error?.provider?.cause?.[0]?.description ||
      error?.provider?.errors?.[0]?.details?.[0] ||
      error?.provider?.errors?.[0]?.message ||
      error?.provider?.errors?.[0]?.code ||
      error?.provider?.message ||
      error?.provider?.error ||
      error?.message ||
      "",
    ).replace(/^MERCADOPAGO_\d+:/, "").slice(0, 300);
    return fail(
      req,
      env,
      "PAYMENT_FAILED",
      providerDetail
        ? `Mercado Pago: ${providerDetail}`
        : "O Mercado Pago não conseguiu processar este pagamento",
      422,
      id,
    );
  }
  const status = normalizedMercadoPagoPaymentStatus(payment.status);
  const providerPaymentId = String(payment.id || "").slice(0, 200);
  if (!providerPaymentId)
    return fail(req, env, "PAYMENT_FAILED", "O Mercado Pago não retornou o identificador do pagamento", 502, id);
  const approvedAt = status === "approved"
    ? String(payment.date_approved || new Date().toISOString())
    : null;
  const accessExpiresAt = approvedAt
    ? new Date(Date.parse(approvedAt) + plan.passDays * 86400000).toISOString()
    : null;
  await env.DB.prepare(
    `UPDATE premium_pass_payments SET provider_payment_id=?,status=?,
       paid_at=CASE WHEN ?='approved' THEN ? ELSE paid_at END,
       access_expires_at=CASE WHEN ?='approved' THEN ? ELSE access_expires_at END,
       provider_updated_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(
    providerPaymentId, status, status, approvedAt, status, accessExpiresAt,
    payment.date_last_updated || new Date().toISOString(), purchaseId,
  ).run();
  const notificationKind = status === "approved"
    ? "pass_approved"
    : status === "rejected"
      ? "pass_rejected"
      : null;
  if (notificationKind) await sendPremiumNotification(env, {
    eventKey: `${notificationKind}:${providerPaymentId}`,
    userId: user.id,
    kind: notificationKind,
    amountCents: plan.passAmountCents,
    accessExpiresAt,
  });
  const transactionData = payment.point_of_interaction?.transaction_data || {};
  return ok(req, env, {
    paymentId: providerPaymentId,
    status,
    statusDetail: String(payment.status_detail || "").slice(0, 100),
    accessExpiresAt,
    pix: transactionData.qr_code ? {
      qrCode: String(transactionData.qr_code),
      qrCodeBase64: String(transactionData.qr_code_base64 || ""),
    } : null,
    ticketUrl: String(
      transactionData.ticket_url ||
      payment.transaction_details?.external_resource_url ||
      "",
    ),
  }, id);
}

async function createPremiumCheckout(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta para assinar", 401, id);
  if (!stripeConfigured(env))
    return fail(req, env, "PAYMENTS_NOT_CONFIGURED", "O pagamento Premium ainda não foi configurado", 503, id);
  const current = await premiumSubscriptionData(env, user.id, { reconcilePending: true });
  if (current.premium) return ok(req, env, current, id);
  if (current.status === "pending" && current.subscription?.provider === "stripe" && current.subscription?.checkoutUrl)
    return ok(req, env, { ...current, checkoutUrl: current.subscription.checkoutUrl }, id);
  const plan = await resolvedPremiumPlan(env);
  const siteOrigin = String(env.PUBLIC_SITE_URL || allowedOrigins(env)[0] || "").replace(/\/+$/, "");
  if (!/^https:\/\//i.test(siteOrigin))
    return fail(req, env, "PUBLIC_SITE_URL_REQUIRED", "Configure PUBLIC_SITE_URL com o endereço HTTPS do site", 503, id);
  let checkout;
  try {
    checkout = await stripeApi(env, "/v1/checkout/sessions", {
      method: "POST",
      idempotencyKey: `subscription-${user.id}-${plan.amountCents}-${premiumPeriodKey()}`,
      params: {
        mode: "subscription",
        client_reference_id: user.id,
        customer_email: user.email,
        success_url: `${siteOrigin}/conta.html?premium_payment=success&session_id={CHECKOUT_SESSION_ID}#premium`,
        cancel_url: `${siteOrigin}/conta.html?premium_payment=failure#premium`,
        allow_promotion_codes: "true",
        "metadata[shoplab_kind]": "subscription",
        "metadata[shoplab_user_id]": user.id,
        "subscription_data[metadata][shoplab_user_id]": user.id,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": plan.currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(plan.amountCents),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][product_data][name]": plan.name,
        "line_items[0][price_data][product_data][description]": `${plan.aiMonthlyLimit} comparações inteligentes por mês`,
      },
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "stripe_subscription_checkout_creation_failed", userId: user.id, error: String(error?.message || error), provider: error?.provider || null }));
    return fail(req, env, "CHECKOUT_CREATION_FAILED", "Não foi possível abrir o pagamento seguro agora", 502, id);
  }
  if (!/^cs_/.test(String(checkout.id || "")) || !/^https:\/\//i.test(String(checkout.url || "")))
    return fail(req, env, "CHECKOUT_CREATION_FAILED", "O Stripe não retornou um checkout válido", 502, id);
  await env.DB.prepare(
    `INSERT INTO premium_subscriptions(id,user_id,provider,provider_subscription_id,status,payer_email,amount_cents,currency,checkout_url,provider_updated_at)
     VALUES(?,?,'stripe',?,'pending',?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET provider='stripe',provider_subscription_id=excluded.provider_subscription_id,
       status='pending',payer_email=excluded.payer_email,amount_cents=excluded.amount_cents,currency=excluded.currency,
       checkout_url=excluded.checkout_url,provider_updated_at=excluded.provider_updated_at,updated_at=CURRENT_TIMESTAMP`,
  ).bind(
    crypto.randomUUID(), user.id, `checkout:${checkout.id}`, user.email,
    plan.amountCents, plan.currency, String(checkout.url), new Date().toISOString(),
  ).run();
  return ok(req, env, { checkoutUrl: String(checkout.url), status: "pending", provider: "stripe", plan }, id);
}

async function createPremiumPassCheckout(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta para comprar o acesso", 401, id);
  if (!stripeConfigured(env))
    return fail(req, env, "PAYMENTS_NOT_CONFIGURED", "O pagamento Premium ainda não foi configurado", 503, id);
  const current = await premiumSubscriptionData(env, user.id, { reconcilePending: true });
  if (current.premium) return ok(req, env, current, id);
  if (current.pendingPass?.providerPreferenceId?.startsWith("cs_") && current.pendingPass?.checkoutUrl)
    return ok(req, env, { ...current, checkoutUrl: current.pendingPass.checkoutUrl }, id);
  const plan = await resolvedPremiumPlan(env);
  const siteOrigin = String(env.PUBLIC_SITE_URL || allowedOrigins(env)[0] || "").replace(/\/+$/, "");
  if (!/^https:\/\//i.test(siteOrigin))
    return fail(req, env, "PUBLIC_SITE_URL_REQUIRED", "Configure PUBLIC_SITE_URL com o endereço HTTPS do site", 503, id);
  const purchaseId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO premium_pass_payments(id,user_id,status,payer_email,amount_cents,currency)
     VALUES(?,?,'pending',?,?,?)`,
  ).bind(purchaseId, user.id, user.email, plan.passAmountCents, plan.currency).run();
  let checkout;
  try {
    checkout = await stripeApi(env, "/v1/checkout/sessions", {
      method: "POST",
      idempotencyKey: `pass-${purchaseId}`,
      params: {
        mode: "payment",
        client_reference_id: user.id,
        customer_email: user.email,
        success_url: `${siteOrigin}/conta.html?premium_payment=success&session_id={CHECKOUT_SESSION_ID}#premium`,
        cancel_url: `${siteOrigin}/conta.html?premium_payment=failure#premium`,
        allow_promotion_codes: "true",
        "metadata[shoplab_kind]": "pass",
        "metadata[shoplab_user_id]": user.id,
        "metadata[purchase_id]": purchaseId,
        "payment_intent_data[metadata][shoplab_user_id]": user.id,
        "payment_intent_data[metadata][purchase_id]": purchaseId,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": plan.currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(plan.passAmountCents),
        "line_items[0][price_data][product_data][name]": `${plan.name} por ${plan.passDays} dias`,
        "line_items[0][price_data][product_data][description]": `${plan.aiMonthlyLimit} comparações inteligentes durante o período`,
      },
    });
  } catch (error) {
    await env.DB.prepare(`UPDATE premium_pass_payments SET status='rejected',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(purchaseId).run();
    console.error(JSON.stringify({ event: "stripe_pass_checkout_creation_failed", userId: user.id, purchaseId, error: String(error?.message || error), provider: error?.provider || null }));
    return fail(req, env, "CHECKOUT_CREATION_FAILED", "Não foi possível abrir o pagamento avulso agora", 502, id);
  }
  const checkoutUrl = String(checkout.url || "");
  if (!/^cs_/.test(String(checkout.id || "")) || !/^https:\/\//i.test(checkoutUrl))
    return fail(req, env, "CHECKOUT_CREATION_FAILED", "O Stripe não retornou um checkout válido", 502, id);
  await env.DB.prepare(
    `UPDATE premium_pass_payments SET provider_preference_id=?,checkout_url=?,provider_updated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(String(checkout.id), checkoutUrl, purchaseId).run();
  return ok(req, env, { checkoutUrl, status: "pass_pending", provider: "stripe", plan }, id);
}

async function cancelPremiumSubscription(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const current = await env.DB.prepare(
    `SELECT provider,provider_subscription_id providerSubscriptionId,status,amount_cents amountCents FROM premium_subscriptions WHERE user_id=?`,
  ).bind(user.id).first();
  if (!current?.providerSubscriptionId)
    return fail(req, env, "SUBSCRIPTION_NOT_FOUND", "Assinatura não encontrada", 404, id);
  if (current.status === "cancelled") return ok(req, env, { status: "cancelled", premium: false }, id);
  try {
    if (current.provider === "stripe") {
      if (!/^sub_/.test(current.providerSubscriptionId)) throw new Error("STRIPE_SUBSCRIPTION_NOT_ACTIVE");
      await stripeApi(env, `/v1/subscriptions/${encodeURIComponent(current.providerSubscriptionId)}`, { method: "DELETE" });
    } else {
      await mercadoPagoApi(env, `/preapproval/${encodeURIComponent(current.providerSubscriptionId)}`, {
        method: "PUT",
        body: JSON.stringify({ status: "canceled" }),
      });
    }
  } catch (error) {
    console.error(JSON.stringify({ event: "premium_subscription_cancel_failed", userId: user.id, error: String(error?.message || error) }));
    return fail(req, env, "SUBSCRIPTION_CANCEL_FAILED", "Não foi possível cancelar a assinatura agora", 502, id);
  }
  await env.DB.prepare(
    `UPDATE premium_subscriptions SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE user_id=?`,
  ).bind(user.id).run();
  await sendPremiumNotification(env, {
    eventKey: `subscription-cancelled:${current.providerSubscriptionId}`,
    userId: user.id,
    kind: "subscription_cancelled",
    amountCents: current.amountCents,
  });
  return ok(req, env, { status: "cancelled", premium: false }, id);
}

async function mercadoPagoWebhookSignature(req, dataId, secret) {
  const signatureParts = Object.fromEntries(String(req.headers.get("x-signature") || "").split(",").map((part) => part.trim().split("=", 2)));
  const timestamp = signatureParts.ts || "";
  const received = String(signatureParts.v1 || "").toLowerCase();
  const requestId = String(req.headers.get("x-request-id") || "");
  if (!timestamp || !received || !requestId || !dataId || !secret) return false;
  const normalizedId = /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, enc.encode(`id:${normalizedId};request-id:${requestId};ts:${timestamp};`));
  return safeEqual(bytesToHex(new Uint8Array(digest)), received);
}

function normalizedMercadoPagoPaymentStatus(value) {
  const status = String(value || "").toLowerCase();
  if (status === "approved") return "approved";
  if (status === "refunded" || status === "charged_back") return "refunded";
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "rejected";
  return "pending";
}

function mercadoPagoOrderPayment(order) {
  return Array.isArray(order?.transactions?.payments)
    ? order.transactions.payments[0] || {}
    : {};
}

function normalizedMercadoPagoOrderStatus(value) {
  const status = String(value || "").toLowerCase();
  if (["processed", "approved"].includes(status)) return "approved";
  if (["refunded", "charged_back", "charged-back"].includes(status)) return "refunded";
  if (["cancelled", "canceled", "expired"].includes(status)) return "cancelled";
  if (["rejected", "failed"].includes(status)) return "rejected";
  return "pending";
}

async function reconcileMercadoPagoPassOrder(env, providerOrderId) {
  const orderId = String(providerOrderId || "").replace(/^order:/, "").slice(0, 200);
  if (!orderId) return null;
  const remote = await mercadoPagoOrdersApi(env, `/v1/orders/${encodeURIComponent(orderId)}`);
  const reference = String(remote.external_reference || "");
  const match = reference.match(/^shoplab-pass-([a-f0-9-]{36})$/i);
  if (!match) return null;
  const purchase = await env.DB.prepare(
    `SELECT id,user_id userId,status,amount_cents amountCents,currency,access_expires_at accessExpiresAt
     FROM premium_pass_payments WHERE id=?`,
  ).bind(match[1]).first();
  if (!purchase || reference !== `shoplab-pass-${purchase.id}`)
    throw new Error("MERCADOPAGO_PASS_REFERENCE_MISMATCH");
  const orderPayment = mercadoPagoOrderPayment(remote);
  const paidAmountCents = Math.round(Number(
    orderPayment.paid_amount ?? orderPayment.amount ?? remote.total_amount ?? 0,
  ) * 100);
  const currency = String(
    orderPayment.currency_id || remote.currency_id || purchase.currency,
  ).toUpperCase();
  if (paidAmountCents !== Number(purchase.amountCents) || currency !== purchase.currency)
    throw new Error("MERCADOPAGO_PASS_AMOUNT_MISMATCH");
  const status = normalizedMercadoPagoOrderStatus(orderPayment.status || remote.status);
  const approvedAt = status === "approved"
    ? String(orderPayment.date_approved || remote.last_updated_date || new Date().toISOString())
    : null;
  const plan = await resolvedPremiumPlan(env);
  const accessExpiresAt = approvedAt
    ? new Date(Date.parse(approvedAt) + plan.passDays * 86400000).toISOString()
    : null;
  const providerId = `order:${orderId}`;
  await env.DB.prepare(
    `UPDATE premium_pass_payments SET provider_payment_id=?,status=?,paid_at=CASE WHEN ?='approved' THEN COALESCE(paid_at,?) ELSE paid_at END,
       access_expires_at=CASE WHEN ?='approved' THEN COALESCE(access_expires_at,?) WHEN ?='refunded' THEN NULL ELSE access_expires_at END,
       provider_updated_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(
    providerId, status, status, approvedAt, status, accessExpiresAt, status,
    remote.last_updated_date || new Date().toISOString(), purchase.id,
  ).run();
  if (status !== purchase.status) {
    const kind = status === "approved" ? "pass_approved" : status === "refunded" ? "pass_refunded" : status === "rejected" ? "pass_rejected" : null;
    if (kind) await sendPremiumNotification(env, {
      eventKey: `${kind}:${providerId}`,
      userId: purchase.userId,
      kind,
      amountCents: purchase.amountCents,
      accessExpiresAt: status === "approved" ? accessExpiresAt : null,
    });
  }
  return { userId: purchase.userId, status, accessExpiresAt };
}

async function reconcileMercadoPagoPassPayment(env, providerPaymentId) {
  const paymentId = String(providerPaymentId || "").slice(0, 200);
  if (!paymentId) return null;
  if (paymentId.startsWith("order:"))
    return reconcileMercadoPagoPassOrder(env, paymentId);
  const purchase = await env.DB.prepare(
    `SELECT id,user_id userId,status,amount_cents amountCents,currency,access_expires_at accessExpiresAt
     FROM premium_pass_payments WHERE provider_payment_id=?`,
  ).bind(paymentId).first();
  if (!purchase) return null;
  const remote = await mercadoPagoCheckoutApi(env, `/v1/payments/${encodeURIComponent(paymentId)}`);
  const reference = String(remote.external_reference || "");
  const validReferences = new Set([
    `shoplab-pass-${purchase.id}`,
    `shoplab-pass:${purchase.id}:${purchase.userId}`,
  ]);
  if (!validReferences.has(reference))
    throw new Error("MERCADOPAGO_PASS_REFERENCE_MISMATCH");
  const paidAmountCents = Math.round(Number(remote.transaction_amount || 0) * 100);
  const currency = String(remote.currency_id || "").toUpperCase();
  if (paidAmountCents !== Number(purchase.amountCents) || currency !== purchase.currency)
    throw new Error("MERCADOPAGO_PASS_AMOUNT_MISMATCH");
  const status = normalizedMercadoPagoPaymentStatus(remote.status);
  const approvedAt = status === "approved" ? String(remote.date_approved || new Date().toISOString()) : null;
  const plan = await resolvedPremiumPlan(env);
  const accessExpiresAt = approvedAt
    ? new Date(Date.parse(approvedAt) + plan.passDays * 86400000).toISOString()
    : null;
  await env.DB.prepare(
    `UPDATE premium_pass_payments SET provider_payment_id=?,status=?,paid_at=CASE WHEN ?='approved' THEN COALESCE(paid_at,?) ELSE paid_at END,
       access_expires_at=CASE WHEN ?='approved' THEN COALESCE(access_expires_at,?) WHEN ?='refunded' THEN NULL ELSE access_expires_at END,
       provider_updated_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).bind(
    paymentId, status, status, approvedAt, status, accessExpiresAt, status,
    remote.date_last_updated || new Date().toISOString(), purchase.id,
  ).run();
  if (status !== purchase.status) {
    const kind = status === "approved" ? "pass_approved" : status === "refunded" ? "pass_refunded" : status === "rejected" ? "pass_rejected" : null;
    if (kind) await sendPremiumNotification(env, {
      eventKey: `${kind}:${paymentId}`,
      userId: purchase.userId,
      kind,
      amountCents: purchase.amountCents,
      accessExpiresAt: status === "approved" ? accessExpiresAt : null,
    });
  }
  return { userId: purchase.userId, status, accessExpiresAt };
}

async function notifyMercadoPagoSubscriptionPayment(env, providerPaymentId) {
  const paymentId = String(providerPaymentId || "").slice(0, 200);
  if (!paymentId) return;
  const remote = await mercadoPagoApi(env, `/v1/payments/${encodeURIComponent(paymentId)}`);
  const reference = String(remote.external_reference || "");
  if (!reference.startsWith("shoplab:") || reference.startsWith("shoplab-pass:")) return;
  const userId = reference.slice("shoplab:".length);
  const subscription = await env.DB.prepare(
    `SELECT user_id userId,amount_cents amountCents FROM premium_subscriptions WHERE user_id=?`,
  ).bind(userId).first();
  if (!subscription) return;
  const status = normalizedMercadoPagoPaymentStatus(remote.status);
  const kind = status === "approved" ? "subscription_payment_approved" : status === "rejected" ? "subscription_payment_rejected" : null;
  if (kind) await sendPremiumNotification(env, {
    eventKey: `${kind}:${paymentId}`,
    userId,
    kind,
    amountCents: Math.round(Number(remote.transaction_amount || subscription.amountCents / 100) * 100),
  });
}

async function mercadoPagoWebhook(req, env) {
  const body = await req.json().catch(() => ({}));
  const url = new URL(req.url);
  const dataId = String(url.searchParams.get("data.id") || url.searchParams.get("data_id") || body?.data?.id || "").slice(0, 300);
  const valid = await mercadoPagoWebhookSignature(req, dataId, String(env.MERCADOPAGO_WEBHOOK_SECRET || ""));
  if (!valid) return new Response(null, { status: 401 });
  const topic = String(body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic") || "");
  if (topic === "subscription_preapproval" && dataId) {
    try {
      await reconcileMercadoPagoSubscription(env, dataId);
    } catch (error) {
      console.error(JSON.stringify({ event: "mercadopago_webhook_reconcile_failed", providerSubscriptionId: dataId, error: String(error?.message || error) }));
      return new Response(null, { status: 500 });
    }
  }
  if (["payment", "payments"].includes(topic) && dataId) {
    try {
      const passPayment = await reconcileMercadoPagoPassPayment(env, dataId);
      if (!passPayment) await notifyMercadoPagoSubscriptionPayment(env, dataId);
    } catch (error) {
      console.error(JSON.stringify({ event: "mercadopago_payment_reconcile_failed", providerPaymentId: dataId, error: String(error?.message || error) }));
      return new Response(null, { status: 500 });
    }
  }
  if (topic.toLowerCase().includes("order") && dataId) {
    try {
      await reconcileMercadoPagoPassPayment(env, `order:${dataId}`);
    } catch (error) {
      console.error(JSON.stringify({ event: "mercadopago_order_reconcile_failed", providerOrderId: dataId, error: String(error?.message || error) }));
      return new Response(null, { status: 500 });
    }
  }
  return new Response(null, { status: 200 });
}
async function personalizedRecommendations(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const { results } = await env.DB.prepare(`
    WITH signals AS (
      SELECT product_slug,8.0 weight FROM user_favorites WHERE user_id=?
      UNION ALL SELECT product_slug,10.0 FROM user_cart WHERE user_id=?
      UNION ALL SELECT product_slug,rating*2.0 FROM user_ratings WHERE user_id=?
      UNION ALL SELECT product_slug,2.0 FROM user_view_history WHERE user_id=?
      UNION ALL
      SELECT product_slug,CASE event_type
        WHEN 'offer_click' THEN 12.0 WHEN 'favorite' THEN 8.0
        WHEN 'search_result_click' THEN 6.0 WHEN 'product_view' THEN 3.0
        WHEN 'product_impression' THEN 0.5 ELSE 0 END
      FROM events WHERE user_id=? AND product_slug IS NOT NULL
        AND created_at>=datetime('now','-90 days')
    ),
    category_interest AS (
      SELECT p.category_id,SUM(s.weight) weight FROM signals s
      JOIN products p ON p.slug=s.product_slug
      WHERE p.category_id IS NOT NULL GROUP BY p.category_id
    ),
    brand_interest AS (
      SELECT p.brand_id,SUM(s.weight) weight FROM signals s
      JOIN products p ON p.slug=s.product_slug
      WHERE p.brand_id IS NOT NULL GROUP BY p.brand_id
    ),
    recent_searches AS (
      SELECT query_text,COUNT(*) weight FROM events
      WHERE user_id=? AND event_type IN ('search','search_no_results')
        AND query_text IS NOT NULL AND created_at>=datetime('now','-30 days')
      GROUP BY query_text ORDER BY MAX(created_at) DESC LIMIT 12
    ),
    activity AS (
      SELECT product_slug,SUM(CASE event_type
        WHEN 'offer_click' THEN 8 WHEN 'search_result_click' THEN 4
        WHEN 'product_view' THEN 1 ELSE 0 END) score
      FROM events WHERE created_at>=datetime('now','-14 days')
      GROUP BY product_slug
    )
    SELECT p.id,p.name,p.slug,p.product_type productType,
      p.short_description shortDescription,p.editorial_score editorialScore,
      p.is_featured isFeatured,p.view_count viewCount,p.updated_at updatedAt,
      c.name category,b.name brand,COALESCE(o.current_price_cents,p.base_price_cents) price,
      COALESCE(o.previous_price_cents,p.compare_at_price_cents) oldPrice,
      pa.name store,o.id offerId,
      COALESCE(ci.weight,0)*1.6+COALESCE(bi.weight,0)*0.9+
      COALESCE(activity.score,0)*0.12+COALESCE(p.editorial_score,0)*0.08+
      p.is_featured*4+CASE WHEN p.published_at>=datetime('now','-30 days') THEN 3 ELSE 0 END+
      COALESCE((SELECT SUM(rs.weight)*4 FROM recent_searches rs
        WHERE lower(COALESCE(p.name,'')||' '||COALESCE(p.short_description,'')||' '||COALESCE(c.name,'')||' '||COALESCE(b.name,'')) LIKE '%'||lower(rs.query_text)||'%'),0) recommendationScore
    FROM products p
    LEFT JOIN categories c ON c.id=p.category_id
    LEFT JOIN brands b ON b.id=p.brand_id
    LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1
    LEFT JOIN partners pa ON pa.id=o.partner_id
    LEFT JOIN category_interest ci ON ci.category_id=p.category_id
    LEFT JOIN brand_interest bi ON bi.brand_id=p.brand_id
    LEFT JOIN activity ON activity.product_slug=p.slug
    WHERE p.status='published'
      AND NOT EXISTS(SELECT 1 FROM user_favorites f WHERE f.user_id=? AND f.product_slug=p.slug)
      AND NOT EXISTS(SELECT 1 FROM user_cart cart WHERE cart.user_id=? AND cart.product_slug=p.slug)
    ORDER BY recommendationScore DESC,p.updated_at DESC LIMIT 8
  `).bind(user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id).all();
  const response=ok(req,env,(results||[]).map(normalizeProduct),id,{strategy:"behavior-sql",aiUsed:false});
  response.headers.set("cache-control","private, no-store, max-age=0");
  return response;
}
async function userLibrary(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const [favorites, ratings, cart, history] = await env.DB.batch([
    env.DB.prepare(`SELECT f.product_slug slug,p.name,COALESCE(o.current_price_cents,p.base_price_cents) price,pm.storage_key storageKey,pm.external_url externalUrl,pm.alt_text altText FROM user_favorites f JOIN products p ON p.slug=f.product_slug LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 LEFT JOIN product_media pm ON pm.id=(SELECT id FROM product_media WHERE product_id=p.id AND type='image' ORDER BY is_primary DESC,sort_order,created_at LIMIT 1) WHERE f.user_id=? ORDER BY f.created_at DESC`).bind(user.id),
    env.DB.prepare(`SELECT r.product_slug slug,r.rating,r.updated_at updatedAt,p.name,pm.storage_key storageKey,pm.external_url externalUrl,pm.alt_text altText FROM user_ratings r JOIN products p ON p.slug=r.product_slug LEFT JOIN product_media pm ON pm.id=(SELECT id FROM product_media WHERE product_id=p.id AND type='image' ORDER BY is_primary DESC,sort_order,created_at LIMIT 1) WHERE r.user_id=? ORDER BY r.updated_at DESC`).bind(user.id),
    env.DB.prepare(`SELECT c.product_slug slug,c.quantity,p.name,COALESCE(o.current_price_cents,p.base_price_cents) price,pm.storage_key storageKey,pm.external_url externalUrl,pm.alt_text altText FROM user_cart c JOIN products p ON p.slug=c.product_slug LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 LEFT JOIN product_media pm ON pm.id=(SELECT id FROM product_media WHERE product_id=p.id AND type='image' ORDER BY is_primary DESC,sort_order,created_at LIMIT 1) WHERE c.user_id=? ORDER BY c.updated_at DESC`).bind(user.id),
    env.DB.prepare(`SELECT h.product_slug slug,h.viewed_at viewedAt,p.name,COALESCE(o.current_price_cents,p.base_price_cents) price FROM user_view_history h JOIN products p ON p.slug=h.product_slug LEFT JOIN offers o ON o.product_id=p.id AND o.is_primary=1 WHERE h.user_id=? ORDER BY h.viewed_at DESC LIMIT 20`).bind(user.id),
  ]);
  return ok(req, env, { favorites:favorites.results||[], ratings:ratings.results||[], cart:cart.results||[], history:history.results||[] }, id);
}
async function updateUserLibraryItem(req, env, path, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const [, , , , type, encodedSlug] = path.split("/"), slug = decodeURIComponent(encodedSlug), body = await readJson(req, 4096);
  const product = await env.DB.prepare("SELECT slug FROM products WHERE slug=? AND status='published'").bind(slug).first();
  if (!product) return fail(req, env, "PRODUCT_NOT_FOUND", "Produto não encontrado", 404, id);
  if (type === "favorites") {
    if (body.active === false) await env.DB.prepare("DELETE FROM user_favorites WHERE user_id=? AND product_slug=?").bind(user.id,slug).run();
    else await env.DB.prepare("INSERT OR IGNORE INTO user_favorites(user_id,product_slug) VALUES(?,?)").bind(user.id,slug).run();
    return ok(req,env,{slug,active:body.active!==false},id);
  }
  if (type === "ratings") {
    const rating = clamp(body.rating,1,5,0);
    if (!rating) return fail(req,env,"VALIDATION_ERROR","Escolha de 1 a 5 estrelas",422,id);
    await env.DB.prepare(`INSERT INTO user_ratings(user_id,product_slug,rating) VALUES(?,?,?) ON CONFLICT(user_id,product_slug) DO UPDATE SET rating=excluded.rating,updated_at=CURRENT_TIMESTAMP`).bind(user.id,slug,rating).run();
    const summary = await env.DB.prepare(`SELECT ROUND(AVG(rating),1) average,COUNT(*) total FROM user_ratings WHERE product_slug=?`).bind(slug).first();
    return ok(req,env,{slug,rating,average:Number(summary?.average||0),total:Number(summary?.total||0)},id);
  }
  const quantity = clamp(body.quantity,0,99,1);
  if (!quantity) await env.DB.prepare("DELETE FROM user_cart WHERE user_id=? AND product_slug=?").bind(user.id,slug).run();
  else await env.DB.prepare(`INSERT INTO user_cart(user_id,product_slug,quantity) VALUES(?,?,?) ON CONFLICT(user_id,product_slug) DO UPDATE SET quantity=excluded.quantity,updated_at=CURRENT_TIMESTAMP`).bind(user.id,slug,quantity).run();
  return ok(req,env,{slug,quantity},id);
}
async function syncUserHistory(req, env, id) {
  const user = await activeUser(req, env);
  if (!user) return fail(req, env, "UNAUTHORIZED", "Entre na sua conta", 401, id);
  const body=await readJson(req,16000),items=(Array.isArray(body.items)?body.items:[]).slice(0,30).filter(item=>/^[a-z0-9-]{2,160}$/.test(String(item.slug||"")));
  if(items.length)await env.DB.batch(items.map(item=>env.DB.prepare(`INSERT INTO user_view_history(user_id,product_slug,viewed_at) SELECT ?,slug,? FROM products WHERE slug=? ON CONFLICT(user_id,product_slug) DO UPDATE SET viewed_at=MAX(viewed_at,excluded.viewed_at)`).bind(user.id,new Date(Number(item.viewedAt)||Date.now()).toISOString(),item.slug)));
  return ok(req,env,{synced:items.length},id);
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

async function giftCardCryptoKey(env){
  const secret=String(env.GIFT_CARD_ENCRYPTION_KEY||"");
  if(secret.length<24)throw new Error("GIFT_CARD_ENCRYPTION_KEY deve ter pelo menos 24 caracteres");
  const material=await crypto.subtle.digest("SHA-256",enc.encode(secret));
  return crypto.subtle.importKey("raw",material,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}

function bytesToBase64(bytes){
  let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);
}

function base64ToBytes(value){
  const binary=atob(value);return Uint8Array.from(binary,character=>character.charCodeAt(0));
}

async function encryptGiftCardSecret(env,value){
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await giftCardCryptoKey(env);
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(value)));
  const payload=new Uint8Array(iv.length+encrypted.length);payload.set(iv);payload.set(encrypted,iv.length);
  return bytesToBase64(payload);
}

async function decryptGiftCardSecret(env,value){
  const payload=base64ToBytes(String(value||"")),iv=payload.slice(0,12),encrypted=payload.slice(12),key=await giftCardCryptoKey(env);
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv},key,encrypted));
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
  res.headers.set("access-control-allow-headers", "Content-Type, Authorization, X-Shoplab-Ref");
  return res;
}
