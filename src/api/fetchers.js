import { getAccessToken } from "../auth";

function mergeHeaders(baseHeaders = {}, extraHeaders = {}) {
  return {
    ...baseHeaders,
    ...extraHeaders,
  };
}

function getApiBase() {
  return (process.env.REACT_APP_API_BASE_URL ?? "").replace(/\/$/, "");
}

function toMyPostsLoginMessage(error, fallbackMessage) {
  const raw = String(error?.message ?? "");
  if (
    raw.includes("리프레시 토큰이 없습니다") ||
    raw.includes("다시 로그인") ||
    raw.includes("token_not_valid")
  ) {
    return "나의 독서록을 볼 수 없습니다. 로그인 해주세요";
  }
  return raw || fallbackMessage;
}

function normalizeBookSearchResult(item = {}) {
  return {
    id: item.id,
    title: item.title ?? "",
    author: item.author ?? "",
    cover: item.cover_image ?? null,
  };
}

function normalizeBookDetail(item = {}) {
  return {
    id: item.id,
    title: item.title ?? "",
    author: item.author ?? "",
    category: item.category ?? "",
    reviewScore: item.review_score ?? "",
    summary: item.summary ?? "",
    coverImage: item.cover_image ?? null,
    bookdata: item.bookdata ?? {},
  };
}

export function plainFetch(url, options = {}) {
  const {
    headers = {},
    ...rest
  } = options;

  return fetch(url, {
    ...rest,
    headers: mergeHeaders({}, headers),
  });
}

export async function searchBooks({ keyword, limit = 5, url } = {}) {
  const q = (keyword ?? "").trim();
  if (!q) {
    return {
      totalCount: 0,
      results: [],
    };
  }

  const baseUrl =
    url ??
    process.env.REACT_APP_BOOK_SEARCH_API_URL ??
    `${getApiBase()}/api/books/search`;
  const query = new URLSearchParams({
    keyword: q,
    limit: String(limit),
  });

  const response = await plainFetch(`${baseUrl}?${query.toString()}`, {
    method: "GET",
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "책 검색 요청에 실패했습니다.");
  }

  const searchResults = Array.isArray(data?.search_results) ? data.search_results : [];
  return {
    totalCount: data?.total_count ?? searchResults.length,
    results: searchResults.map(normalizeBookSearchResult),
  };
}

export async function fetchBookDetail({ id, url } = {}) {
  const bookId = `${id ?? ""}`.trim();
  if (!bookId) {
    throw new Error("책 id가 필요합니다.");
  }

  const baseUrl =
    url ??
    process.env.REACT_APP_BOOK_DETAIL_API_URL ??
    `${getApiBase()}/api/books/detail`;
  const query = new URLSearchParams({ id: bookId });

  const response = await plainFetch(`${baseUrl}?${query.toString()}`, {
    method: "GET",
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "책 상세 조회에 실패했습니다.");
  }

  return normalizeBookDetail(data ?? {});
}

export async function fetchBooksByCategory({ category, limit = 5, url } = {}) {
  const categoryCode = `${category ?? ""}`.trim();
  if (!categoryCode) {
    throw new Error("카테고리 값이 필요합니다.");
  }

  const baseUrl =
    url ??
    process.env.REACT_APP_BOOK_CATEGORY_API_URL ??
    `${getApiBase()}/api/books/category`;
  const query = new URLSearchParams({
    category: categoryCode,
    limit: String(limit),
  });

  const response = await plainFetch(`${baseUrl}?${query.toString()}`, {
    method: "GET",
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "카테고리 책 조회에 실패했습니다.");
  }

  const searchResults = Array.isArray(data?.search_results) ? data.search_results : [];
  return {
    totalCount: data?.total_count ?? searchResults.length,
    results: searchResults.map(normalizeBookSearchResult),
  };
}

export async function fetchMyPosts({ category, className, url } = {}) {
  const baseUrl = url ?? process.env.REACT_APP_MY_POSTS_API_URL ?? `${getApiBase()}/api/my-posts/`;
  const query = new URLSearchParams();

  if (category) query.set("category", String(category));
  if (className) query.set("className", String(className));

  const targetUrl = query.toString() ? `${baseUrl}?${query.toString()}` : baseUrl;
  let response;
  try {
    response = await authFetch(targetUrl, { method: "GET" });
  } catch (error) {
    throw new Error(toMyPostsLoginMessage(error, "내 독서록 목록을 불러오지 못했습니다."));
  }

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok) {
    const fieldErrors =
      data && typeof data === "object"
        ? Object.values(data).flat?.().join?.("\n")
        : "";
    throw new Error(
      fieldErrors ||
        data?.message ||
        data?.detail ||
        "내 독서록 목록을 불러오지 못했습니다."
    );
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchMyPostDetail({ id, category, className, url } = {}) {
  const postId = `${id ?? ""}`.trim();
  if (!postId) {
    throw new Error("독서록 id가 필요합니다.");
  }

  const baseUrl = url ?? process.env.REACT_APP_MY_POST_DETAIL_API_URL ?? `${getApiBase()}/api/my-posts`;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const query = new URLSearchParams();

  if (category) query.set("category", String(category));
  if (className) query.set("className", String(className));

  const detailUrl = `${normalizedBaseUrl}/${encodeURIComponent(postId)}/`;
  const targetUrl = query.toString() ? `${detailUrl}?${query.toString()}` : detailUrl;
  let response;
  try {
    response = await authFetch(targetUrl, { method: "GET" });
  } catch (error) {
    throw new Error(toMyPostsLoginMessage(error, "내 독서록 상세를 불러오지 못했습니다."));
  }

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok) {
    const fieldErrors =
      data && typeof data === "object"
        ? Object.values(data).flat?.().join?.("\n")
        : "";
    throw new Error(
      fieldErrors ||
        data?.message ||
        data?.detail ||
        "내 독서록 상세를 불러오지 못했습니다."
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error("독서록 상세 응답 형식이 올바르지 않습니다.");
  }

  return data;
}

export async function fetchPublicPosts({ url } = {}) {
  const targetUrl = url ?? process.env.REACT_APP_POSTS_LIST_API_URL ?? `${getApiBase()}/api/posts/`;
  const response = await plainFetch(targetUrl, { method: "GET" });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok) {
    const fieldErrors =
      data && typeof data === "object"
        ? Object.values(data).flat?.().join?.("\n")
        : "";
    throw new Error(
      fieldErrors ||
        data?.message ||
        data?.detail ||
        "타 독서록 목록을 불러오지 못했습니다."
    );
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchPublicPostDetail({ id, url } = {}) {
  const postId = `${id ?? ""}`.trim();
  if (!postId) {
    throw new Error("독서록 id가 필요합니다.");
  }

  const baseUrl = url ?? process.env.REACT_APP_POST_DETAIL_API_URL ?? `${getApiBase()}/api/posts`;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const targetUrl = `${normalizedBaseUrl}/${encodeURIComponent(postId)}/`;
  const response = await plainFetch(targetUrl, { method: "GET" });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok) {
    const fieldErrors =
      data && typeof data === "object"
        ? Object.values(data).flat?.().join?.("\n")
        : "";
    throw new Error(
      fieldErrors ||
        data?.message ||
        data?.detail ||
        "타 독서록 상세를 불러오지 못했습니다."
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error("타 독서록 상세 응답 형식이 올바르지 않습니다.");
  }

  return data;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("리프레시 토큰이 없습니다. 다시 로그인해주세요.");
  }

  const refreshUrl = `${getApiBase()}/api/accounts/token/refresh/`;
  const response = await plainFetch(refreshUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok || !data?.access) {
    throw new Error(data?.detail || "토큰 갱신에 실패했습니다.");
  }

  localStorage.setItem("accessToken", data.access);
  if (data?.refresh) {
    localStorage.setItem("refreshToken", data.refresh);
  }

  return data.access;
}

export async function authFetch(url, options = {}) {
  let token = getAccessToken();
  if (!token) {
    token = await refreshAccessToken();
  }

  const {
    headers = {},
    ...rest
  } = options;

  let response = await fetch(url, {
    ...rest,
    headers: mergeHeaders(
      {
        Authorization: `Bearer ${token}`,
      },
      headers
    ),
  });

  if (response.status === 401) {
    const refreshedAccessToken = await refreshAccessToken();
    response = await fetch(url, {
      ...rest,
      headers: mergeHeaders(
        {
          Authorization: `Bearer ${refreshedAccessToken}`,
        },
        headers
      ),
    });
  }

  return response;
}

export async function verifyToken() {
  const verifyUrl = `${getApiBase()}/api/accounts/verify-token/`;
  const response = await authFetch(verifyUrl, { method: "GET" });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.detail || data?.message || "토큰 검증에 실패했습니다.");
  }

  return data;
}
