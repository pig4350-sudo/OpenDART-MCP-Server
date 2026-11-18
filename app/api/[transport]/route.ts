import { createMcpHandler } from "mcp-handler";
import { registerAllTools } from "@/lib/tools";
import { runWithRequestApiKey } from "@/lib/opendart/client";

const mcpHandler = createMcpHandler(
  (server) => {
    registerAllTools(server);
  },
  {
    capabilities: {},
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  }
);


async function handler(req: Request) {
  const issuer = "https://fond-fruit-29-staging.authkit.app";

  const resource =
    "https://open-dart-mcp-server-taupe.vercel.app/api/mcp";

  const metadata =
    "https://open-dart-mcp-server-taupe.vercel.app/.well-known/oauth-protected-resource";

  const unauthorized = () =>
    new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate":
            `Bearer resource_metadata="${metadata}"`,
        },
      }
    );

  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return unauthorized();
  }

  const token = authorization.slice(7);

  try {
    const { jwtVerify, createRemoteJWKSet } =
      await import("jose");

    const jwks = createRemoteJWKSet(
      new URL(`${issuer}/oauth2/jwks`)
    );

    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: resource,
    });

    if (
      payload.sub !== process.env.WORKOS_ALLOWED_USER_ID ||
      payload.sub_profile === "ai_agent"
    ) {
      return unauthorized();
    }

    return runWithRequestApiKey(
      undefined,
      () => mcpHandler(req)
    );
  } catch {
    return unauthorized();
  }
}


// Without an explicit HEAD export, Next.js routes HEAD to the GET handler and
// mcp-handler never finishes the response, so the function hangs until its
// timeout. Answer HEAD immediately with the same 405 that GET returns.
function head() {
  return new Response(null, { status: 405, headers: { Allow: "POST, DELETE" } });
}

export { handler as GET, handler as POST, handler as DELETE, head as HEAD };
