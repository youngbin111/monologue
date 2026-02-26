import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SignInProcess from "./SignInProcess";
import { plainFetch } from "./api/fetchers";

jest.mock("./api/fetchers", () => ({
  plainFetch: jest.fn(),
}));

describe("SignInProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.REACT_APP_API_BASE_URL = "http://127.0.0.1:8000";
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
  });

  test("로그인 성공 시 토큰 저장 후 onLoginSuccess 호출", async () => {
    const onLoginSuccess = jest.fn();

    plainFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        tokens: {
          access: "access-token",
          refresh: "refresh-token",
        },
        user: {
          id: 1,
          username: "johndoe",
        },
      }),
    });

    render(
      <SignInProcess
        onLoginSuccess={onLoginSuccess}
        onGoSignUp={() => {}}
        onGoHome={() => {}}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("아이디"), {
      target: { value: "johndoe" },
    });
    fireEvent.change(screen.getByPlaceholderText("비밀번호"), {
      target: { value: "SecurePass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });

    expect(localStorage.getItem("accessToken")).toBe("access-token");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
    expect(JSON.parse(localStorage.getItem("currentUser"))).toEqual({
      id: 1,
      username: "johndoe",
    });
  });

  test("로그인 실패 시 에러 문구 표시", async () => {
    plainFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "아이디 또는 비밀번호가 틀렸습니다",
      }),
    });

    render(
      <SignInProcess
        onLoginSuccess={() => {}}
        onGoSignUp={() => {}}
        onGoHome={() => {}}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("아이디"), {
      target: { value: "wrong-user" },
    });
    fireEvent.change(screen.getByPlaceholderText("비밀번호"), {
      target: { value: "wrong-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("아이디 또는 비밀번호가 틀렸습니다");
    });
  });
});
