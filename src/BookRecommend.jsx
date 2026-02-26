import { useEffect, useMemo, useState } from "react";
import "./BookRecommend.css";
import BookSearchModal from "./BookSearchModal";
import { fetchBooksByCategory } from "./api/fetchers";

/**
 * props
 * - onGoMyDokbaek(): 나의 독백 이동
 * - onGoSignUp(): 홈으로 이동
 * - onOpenBookDetail(): 책 표지 클릭 시 상세 이동
 */
export default function BookRecommend({
  onGoMyDokbaek,
  onGoSignUp,
  onOpenBookDetail,
  preferredCategoryCode = "01",
  isLoggedIn = false,
}) {
  // 책 데이터 목록
  const books = useMemo(
    () => [
      {
        id: "b1",
        title: "자유의 날개",
        cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "b2",
        title: "여름을 한 입 베어 물었더니",
        cover: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "b3",
        title: "시창작개론",
        cover: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "b4",
        title: "토마토 달려면",
        cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
      },
    ],
    []
  );

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const quoteText = useMemo(() => {
    if (!isLoggedIn) return "";

    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem("currentUser") ?? "null");
    } catch (error) {
      currentUser = null;
    }

    const loginId =
      currentUser?.username ||
      currentUser?.id ||
      currentUser?.nickname ||
      currentUser?.name ||
      "";
    if (!loginId) return "";

    const word = localStorage.getItem("myDokbaekOneLineWord") || "오늘의";
    return `‘${word}’ ${loginId}님께`;
  }, [isLoggedIn]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        setIsCategoryLoading(true);
        setCategoryError("");
        const result = await fetchBooksByCategory({
          category: preferredCategoryCode,
          limit: 5,
        });
        if (isCancelled) return;
        setCategoryBooks(result.results);
      } catch (error) {
        if (isCancelled) return;
        setCategoryBooks([]);
        setCategoryError(error.message || "추천 도서를 불러오지 못했습니다.");
      } finally {
        if (!isCancelled) {
          setIsCategoryLoading(false);
        }
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [preferredCategoryCode]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return books
      .filter((b) => b.title.toLowerCase().includes(q))
      .slice(0, 6);
  }, [books, query]);

  const pickBook = (book) => {
    setPicked(book);
    setQuery(book.title);
  };

  const recommendedBooks = categoryBooks.length > 0 ? categoryBooks : books;

  const carouselBooks = useMemo(() => {
    const base = recommendedBooks;
    if (!picked) return base;
    const rest = base.filter((b) => b.id !== picked.id);
    return [rest[0], picked, rest[1], rest[2]].filter(Boolean);
  }, [recommendedBooks, picked]);

  return (
    <div className="br-container-inline">
      {/* 사이드바(aside)는 SignUpProcess에서 담당하므로 삭제되었습니다. 
         기존 br-main 영역만 렌더링합니다.
      */}
      <main className="br-main">
        <header className="br-header">
          {quoteText ? <div className="br-quote">{quoteText}</div> : <div className="br-quote" />}

          <div className="br-searchWrap">
            <div className="br-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="보고 싶은 책을 입력해주세요"
              />
              <button
                className="br-searchBtn"
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
              >
                🔍
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="br-suggest">
                {suggestions.map((b) => (
                  <button
                    key={b.id}
                    className="br-suggestItem"
                    type="button"
                    onClick={() => pickBook(b)}
                  >
                    {b.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* 섹션 1: 장르 추천 */}
        <section className="br-section">
          <h3 className="br-title">독백님이 좋아하는 로맨스/성장 소설이에요!</h3>
          {isCategoryLoading && <p className="br-load-text">카테고리 추천을 불러오는 중...</p>}
          {!isCategoryLoading && categoryError && (
            <p className="br-error-text">{categoryError}</p>
          )}
          <div className="br-carousel">
            {carouselBooks.map((b, idx) => (
              <div
                key={b.id}
                className={[
                  "br-card",
                  idx === 1 ? "is-center" : "is-side",
                ].join(" ")}
                onClick={() => onOpenBookDetail?.(b.id)}
              >
                <img src={b.cover} alt={b.title} />
                <div className="br-cardLabel">{b.title}</div>
                {idx === 1 && (
                  <>
                    <div className="br-arrow left">‹</div>
                    <div className="br-arrow right">›</div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="br-divider" />
        </section>

        {/* 섹션 2: 랜덤 추천 */}
        <section className="br-section">
          <h3 className="br-title">랜덤 책 추천: 오늘은 이런 책 어떤신가요?</h3>
          <div className="br-carousel">
            {books.map((b, idx) => (
              <div
                key={b.id}
                className={["br-card", idx === 1 ? "is-center" : "is-side"].join(" ")}
                onClick={() => onOpenBookDetail?.(b.id)}
              >
                <img src={b.cover} alt={b.title} />
                <div className="br-cardLabel">{b.title}</div>
                {idx === 1 && (
                  <>
                    <div className="br-arrow left">‹</div>
                    <div className="br-arrow right">›</div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="br-divider" />
        </section>
      </main>
      <BookSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        books={books}
        onSelect={(book) => pickBook(book)}
      />
    </div>
  );
}
