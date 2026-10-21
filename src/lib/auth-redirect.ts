/** Only application paths may be used as post-login destinations. */
export function getReturnPath(value: string | null | undefined): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }
  try {
    const url = new URL(value, "https://perki.invalid");
    const path = decodeURIComponent(url.pathname);
    if (
      url.origin !== "https://perki.invalid" ||
      path.startsWith("//") ||
      path.includes("\\") ||
      path === "/auth" ||
      path.startsWith("/auth/") ||
      path === "/api" ||
      path.startsWith("/api/")
    ) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function authPageUrl(
  page: "signin" | "signup",
  returnPath: string
): string {
  const path = getReturnPath(returnPath);
  return path === "/"
    ? `/auth/${page}`
    : `/auth/${page}?${new URLSearchParams({ callbackUrl: path })}`;
}

export type PageSearchParams = Record<string, string | string[] | undefined>;

export function requestedPath(
  path: string,
  searchParams: PageSearchParams
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) {
        query.append(key, item);
      }
    }
  }
  return query.size ? `${path}?${query}` : path;
}

/** AuthJS stores absolute callback URLs; only recover those on our origin. */
export function getSameOriginReturnPath(
  value: string | undefined,
  origin: string
): string {
  if (!value) {
    return "/";
  }
  try {
    const base = new URL(origin.includes("://") ? origin : `https://${origin}`);
    const url = new URL(value, base);
    return url.origin === base.origin
      ? getReturnPath(`${url.pathname}${url.search}${url.hash}`)
      : "/";
  } catch {
    return "/";
  }
}

/** The welcome step, returning to `returnPath` (or `/`) afterwards. */
export function welcomePath(returnPath: string): string {
  const path = getReturnPath(returnPath);
  return path === "/"
    ? "/welcome"
    : `/welcome?${new URLSearchParams({ callbackUrl: path })}`;
}
