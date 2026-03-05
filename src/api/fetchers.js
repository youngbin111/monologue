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

export async function checkUsernameAvailability({ username, url } = {}) {
  const trimmedUsername = (username ?? "").trim();
  if (!trimmedUsername) {
    throw new Error("아이디를 입력해주세요.");
  }

  const baseUrl =
    url ??
    process.env.REACT_APP_CHECK_USERNAME_API_URL ??
    `${getApiBase()}/api/accounts/check-username/`;
  const query = new URLSearchParams({
    username: trimmedUsername,
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

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.detail || "아이디 중복확인에 실패했습니다.");
  }

  const parseBool = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return null;
  };

  const availableFromResponse = parseBool(data?.available);
  const existsFromResponse = parseBool(data?.exists);
  const messageText = String(data?.message ?? "");
  const inferredFromMessage =
    messageText.includes("사용 가능한") ? true : messageText.includes("이미 사용") ? false : null;
  const resolvedAvailable =
    availableFromResponse !== null
      ? availableFromResponse
      : existsFromResponse !== null
        ? !existsFromResponse
        : inferredFromMessage !== null
          ? inferredFromMessage
          : false;
  const resolvedExists =
    existsFromResponse !== null ? existsFromResponse : !resolvedAvailable;

  return {
    success: true,
    available: resolvedAvailable,
    exists: resolvedExists,
    message: data?.message || "",
  };
}

export async function findAccountId({ name, phone, url } = {}) {
  const trimmedName = (name ?? "").trim();
  const trimmedPhone = (phone ?? "").trim();

  if (!trimmedName || !trimmedPhone) {
    throw new Error("이름과 전화번호를 모두 입력해주세요.");
  }

  const targetUrl = url ?? process.env.REACT_APP_FIND_ID_API_URL ?? `${getApiBase()}/api/accounts/find-id/`;
  const response = await plainFetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: trimmedName,
      phone: trimmedPhone,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.detail || "아이디 찾기 요청에 실패했습니다.");
  }

  return {
    success: true,
    username: data?.username ?? "",
    message: data?.message ?? "아이디를 찾았습니다",
  };
}

export async function requestPasswordReset({ email, url } = {}) {
  const trimmedEmail = (email ?? "").trim();
  if (!trimmedEmail) {
    throw new Error("이메일을 입력해주세요.");
  }

  const targetUrl =
    url ??
    process.env.REACT_APP_PASSWORD_RESET_API_URL ??
    `${getApiBase()}/api/accounts/password-reset/`;

  const response = await plainFetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: trimmedEmail,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.detail || "비밀번호 재설정 요청에 실패했습니다.");
  }

  return {
    success: true,
    message:
      data?.message ||
      "비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.",
  };
}

export async function confirmPasswordReset({
  uidb64,
  token,
  newPassword,
  newPassword2,
  url,
} = {}) {
  const encodedUid = `${uidb64 ?? ""}`.trim();
  const encodedToken = `${token ?? ""}`.trim();

  if (!encodedUid || !encodedToken) {
    throw new Error("유효하지 않거나 만료된 링크입니다");
  }

  if (!newPassword || !newPassword2) {
    throw new Error("새 비밀번호를 모두 입력해주세요.");
  }

  const targetUrl =
    url ??
    `${getApiBase()}/api/accounts/password-reset-confirm/${encodeURIComponent(encodedUid)}/${encodeURIComponent(encodedToken)}/`;

  const response = await plainFetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      new_password: newPassword,
      new_password2: newPassword2,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  if (!response.ok || data?.success === false) {
    const fieldErrors = data?.errors ? Object.values(data.errors).flat().join("\n") : "";
    throw new Error(
      fieldErrors ||
      data?.message ||
      data?.detail ||
      "비밀번호 재설정에 실패했습니다."
    );
  }

  return {
    success: true,
    message:
      data?.message ||
      "비밀번호가 성공적으로 재설정되었습니다. 새 비밀번호로 로그인해주세요.",
  };
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
  const baseUrl = url ?? process.env.REACT_APP_MY_POSTS_API_URL ?? `${getApiBase()}/api/posts/my-posts/`;
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

  if (Array.isArray(data)) {
    return data;
  }

  // Support paginated/object list responses from backend.
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  if (Array.isArray(data?.posts)) {
    return data.posts;
  }

  return [];
}

export async function fetchMyPostDetail({ id, category, className, url } = {}) {
  const postId = `${id ?? ""}`.trim();
  if (!postId) {
    throw new Error("독서록 id가 필요합니다.");
  }

  const baseUrl = url ?? process.env.REACT_APP_MY_POST_DETAIL_API_URL ?? `${getApiBase()}/api/posts/my-posts`;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const query = new URLSearchParams();

  if (category) query.set("category", String(category));
  if (className) query.set("className", String(className));

  const detailUrl = `${normalizedBaseUrl}/${encodeURIComponent(postId)}/`;
  const targetUrl = query.toString() ? `${detailUrl}?${query.toString()}` : detailUrl;
  let response;
  let data = null;
  try {
    response = await authFetch(targetUrl, { method: "GET" });
  } catch (error) {
    throw new Error(toMyPostsLoginMessage(error, "내 독서록 상세를 불러오지 못했습니다."));
  }

  try {
    data = await response.json();
  } catch (parseError) {
    data = null;
  }

  // Some backends may not provide /api/my-posts/{id}/ and expose /api/posts/{id}/ only.
  if (response.status === 404) {
    const postsBase = process.env.REACT_APP_POST_DETAIL_API_URL ?? `${getApiBase()}/api/posts`;
    const normalizedPostsBase = postsBase.endsWith("/") ? postsBase.slice(0, -1) : postsBase;
    const fallbackUrl = `${normalizedPostsBase}/${encodeURIComponent(postId)}/`;

    try {
      const fallbackResponse = await authFetch(fallbackUrl, { method: "GET" });
      let fallbackData = null;
      try {
        fallbackData = await fallbackResponse.json();
      } catch (parseError) {
        fallbackData = null;
      }

      if (fallbackResponse.ok && fallbackData && typeof fallbackData === "object") {
        return fallbackData;
      }
    } catch (fallbackError) {
      // Keep original 404 handling below.
    }
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

async function tryParseJson(response) {
  try {
    return await response.json();
  } catch (parseError) {
    return null;
  }
}

function extractApiErrorMessage(data, fallback) {
  const fieldErrors =
    data && typeof data === "object"
      ? Object.values(data).flat?.().join?.("\n")
      : "";

  return fieldErrors || data?.message || data?.detail || fallback;
}

async function mutateMyPostWithFallback({ id, method, payload, url, fallbackUrl, fallbackErrorMessage }) {
  const postId = `${id ?? ""}`.trim();
  if (!postId) {
    throw new Error("독서록 id가 필요합니다.");
  }

  const myPostsBase = url ?? process.env.REACT_APP_MY_POST_DETAIL_API_URL ?? `${getApiBase()}/api/posts/my-posts`;
  const normalizedMyPostsBase = myPostsBase.endsWith("/") ? myPostsBase.slice(0, -1) : myPostsBase;
  const myPostsTargetUrl = `${normalizedMyPostsBase}/${encodeURIComponent(postId)}/`;

  const postsBase = fallbackUrl ?? process.env.REACT_APP_POST_DETAIL_API_URL ?? `${getApiBase()}/api/posts`;
  const normalizedPostsBase = postsBase.endsWith("/") ? postsBase.slice(0, -1) : postsBase;
  const postsTargetUrl = `${normalizedPostsBase}/${encodeURIComponent(postId)}/`;

  const requestOptions = {
    method,
    headers: payload
      ? {
          "Content-Type": "application/json",
        }
      : {},
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  };

  let response;
  try {
    response = await authFetch(myPostsTargetUrl, requestOptions);
  } catch (error) {
    throw new Error(toMyPostsLoginMessage(error, fallbackErrorMessage));
  }

  let data = await tryParseJson(response);
  if (response.ok) {
    return data;
  }

  // Backends without /api/my-posts/{id}/ may only expose /api/posts/{id}/.
  if (response.status === 404) {
    const fallbackResponse = await authFetch(postsTargetUrl, requestOptions);
    const fallbackData = await tryParseJson(fallbackResponse);
    if (fallbackResponse.ok) {
      return fallbackData;
    }

    throw new Error(extractApiErrorMessage(fallbackData, fallbackErrorMessage));
  }

  throw new Error(extractApiErrorMessage(data, fallbackErrorMessage));
}

export async function updateMyPost({ id, payload, url, fallbackUrl } = {}) {
  const updatePayload = payload ?? {};
  const data = await mutateMyPostWithFallback({
    id,
    method: "PATCH",
    payload: updatePayload,
    url,
    fallbackUrl,
    fallbackErrorMessage: "독서록 수정에 실패했습니다.",
  });

  if (!data || typeof data !== "object") {
    throw new Error("독서록 수정 응답 형식이 올바르지 않습니다.");
  }

  return data;
}

export async function deleteMyPost({ id, url, fallbackUrl } = {}) {
  await mutateMyPostWithFallback({
    id,
    method: "DELETE",
    payload: null,
    url,
    fallbackUrl,
    fallbackErrorMessage: "독서록 삭제에 실패했습니다.",
  });

  return true;
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
        "ngrok-skip-browser-warning": "69420",
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
          "ngrok-skip-browser-warning": "69420",
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
