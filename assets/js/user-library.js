import { session, userApi } from "./auth.js";

const LEGACY_KEYS = {
  favorites: "shoplab:favorites",
  ratings: "shoplab:ratings",
  cart: "shoplab:cart",
};
const STORAGE_PREFIX = "shoplab:library";

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

function sessionUserId() {
  const token = session()?.access_token;
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const userId = JSON.parse(atob(padded))?.sub;
    return /^[a-zA-Z0-9_-]{8,100}$/.test(String(userId || ""))
      ? String(userId)
      : null;
  } catch {
    return null;
  }
}

function ownerKey() {
  const userId = sessionUserId();
  return userId ? `user:${userId}` : "guest";
}

function storageKey(type, owner = ownerKey()) {
  return `${STORAGE_PREFIX}:${owner}:${type}`;
}

function migrateLegacyGuestLibrary() {
  for (const [type, legacyKey] of Object.entries(LEGACY_KEYS)) {
    const guestKey = storageKey(type, "guest");
    if (localStorage.getItem(guestKey) === null) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null) localStorage.setItem(guestKey, legacyValue);
    }
    localStorage.removeItem(legacyKey);
  }
}

migrateLegacyGuestLibrary();

export const localLibrary = () => {
  const cart = read(storageKey("cart"), {});
  return {
    favorites: read(storageKey("favorites"), []),
    ratings: read(storageKey("ratings"), {}),
    // Carrinho é uma lista de produtos únicos; cliques repetidos não criam unidades.
    cart: Object.fromEntries(Object.keys(cart).map((slug) => [slug, 1])),
  };
};

function storeChange(type, slug, value) {
  const data = localLibrary();
  if (type === "favorites") {
    data.favorites = value.active
      ? [...new Set([...data.favorites, slug])]
      : data.favorites.filter((item) => item !== slug);
    write(storageKey("favorites"), data.favorites);
  }
  if (type === "ratings") {
    if (value.rating) data.ratings[slug] = value.rating;
    else delete data.ratings[slug];
    write(storageKey("ratings"), data.ratings);
  }
  if (type === "cart") {
    if (value.quantity) data.cart[slug] = value.quantity;
    else delete data.cart[slug];
    write(storageKey("cart"), data.cart);
  }
}

async function change(type, slug, value) {
  const before = localLibrary();
  const oldValue =
    type === "favorites"
      ? before.favorites.includes(slug)
      : before[type]?.[slug] || 0;
  storeChange(type, slug, value);
  window.dispatchEvent(
    new CustomEvent("shoplab:library-change", {
      detail: {
        type: type === "ratings" ? "rating-preview" : type,
        originalType: type,
        slug,
        ...value,
        oldValue,
        optimistic: true,
      },
    }),
  );
  try {
    const result = session()
      ? await userApi(`${type}/${encodeURIComponent(slug)}`, {
          method: "PUT",
          body: JSON.stringify(value),
        })
      : { slug, ...value };
    window.dispatchEvent(
      new CustomEvent("shoplab:library-change", {
        detail: { type, slug, ...value, oldValue, confirmed: true },
      }),
    );
    return result;
  } catch (error) {
    const rollback =
      type === "favorites"
        ? { active: Boolean(oldValue) }
        : type === "ratings"
          ? { rating: oldValue }
          : { quantity: oldValue };
    storeChange(type, slug, rollback);
    window.dispatchEvent(
      new CustomEvent("shoplab:library-change", {
        detail: { type, slug, ...rollback, rollback: true },
      }),
    );
    throw error;
  }
}

export const toggleFavorite = (slug, active) =>
  change("favorites", slug, { active });
export const rateProduct = (slug, rating) =>
  change("ratings", slug, { rating });
export const setCart = (slug, quantity) =>
  change("cart", slug, { quantity });
export const getPersonalizedRecommendations = () =>
  session() ? userApi("recommendations") : Promise.resolve([]);

export async function syncAccountLibrary() {
  if (!sessionUserId()) return null;

  // The server is authoritative after login. Never upload browser data here:
  // doing so copied one account's library into the next account on the device.
  const library = await userApi("library");
  write(
    storageKey("favorites"),
    (library.favorites || []).map((item) => item.slug),
  );
  write(
    storageKey("ratings"),
    Object.fromEntries(
      (library.ratings || []).map((item) => [item.slug, item.rating]),
    ),
  );
  write(
    storageKey("cart"),
    Object.fromEntries(
      (library.cart || []).map((item) => [item.slug, 1]),
    ),
  );
  window.dispatchEvent(
    new CustomEvent("shoplab:library-change", { detail: { type: "sync" } }),
  );
  return library;
}

export async function bindLibraryUI() {
  const slug = new URLSearchParams(location.search).get("slug");
  const local = localLibrary();
  document.querySelectorAll(".product-card").forEach((card) => {
    if (card.querySelector("[data-like-product]")) return;
    const item = new URL(card.dataset.cardUrl || "", location.href).searchParams.get(
      "slug",
    );
    if (item)
      card.insertAdjacentHTML(
        "afterbegin",
        `<button class="card-like" type="button" data-like-product="${item}" aria-label="Curtir produto">♡</button>`,
      );
  });
  document.querySelectorAll("[data-like-product]").forEach((button) => {
    const item = button.dataset.likeProduct;
    const active = local.favorites.includes(item);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const next = !button.classList.contains("active");
      button.classList.toggle("active", next);
      button.setAttribute("aria-pressed", String(next));
      if (button.classList.contains("product-like"))
        button.textContent = next ? "♥ Curtido" : "♡ Curtir";
      try {
        await toggleFavorite(item, next);
      } catch {
        location.href = `entrar.html?next=${encodeURIComponent(location.pathname + location.search)}`;
      }
    };
  });
  if (!slug || !document.querySelector(".detail")) return;
  const target = document.querySelector(".detail>div:last-child");
  if (!target || target.querySelector(".user-product-actions")) return;
  target.insertAdjacentHTML(
    "beforeend",
    `<section class="user-product-actions"><div class="public-rating detail-public-rating" data-rating-summary="${slug}"></div><button class="btn ghost product-like" data-like-product="${slug}" type="button">♡ Curtir</button><button class="btn primary product-cart" type="button">Adicionar ao carrinho</button><div class="user-stars" aria-label="Sua avaliação"><span>Sua avaliação:</span>${[1, 2, 3, 4, 5].map((value) => `<button type="button" data-star="${value}" aria-label="${value} estrelas">★</button>`).join("")}</div></section>`,
  );
  await bindLibraryUI();
  const paintStars = (value) =>
    document.querySelectorAll("[data-star]").forEach((star) => {
      const active = Number(star.dataset.star) <= value;
      star.classList.toggle("active", active);
      star.setAttribute("aria-pressed", String(active));
    });
  paintStars(local.ratings[slug] || 0);
  document.querySelectorAll("[data-star]").forEach((button) => {
    button.onclick = async () => {
      const value = Number(button.dataset.star);
      const previous = localLibrary().ratings[slug] || 0;
      paintStars(value);
      try {
        await rateProduct(slug, value);
      } catch {
        paintStars(previous);
        location.href = `entrar.html?next=${encodeURIComponent(location.pathname + location.search)}`;
      }
    };
  });
  const cartButton = document.querySelector(".product-cart");
  if (localLibrary().cart[slug]) {
    cartButton.textContent = "Já está no carrinho ✓";
    cartButton.classList.add("is-added");
  }
  cartButton.onclick = async () => {
    cartButton.textContent = "Adicionado ao carrinho ✓";
    cartButton.classList.add("is-added");
    try {
      await setCart(slug, 1);
    } catch {
      cartButton.textContent = "Adicionar ao carrinho";
      cartButton.classList.remove("is-added");
      location.href = `entrar.html?next=${encodeURIComponent(location.pathname + location.search)}`;
    }
  };
}
