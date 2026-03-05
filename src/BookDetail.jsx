import { useEffect, useMemo, useState } from "react";
import "./BookDetail.css";
import { fetchBookDetail } from "./api/fetchers";

// onBack: 목록이나 홈으로 돌아가는 함수
// onOpenReview: 리뷰 카드 클릭 시 상세 독백(5번)으로 이동하는 함수
export default function BookDetail({ onOpenReview, onBack, bookId }) {
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const effectiveBookId = useMemo(() => {
    const fromProp = `${bookId ?? ""}`.trim();
    if (fromProp) return fromProp;
    return `${localStorage.getItem("selectedBookId") ?? ""}`.trim();
  }, [bookId]);

  useEffect(() => {
    let isCancelled = false;

    if (!effectiveBookId) {
      setBook(null);
      setErrorMessage("상세 조회할 책 id가 없습니다.");
      setIsLoading(false);
      return;
    }

    const run = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const detail = await fetchBookDetail({ id: effectiveBookId });
        if (isCancelled) return;
        setBook(detail);
      } catch (error) {
        if (isCancelled) return;
        setBook(null);
        setErrorMessage(error.message || "책 상세 조회 중 오류가 발생했습니다.");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [effectiveBookId]);

  const reviewScore = Number.parseFloat(book?.reviewScore ?? "0");
  const starCount = Number.isFinite(reviewScore)
    ? Math.max(0, Math.min(5, Math.round(reviewScore)))
    : 0;

  return (
    <div className="bookDetail-inline-container">
      {/* 뒤로 가기 버튼 */}
      <button className="bookDetail-back-btn" onClick={onBack}>
        ← 돌아가기
      </button>

      {isLoading && <div className="bookDetail-state">책 정보를 불러오는 중...</div>}
      {!isLoading && errorMessage && <div className="bookDetail-error">{errorMessage}</div>}
      {!isLoading && !errorMessage && !book && (
        <div className="bookDetail-state">표시할 책 정보가 없습니다.</div>
      )}

      {!isLoading && !errorMessage && book && <div className="bookDetail-flex-wrapper">
        {/* 왼쪽 책 표지 */}
        <div className="bookDetail-cover">
          <img
            src={book.coverImage || "http://monologue.ehdgus.com/api/img/S000216796615.jpg"}
            alt={`${book.title} 표지`}
          />
        </div>

        {/* 오른쪽 내용 */}
        <div className="bookDetail-content">
          <div className="bookDetail-header">
            <h1>{book.title}</h1>
            <span className="author">{book.author}</span>
          </div>

          <div className="stars">{Array.from({ length: 5 }).map((_, idx) => (idx < starCount ? "★" : "☆")).join("")} {book.reviewScore ? `(${book.reviewScore})` : ""}</div>

          <p className="bookDetail-desc">
            {book.summary || "책 소개 정보가 없습니다."}
          </p>

          <div className="bookMetaGrid">
            <div><strong>카테고리</strong> {book.category || "-"}</div>
            <div><strong>ISBN</strong> {book.bookdata?.isbn || "-"}</div>
            <div><strong>출간일</strong> {book.bookdata?.pub_date || "-"}</div>
            <div><strong>페이지</strong> {book.bookdata?.page_count || "-"}</div>
          </div>

          <div className="divider" />

          <h2 className="section-title">이 책의 인기 독백</h2>

          {/* 리뷰 카드들 */}
          <div className="review-list">
            <div className="review-card" onClick={onOpenReview}>
              <p>
                담담한 문장인데도 마음을 파고드는 순간이 많았다.
                평범해 보이던 일상이 어느 순간 낯설고 무섭게 느껴졌다…
              </p>
              <span className="review-user">user dtpm***</span>
            </div>

            <div className="review-card" onClick={onOpenReview}>
              <p>
                짧은 이야기들이 모여 하나의 감정을 만든다.
                읽고 나면 나 자신을 돌아보게 되는 책이었다.
              </p>
              <span className="review-user">user ash</span>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
