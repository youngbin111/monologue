import { render, screen } from "@testing-library/react";
import OthersDokbaek from "./OthersDokbaek";
import { fetchPublicPostDetail } from "./api/fetchers";

jest.mock("./api/fetchers", () => ({
  fetchPublicPostDetail: jest.fn(),
}));

describe("OthersDokbaek error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("타 독서록 상세 API 실패 시 에러 문구를 보여준다", async () => {
    fetchPublicPostDetail.mockRejectedValue(new Error("타 독서록 상세를 불러오지 못했습니다."));

    render(<OthersDokbaek postId="2" onGoSignUp={() => {}} onOpenBook={() => {}} />);

    expect(await screen.findByText("타 독서록 상세를 불러오지 못했습니다.")).toBeInTheDocument();
  });
});
