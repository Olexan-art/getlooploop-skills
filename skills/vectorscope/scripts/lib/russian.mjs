// The four letters that exist in Russian and not in Ukrainian (yeru, hard sign, e, yo), as
// escapes so no source file holds them. One of them in a judgement file is a refusal: this
// product does not publish Russian, and correct Ukrainian never contains any of the four.
export const RUSSIAN_ONLY = /[\u044b\u044a\u044d\u0451]/i;
