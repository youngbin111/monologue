import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MyDokbaekList from "./MyDokbaekList";
import MyPostDetail from "./MyPostDetail";
import { fetchMyPostDetail, fetchMyPosts } from "./api/fetchers";

jest.mock("./api/fetchers", () => ({
  fetchMyPosts: jest.fn(),
  fetchMyPostDetail: jest.fn(),
}));

describe("My post pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("내 독서록 목록 렌더링 후 카드 클릭 시 id 전달", async () => {
    const onOpenPostDetail = jest.fn();

    fetchMyPosts.mockResolvedValue([
      {
        id: 10,
        book_title: "해리포터",
        content: "정말 재밌었다.",
        created_at: "2026-02-12T18:00:00",
        is_public: true,
      },
    ]);

    render(
      <MyDokbaekList
        onOpenPostDetail={onOpenPostDetail}
        onWriteDokbaek={() => {}}
      />
    );

    expect(
      await screen.findByRole("button", { name: "해리포터 독서록 상세 보기" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "해리포터 독서록 상세 보기" }));

    expect(onOpenPostDetail).toHaveBeenCalledWith(10);
  });

  test("내 독서록 상세에서 API 응답 렌더링", async () => {
    fetchMyPostDetail.mockResolvedValue({
      id: 2,
      user: "book_lover",
      book_title: "채식주의자",
      content: "한강 작가님의...",
      created_at: "2026-02-12T19:00:00",
      is_public: true,
    });

    render(<MyPostDetail postId="2" onBack={() => {}} />);

    await waitFor(() => {
      expect(fetchMyPostDetail).toHaveBeenCalledWith({ id: "2" });
    });

    expect(await screen.findByText("채식주의자")).toBeInTheDocument();
    expect(screen.getByText("한강 작가님의...")).toBeInTheDocument();
    expect(screen.getByText("book_lover")).toBeInTheDocument();
    expect(screen.getByText("공개")).toBeInTheDocument();
  });
});
