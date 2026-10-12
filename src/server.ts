import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const TOKENBASE_DEFAULT_URL = "https://tokenbase.pimaxer.in";

const DEFAULT_COOKIES =
  "__stripe_mid=6ccb5494-0557-46e4-99ff-137736ccc58d79e324; cf_clearance=qkzaFY71382fP1jC9AWZwm.WEKJvIfZCLNPFo1ZeFVs-1782556607-1.2.1.1-knfL3uOpZZb0BXPSfbAnP35939mzb2T4JwmRJNK6lCDrCFMumUtHpLBNpHLu9YHkILy3LMfO_t4eoTblezeJeu0EcrjYZwUmjIAkdX46gue4IH_0d.BH9pDSUPoVyAfsavql8.fkSALc1lfgX3G.vGrIznXtAKXuHgjyk3Lbz8AdOxiqbjcBIOAdp8QK4pRoy8iNKIG2lugULGHpzLjnc4H2goUt5fUBqgvR6gWCG4CyqatQddd_bQUk7xCYGkzpsBnbXsIEJEqaXmkxElDHtATKpXwEFVI_MSmFgz30rx18fLaW1nGgnOleWAQtloruMSwbCXWskPvl3xim6fjPRDS3W3aZaqM01dsuiZW5weMfYvoBWNOFVxXPwzDt3EUUDQnKxwERAuUi4nlD_xSNApDL._z7zorJNNsG9QmzOcIEss17.1CWmn.IyLLm1xBc88beAt7pt2MmebJ7csD5mp6mVTisv9cXYMfE3waHV.3UNjvLiu_MozUOXcNM_4Ex; ph_phc_ItizB1dP6yv7ZYobbcqrpxTdbomDA8hJFSEmAMdYvIr_posthog=%7B%22distinct_id%22%3A%2201a0b5ae-7658-7d0f-ba20-c38016658757%22%2C%22%24sesid%22%3A%5B1789755841897%2C%2201a0b5ae-9133-73dc-93f7-4e8730d8fdba%22%2C1789754511605%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22%24direct%22%2C%22u%22%3A%22https%3A%2F%2Fpimaxer.in%2Fauth%2Flogin%22%7D%7D";

function getProxyHeaders(incomingRequest: Request): Record<string, string> {
  const incomingCookie = incomingRequest.headers.get("cookie");
  return {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    origin: "https://tokenbase.pimaxer.in",
    referer: "https://tokenbase.pimaxer.in/",
    priority: "u=1, i",
    "sec-ch-ua": '"Microsoft Edge";v="155", "Chromium";v="155", "Not(A:Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0",
    cookie: incomingCookie ? `${DEFAULT_COOKIES}; ${incomingCookie}` : DEFAULT_COOKIES,
  };
}

async function handleApiAuth(request: Request, env: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const envObj = (env && typeof env === "object" ? env : {}) as Record<string, string | undefined>;
  const upstreamBase = (
    envObj["TOKENBASE_API_URL"] ||
    process.env["TOKENBASE_API_URL"] ||
    TOKENBASE_DEFAULT_URL
  ).replace(/\/+$/, "");

  if (pathname === "/api/get-otp") {
    try {
      const phoneParam =
        url.searchParams.get("number") ||
        url.searchParams.get("phone") ||
        url.searchParams.get("username") ||
        "";

      const targetUrl = new URL(
        `${upstreamBase}/api/get-otp?number=${encodeURIComponent(phoneParam)}`,
      );
      const headers = getProxyHeaders(request);
      headers["content-length"] = "0";

      const res = await fetch(targetUrl.toString(), {
        method: "POST",
        headers,
      });

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
      });
    } catch (e) {
      console.error("Upstream get-otp error:", e);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to connect to authentication server. Please try again.",
        }),
        {
          status: 502,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  if (pathname === "/api/login") {
    try {
      const targetUrl = new URL(`${upstreamBase}/api/login`);
      const bodyText = await request.clone().text();

      let username = "";
      let otp = "";
      try {
        const parsed = JSON.parse(bodyText);
        username = String(parsed.username || parsed.phone || parsed.number || "").trim();
        otp = String(parsed.otp || parsed.code || "").trim();
      } catch {
        // fallback
      }

      const payload = JSON.stringify({ username, otp });
      const headers = getProxyHeaders(request);

      const res = await fetch(targetUrl.toString(), {
        method: "POST",
        headers,
        body: payload,
      });

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
      });
    } catch (e) {
      console.error("Upstream login error:", e);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to connect to authentication server. Please try again.",
        }),
        {
          status: 502,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const apiResponse = await handleApiAuth(request, env);
      if (apiResponse) {
        return apiResponse;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
