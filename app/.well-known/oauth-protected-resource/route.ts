import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    resource:
      "https://open-dart-mcp-server-taupe.vercel.app/api/mcp",

    authorization_servers: [
      "https://fond-fruit-29-staging.authkit.app",
    ],

    bearer_methods_supported: ["header"],
  });
}
