import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { authFetch, verifyToken } from "./api/fetchers";

jest.mock("./api/fetchers", () => ({
  authFetch: jest.fn(),
  verifyToken: jest.fn(),
}));

describe("App logout flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.REACT_APP_API_BASE_URL = "http://127.0.0.1:8000";
    jest.spyOn(window, "confirm").mockReturnValue(true);
    jest.spyOn(window, "alert").mockImplementation(() => {});

    localStorage.setItem("accessToken", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");
    localStorage.setItem("currentUser", JSON.stringify({ username: "johndoe" }));
  });

  afterEach(() => {
    window.confirm.mockRestore();
    window.alert.mockRestore();
  });

  test("로그아웃 성공 시 로컬스토리지 정리", async () => {
    verifyToken.mockResolvedValue({
      success: true,
      user: { id: 1, username: "johndoe" },
    });
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "로그아웃되었습니다" }),
    });

    render(<App />);

    const logoutButton = await screen.findByRole("button", { name: "로그아웃" });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("currentUser")).toBeNull();
    });
  });

  test("로그아웃 실패 시에도 로컬스토리지 정리", async () => {
    verifyToken.mockResolvedValue({
      success: true,
      user: { id: 1, username: "johndoe" },
    });
    authFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Authentication credentials were not provided." }),
    });

    render(<App />);

    const logoutButton = await screen.findByRole("button", { name: "로그아웃" });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("currentUser")).toBeNull();
    });
  });
});
