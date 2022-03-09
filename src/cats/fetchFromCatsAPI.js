let API_KEY = "1a2691b0-d86c-41c1-b968-3b264d96ff7";
//API_KEY = "DEMO-API-KEY";
const API_VERSION = "1";
const SERVER = "api.thecatapi.com";
const DELAY_URL = "https://deelay.me/3000/";

const fetchFromCatsAPI = async (path, params = {}, options = {}, isSlow) => {
  const queryParams = new URLSearchParams(params);
  let url = new URL(`/v${API_VERSION}${path}`, `https://${SERVER}`);

  if (isSlow) {
    url = DELAY_URL + url;
  }

  const response = await fetch(`${url}?${queryParams}`, {
    ...options,
    headers: { "x-api-key": API_KEY },
  });

  if (!response.ok) {
    throw new Error("API call failed");
  }

  return {
    json: await response.json(),
    pagination: {
      count: response.headers.get("Pagination-Count"),
      page: response.headers.get("Pagination-Page"),
    },
  };
};

export default fetchFromCatsAPI;
