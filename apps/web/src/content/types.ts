// Shapes shared by the content files. Texts typed `Inline` may carry the inline-markdown subset that
// lib/inline.ts understands: **bold**, `code` and [text](href).
export type Inline = string;

// A link target: a path on this site ("/kontakt", "/#rodice"), a page of the platform ("app:/prihlaseni",
// resolved against the build's app URL by lib/href.ts), or an absolute URL.
export type Href = string;

export interface Cta {
  label: string;
  href: Href;
}

export interface Feature {
  title: string;
  text: Inline;
}

export interface FaqItem {
  question: string;
  answer: Inline;
}

export interface PageHero {
  eyebrow: string;
  title: string;
  lead: string;
}
