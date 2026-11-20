/*
 */
export const site = {
  organisation: 'Yemisrach Dimts Communication Service',
  shortName: 'YDCS',
  address: 'XPCJ+8Q9, Guinea Bissau St, Addis Ababa, Ethiopia',
  email: 'info@yemisrachdimts.org',
  /** As displayed to a reader. */
  phone: '+251 (0) 11 321 0134',

  /** Dialable form of `phone` (E.164, trunk zero omitted). */
  phoneHref: '+251113210134',
  mapsQuery: 'EECMY - Yemisrach Dimts Communication Services (YDCS), XPCJ+8Q9, Guinea Bissau St, Addis Ababa, Ethiopia',
  /** Exact pin from the Google Maps place listing for the YDCS studio. */
  mapsLat: 8.9707861,
  mapsLng: 38.7319913,
} as const;

/**
 * Google Maps embed. Uses the keyless `output=embed` endpoint so no API key is
 * needed; the nginx/.htaccess CSP `frame-src` must list google.com for it to
 * render. Pinned to the coordinates rather than the street name so the marker
 * lands on the studio itself.
 */
export const mapEmbedUrl =
  `https://www.google.com/maps?q=${site.mapsLat},${site.mapsLng}&z=17&output=embed`;

/** "Get directions" link. The API form lets Google use the visitor's location. */
export const mapDirectionsUrl =
  `https://www.google.com/maps/dir/?api=1&destination=${site.mapsLat},${site.mapsLng}`;
