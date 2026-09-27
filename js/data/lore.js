import { LORE as LORE_PACK, WIKI_CAST as CAST_PACK, SECRET_CAST as SECRET_PACK } from "../i18n/copy.js";
import { I18n } from "../i18n/I18n.js";

export function getLore() {
  return LORE_PACK[I18n.lang] || LORE_PACK.th;
}

export function getWikiCast() {
  return CAST_PACK[I18n.lang] || CAST_PACK.th;
}

export function getSecrets() {
  return SECRET_PACK[I18n.lang] || SECRET_PACK.th;
}

/** @deprecated use getLore() so language switches apply */
export const LORE = LORE_PACK.th;
export const WIKI_CAST = CAST_PACK.th;
export const SECRET_CAST = SECRET_PACK.th;
