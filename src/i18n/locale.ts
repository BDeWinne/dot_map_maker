import { UI_STRINGS, type UiStringKey } from "./uiStrings";

export type Locale = "es" | "en";

const LS_LOCALE = "uiLocale";

let currentLocale: Locale = readStoredLocale();

function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(LS_LOCALE);
    if (raw === "en" || raw === "es") return raw;
  } catch {
    /* ignore */
  }
  return "es";
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(
  key: UiStringKey,
  locale: Locale = currentLocale,
  vars?: Record<string, string | number>,
): string {
  const row = UI_STRINGS[key];
  let text: string = row?.[locale] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function setLocale(locale: Locale) {
  if (locale !== "es" && locale !== "en") return;
  currentLocale = locale;
  try {
    localStorage.setItem(LS_LOCALE, locale);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = locale;
  applyLocaleToDom();
  document.dispatchEvent(new CustomEvent("locale:changed", { detail: { locale } }));
}

export function applyLocaleToDom() {
  const locale = currentLocale;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as UiStringKey | undefined;
    if (key) el.textContent = t(key, locale);
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml as UiStringKey | undefined;
    if (key) el.innerHTML = t(key, locale);
  });

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "[data-i18n-placeholder]",
  ).forEach((el) => {
    const key = el.dataset.i18nPlaceholder as UiStringKey | undefined;
    if (key) el.placeholder = t(key, locale);
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria as UiStringKey | undefined;
    if (key) el.setAttribute("aria-label", t(key, locale));
  });

  document.querySelectorAll<HTMLOptionElement>("option[data-i18n]").forEach((opt) => {
    const key = opt.dataset.i18n as UiStringKey | undefined;
    if (key) opt.textContent = t(key, locale);
  });

  syncLocaleButtons();
}

function syncLocaleButtons() {
  document.querySelectorAll<HTMLButtonElement>("[data-locale-set]").forEach((btn) => {
    const loc = btn.dataset.localeSet as Locale;
    const active = loc === currentLocale;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}
