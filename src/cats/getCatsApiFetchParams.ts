//let API_KEY = "1a2691b0-d86c-41c1-b968-3b264d96ff7";
let API_KEY = "DEMO-API-KEY";
const API_VERSION = "1";
const SERVER = "api.thecatapi.com";

export default function getCatsApiFetchParams(
  path: string,
  queryParams: Record<string, string> = {},
  slowMillis?: number
): { url: string; options: RequestInit } {
  const params = new URLSearchParams(queryParams);
  let url = new URL(`/v${API_VERSION}${path}`, `https://${SERVER}`).toString();

  if (Number.isInteger(slowMillis)) {
    url = `https://deelay.me/${slowMillis}/${url}`;
  }

  return {
    url: `${url}?${params}`,
    options: {
      headers: { "x-api-key": API_KEY },
    },
  };
}
