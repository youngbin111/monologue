// 공용 인증 유틸
// - JSX/CSS 프로젝트에서도 이런 공용 로직은 JS 파일로 분리하는 방식이 맞습니다.

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

/**
 * 인증이 필요한 화면/동작에서 호출하는 가드 함수
 * @param {Object} options
 * @param {string} [options.message] 인증 실패 시 노출할 메시지
 * @param {Function} [options.onFail] 인증 실패 시 실행할 콜백 (예: 로그인 화면으로 이동)
 * @returns {boolean} 통과 여부
 */
export function requireAuth(options = {}) {
  const {
    message = "로그인이 필요한 기능입니다.",
    onFail,
  } = options;

  if (isAuthenticated()) return true;

  alert(message);
  if (typeof onFail === "function") onFail();
  return false;
}

/**
 * 인증 통과 시에만 동작을 실행하고 싶을 때 사용하는 헬퍼
 */
export function runWithAuth(action, options = {}) {
  if (!requireAuth(options)) return false;
  if (typeof action === "function") action();
  return true;
}
