import { type NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function middleware(request: NextRequest) { }
