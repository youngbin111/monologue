import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MyDokbaek from "./MyDokbaek";
import { authFetch } from "./api/fetchers";

jest.mock("./api/fetchers", () => ({
  authFetch: jest.fn(),
  searchBooks: jest.fn(),
}));

describe("MyDokbaek", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.REACT_APP_API_BASE_URL = "http://127.0.0.1:8000";
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
  });

  test("독서록 저장 성공 시 onFinish 호출 및 한줄 단어 저장", async () => {
    const onFinish = jest.fn();

    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        book_title: "아몬드",
      }),
    });

    render(<MyDokbaek onFinish={onFinish} />);

    fireEvent.click(screen.getByLabelText("책 검색 및 선택"));
    fireEvent.click(screen.getByRole("button", { name: /아몬드 표지/ }));

    fireEvent.change(
      screen.getByPlaceholderText("#해시태그 #한줄평 (예: #여운가득 #문장맛집)"),
      {
        target: { value: "#여운가득 #문장맛집" },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText("오늘의 독서록을 작성해주세요. (자유롭게 길게 써도 돼요)"),
      {
        target: { value: "정말 인상 깊게 읽었습니다." },
      }
    );

    fireEvent.click(screen.getByRole("button", { name: "독백 종료" }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    expect(localStorage.getItem("myDokbaekOneLineWord")).toBe("여운가득");
    expect(window.alert).toHaveBeenCalledWith("저장되었습니다!");
  });
});
