/*
 */
export const site = {
  organisation: 'Yemisrach Dimts Communication Service',
  shortName: 'YDCS',
  address: 'XPCJ+8Q9, Guinea Bissau St, Addis Ababa, Ethiopia',
  email: 'info@yemisrachdimts.org',
  /** As displayed to a reader. */
  phone: '+251 (0) 11 321 0134',

  
  phoneHref: '+2519112493368',
  mapsQuery: 'XPCJ+8Q9, Guinea Bissau St, Addis Ababa, Ethiopia',
} as const;

/** Embeddable map, built from `mapsQuery` so the address is never retyped. */
export const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
  site.mapsQuery
)}&z=16&hl=en&output=embed`;

/** "Get directions" link. */
export const mapDirectionsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
  site.mapsQuery
)}`;
