import { render, screen } from "@testing-library/react";
import MyDokbaekList from "./MyDokbaekList";
import { fetchMyPosts } from "./api/fetchers";

jest.mock("./api/fetchers", () => ({
  fetchMyPosts: jest.fn(),
}));

describe("MyDokbaekList error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("목록 API 실패 시 에러 문구를 보여준다", async () => {
    fetchMyPosts.mockRejectedValue(new Error("나의 독서록을 볼 수 없습니다. 로그인 해주세요"));

    render(<MyDokbaekList onOpenPostDetail={() => {}} onWriteDokbaek={() => {}} />);

    expect(
      await screen.findByText("나의 독서록을 볼 수 없습니다. 로그인 해주세요")
    ).toBeInTheDocument();
  });
});
