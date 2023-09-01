import { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

export function middleware(request: NextRequest) {
  console.log(request);
}
