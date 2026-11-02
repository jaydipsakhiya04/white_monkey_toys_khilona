/**
 * Search terms the site is optimised for: the brand itself, local searches (Surat / Varachha) and
 * broader shopping / wholesale searches. Used for meta keywords, structured data and on-page copy.
 * The physical store location itself always comes from the store settings.
 */

/** Ways people search for the brand. */
export const BRAND_NAMES = ["White Monkey Toys", "WhiteMonkey Toys", "White Monkey Toy Shop", "White Monkey Toys Surat", "WM Toys Surat"];

/** Local intent: Surat, Varachha and nearby. */
export const LOCAL_KEYWORDS = [
  "toy shop in Surat",
  "best toys in Surat",
  "toy shop in Varachha",
  "toy store in Surat",
  "toy shop near Hirabaug",
  "toys near me Surat",
  "RC car shop in Surat",
  "remote control cars in Surat",
  "drones in Surat",
  "action figures in Surat",
  "toy wholesaler in Surat",
  "wholesale toys Surat",
];

/** Broader shopping and trade intent. */
export const GLOBAL_KEYWORDS = [
  "wholesale toys",
  "toys for sale",
  "buy toys online",
  "toy wholesaler",
  "bulk toys for retailers",
  "toy supplier Gujarat",
  "RC cars online India",
  "hobby grade RC cars",
  "remote control drones",
  "licensed die-cast cars",
  "action figures India",
];

export const ALL_KEYWORDS = [...BRAND_NAMES, ...LOCAL_KEYWORDS, ...GLOBAL_KEYWORDS];

/** Free delivery covers the whole city; these neighbourhoods are named for local relevance. */
export const SURAT_AREAS = ["Varachha", "Mota Varachha", "Hirabaug", "Kapodra", "Katargam", "Adajan", "Vesu", "Piplod", "Athwa", "Udhna", "Pal", "City Light"];

/** Wholesale page keywords. */
export const WHOLESALE_KEYWORDS = [
  "wholesale toys",
  "wholesale toys Surat",
  "toy wholesaler in Surat",
  "toy wholesale market Surat",
  "bulk toys",
  "toys for resellers",
  "toy supplier for shops",
  "wholesale RC cars",
  "wholesale drones",
  "wholesale action figures",
  "toy distributor Gujarat",
  ...BRAND_NAMES.slice(0, 2),
];
