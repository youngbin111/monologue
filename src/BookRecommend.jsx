import { useEffect, useMemo, useState } from "react";
import "./BookRecommend.css";
import BookSearchModal from "./BookSearchModal";
import { fetchBooksByCategory, searchBooks } from "./api/fetchers";

function dedupeBooks(books = []) {
  const map = new Map();
  books.forEach((book) => {
    if (!book || !book.title) return;
    const key = book.id ? `id:${book.id}` : `title:${String(book.title).toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, book);
    }
  });
  return [...map.values()];
}

function pickRandomBooks(books = [], count = 5) {
  const copy = [...books];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function pickRandomItems(items = [], count = 3) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

const SAME_ORIGIN_BOOK_SEARCH_URL = "/api/books/search";
const RANDOM_CATEGORY_CODES = ["01", "0111", "0113", "0114", "03", "0301"];

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
  selectedGenres = [],
  isLoggedIn = false,
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [randomBooks, setRandomBooks] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [randomError, setRandomError] = useState("");
  const selectedGenreKeywords = useMemo(
    () => selectedGenres.map((genre) => String(genre ?? "").trim()).filter(Boolean),
    [selectedGenres]
  );

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
        setRandomError("");

        const loadGenreBooks = async () => {
          const keywordResultBooks = [];

          if (selectedGenreKeywords.length > 0) {
            const keywordResults = await Promise.allSettled(
              selectedGenreKeywords.map((keyword) =>
                searchBooks({
                  keyword,
                  limit: 10,
                  // Avoid CORS issues from external absolute search URL env.
                  url: SAME_ORIGIN_BOOK_SEARCH_URL,
                })
              )
            );

            keywordResults.forEach((result) => {
              if (result.status !== "fulfilled") return;
              const books = Array.isArray(result.value?.results) ? result.value.results : [];
              keywordResultBooks.push(...books);
            });
          }

          const dedupedKeywordBooks = dedupeBooks(keywordResultBooks);
          if (dedupedKeywordBooks.length > 0) {
            return pickRandomBooks(dedupedKeywordBooks, 5);
          }

          const fallback = await fetchBooksByCategory({
            category: preferredCategoryCode,
            limit: 20,
          });

          const dedupedFallbackBooks = dedupeBooks(
            Array.isArray(fallback?.results) ? fallback.results : []
          );
          if (dedupedFallbackBooks.length > 0) {
            return pickRandomBooks(dedupedFallbackBooks, 5);
          }

          // Preferred category might be empty; use broad fiction category as final fallback.
          if (preferredCategoryCode !== "01") {
            const broadFallback = await fetchBooksByCategory({
              category: "01",
              limit: 20,
            });
            const dedupedBroadFallbackBooks = dedupeBooks(
              Array.isArray(broadFallback?.results) ? broadFallback.results : []
            );
            return pickRandomBooks(dedupedBroadFallbackBooks, 5);
          }

          return [];
        };

        const loadAllRandomBooks = async () => {
          const randomCategories = pickRandomItems(RANDOM_CATEGORY_CODES, 3);
          const categoryResults = await Promise.allSettled(
            randomCategories.map((categoryCode) =>
              fetchBooksByCategory({
                category: categoryCode,
                limit: 10,
              })
            )
          );

          const mergedRandomPool = [];
          categoryResults.forEach((result) => {
            if (result.status !== "fulfilled") return;
            const books = Array.isArray(result.value?.results) ? result.value.results : [];
            mergedRandomPool.push(...books);
          });

          const dedupedRandomPool = dedupeBooks(mergedRandomPool);
          if (dedupedRandomPool.length > 0) {
            return pickRandomBooks(dedupedRandomPool, 5);
          }

          const fallback = await fetchBooksByCategory({
            category: "01",
            limit: 20,
          });
          const dedupedFallbackBooks = dedupeBooks(
            Array.isArray(fallback?.results) ? fallback.results : []
          );
          return pickRandomBooks(dedupedFallbackBooks, 5);
        };

        const [genreResult, randomResult] = await Promise.allSettled([
          loadGenreBooks(),
          loadAllRandomBooks(),
        ]);
        if (isCancelled) return;

        if (genreResult.status === "fulfilled") {
          setCategoryBooks(Array.isArray(genreResult.value) ? genreResult.value : []);
        } else {
          setCategoryBooks([]);
          setCategoryError(genreResult.reason?.message || "추천 도서를 불러오지 못했습니다.");
        }

        if (randomResult.status === "fulfilled") {
          setRandomBooks(Array.isArray(randomResult.value) ? randomResult.value : []);
        } else {
          setRandomBooks([]);
          setRandomError(randomResult.reason?.message || "랜덤 추천 도서를 불러오지 못했습니다.");
        }
      } catch (error) {
        if (isCancelled) return;
        setCategoryBooks([]);
        setRandomBooks([]);
        setCategoryError(error.message || "추천 도서를 불러오지 못했습니다.");
        setRandomError(error.message || "랜덤 추천 도서를 불러오지 못했습니다.");
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
  }, [preferredCategoryCode, selectedGenreKeywords]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return categoryBooks
      .filter((b) => b.title.toLowerCase().includes(q))
      .slice(0, 6);
  }, [categoryBooks, query]);

  const pickBook = (book) => {
    setPicked(book);
    setQuery(book.title);
  };

  const recommendedBooks = categoryBooks;
  const genreTitleText = selectedGenreKeywords.length > 0
    ? selectedGenreKeywords.join("/")
    : "로맨스/성장";

  const carouselBooks = useMemo(() => {
    const base = recommendedBooks;
    if (!picked) return base;
    const rest = base.filter((b) => b.id !== picked.id);
    return [rest[0], picked, rest[1], rest[2]].filter(Boolean);
  }, [recommendedBooks, picked]);

  const secondaryBooks = randomBooks;

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
          <h3 className="br-title">독백님이 좋아하는 {genreTitleText} 소설이에요!</h3>
          {isCategoryLoading && <p className="br-load-text">카테고리 추천을 불러오는 중...</p>}
          {!isCategoryLoading && categoryError && (
            <p className="br-error-text">{categoryError}</p>
          )}
          {!isCategoryLoading && !categoryError && carouselBooks.length === 0 && (
            <p className="br-load-text">추천 도서가 없습니다.</p>
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
          {!isCategoryLoading && randomError && (
            <p className="br-error-text">{randomError}</p>
          )}
          {!isCategoryLoading && !randomError && secondaryBooks.length === 0 && (
            <p className="br-load-text">추천 도서가 없습니다.</p>
          )}
          <div className="br-carousel">
            {secondaryBooks.map((b, idx) => (
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
        books={recommendedBooks}
        onSelect={(book) => pickBook(book)}
      />
    </div>
  );
}
