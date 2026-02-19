import { useEffect, useMemo, useState } from "react";
import "./BookSearchModal.css";
import { searchBooks } from "./api/fetchers";

export default function BookSearchModal({
  isOpen,
  onClose,
  books = [],
  onSelect,
  title = "책 검색",
  placeholder = "책 제목 / 작가로 검색",
  limit = 5,
  searchUrl,
}) {
  const [query, setQuery] = useState("");
  const [remoteBooks, setRemoteBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usedApi, setUsedApi] = useState(false);

  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((book) => {
      const hay = `${book.title} ${book.author ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [books, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setRemoteBooks([]);
      setIsLoading(false);
      setErrorMessage("");
      setUsedApi(false);
      return;
    }

    const keyword = query.trim();
    if (!keyword) {
      setRemoteBooks([]);
      setIsLoading(false);
      setErrorMessage("");
      setUsedApi(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const result = await searchBooks({ keyword, limit, url: searchUrl });
        if (isCancelled) return;
        setRemoteBooks(result.results);
        setUsedApi(true);
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(error.message || "책 검색 중 오류가 발생했습니다.");
        setRemoteBooks([]);
        setUsedApi(false);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, query, limit, searchUrl]);

  const visibleBooks = query.trim() && usedApi ? remoteBooks : filteredLocal;

  if (!isOpen) return null;

  return (
    <div className="bsm-overlay" onMouseDown={onClose}>
      <div
        className="bsm-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="bsm-top">
          <h3>{title}</h3>
          <button type="button" className="bsm-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="bsm-search-row">
          <input
            className="bsm-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        </div>

        <div className="bsm-list">
          {isLoading && <div className="bsm-empty">검색 중...</div>}
          {!isLoading && errorMessage && <div className="bsm-error">{errorMessage}</div>}
          {!isLoading && visibleBooks.length === 0 ? (
            <div className="bsm-empty">검색 결과가 없어요.</div>
          ) : (
            visibleBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                className="bsm-row"
                onClick={() => {
                  onSelect(book);
                  onClose();
                }}
              >
                {book.cover ? (
                  <img className="bsm-thumb" src={book.cover} alt={`${book.title} 표지`} />
                ) : (
                  <div className="bsm-thumb bsm-thumb-empty">책</div>
                )}
                <div className="bsm-meta">
                  <div className="bsm-title">{book.title}</div>
                  <div className="bsm-author">{book.author ?? "작가 정보 없음"}</div>
                </div>
                <span className="bsm-pick">선택</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
