/**
 * Single source of truth for the organisation's public contact details.
 *
 * These were previously copy-pasted between the footer and the contact page,
 * where the address appeared three more times inside map URLs. Correcting the
 * phone number in one place left the others stale — and the copy in the footer
 * is the one a visitor is most likely to read and act on.
 *
 * `phone` is still the placeholder it has always been. Replace it here and every
 * rendered surface follows.
 */
export const site = {
  organisation: 'Yemisrach Dimts Communication Service',
  shortName: 'YDCS',
  address: 'XPCJ+8Q9, Guinea Bissau St, Addis Ababa, Ethiopia',
  email: 'info@yemisrachdimts.org',
  /** As displayed to a reader. */
  phone: '+251 (0) 11 123 4567',
  /**
   * Dialable form for `tel:`. Stripped of spaces, punctuation and the
   * international trunk prefix, which diallers reject.
   */
  phoneHref: '+251111234567',
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
