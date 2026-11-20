// The fields of the form on /weby-pro-tabory, shared by the page's script and the Worker so both accept
// the same. No Zod here: the page's script imports this file.
export const webyLimits = {
  url: { max: 300 },
  email: { max: 254 },
} as const;

// A website's address, with or without its scheme: "www.tabor-priklad.cz", "https://tabor-priklad.cz/o-nas".
// Written once for both uses: the input's `pattern` attribute anchors it itself and reads it with the
// `v` flag, where a "/" in a character class must be escaped.
export const websitePatternAttribute = String.raw`(https?:\/\/)?[^\s.\/]+(\.[^\s.\/]+)+(\/\S*)?`;
export const websitePattern = new RegExp(`^${websitePatternAttribute}$`);

// An e-mail address as the page checks it before sending; the Worker checks it again with Zod.
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
