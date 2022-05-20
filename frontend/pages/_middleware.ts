import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function middleware(req: NextRequest) {
  /* create a new story */
  if (req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/story";
    url.searchParams.set("id", uuidv4());
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
