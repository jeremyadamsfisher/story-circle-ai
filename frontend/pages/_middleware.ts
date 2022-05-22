import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  /* create a new story */
  if (req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/story";
    const uuid = crypto.randomUUID();
    url.searchParams.set("id", uuid);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
