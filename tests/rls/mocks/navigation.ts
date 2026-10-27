// Stand-in for "next/navigation": redirect/notFound throw like the real ones
// so tests can assert on the destination.
export class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

export function redirect(url: string): never {
  throw new RedirectError(url);
}

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}
