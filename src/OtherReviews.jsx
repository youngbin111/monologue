import React, { useEffect, useMemo, useState } from "react";
import "./OtherReviews.css";
import BookSearchModal from "./BookSearchModal";
import { fetchPublicPosts } from "./api/fetchers";

export default function OtherReviews({ 
  onGoMyDokbaek, 
  onGoSignUp, 
  onOpenOthersDokbaek, 
  onOpenBookDetail, 
  onLogout 
}) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const result = await fetchPublicPosts();
        if (isCancelled) return;
        setPosts(result);
      } catch (error) {
        if (isCancelled) return;
        setPosts([]);
        setErrorMessage(error.message || "타 독서록 조회 중 오류가 발생했습니다.");
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
  }, []);

  const books = useMemo(() => {
    return posts.map((post) => ({
      id: post.id,
      title: post.book_title ?? "제목 없음",
      user: post.user ?? "user",
      snippet: post.content ?? "",
      createdAt: post.created_at ?? "",
      isPublic: Boolean(post.is_public),
    }));
  }, [posts]);

  const modalBooks = useMemo(() => {
    const uniqueTitles = [...new Set(books.map((b) => b.title))];
    return uniqueTitles.map((title, index) => ({
      id: `modal-${index + 1}`,
      title,
      author: "독백 사용자 추천",
      cover: null,
    }));
  }, [books]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return books
      .map((b) => b.title)
      .filter((t, idx, arr) => arr.indexOf(t) === idx)
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 8);
  }, [books, query]);

  const visibleCards = useMemo(() => {
    if (!selectedBook) return books;
    return books.filter((b) => b.title === selectedBook);
  }, [books, selectedBook]);

  return (
    <div className="or-container-inline"> {/* SignUpProcess 내부용 클래스 */}
      <main className="orMain">
        <header className="orHeader">
          <div className="orTitleWrap">
            <h1 className="orTitle">다른 독백들</h1>
            <div className="orLine" />
          </div>

          <div className="orSearchWrap">
            <div className="orSearchBox">
              <input
                className="orSearchInput"
                placeholder="보고 싶은 책을 입력해주세요"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedBook(null);
                }}
              />
              <button 
                type="button" 
                className="orSearchBtn"
                onClick={() => setIsSearchModalOpen(true)}
              >
                🔍
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="orSuggest">
                {suggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="orSuggestItem"
                    onClick={() => {
                      setSelectedBook(t);
                      setQuery(t);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {isLoading && <div className="or-state">독서록 목록을 불러오는 중...</div>}
        {!isLoading && errorMessage && <div className="or-error">{errorMessage}</div>}
        {!isLoading && !errorMessage && visibleCards.length === 0 && (
          <div className="or-state">표시할 타 독서록이 없어요.</div>
        )}

        <section className="orGrid">
          {visibleCards.map((card) => (
            <article 
              key={card.id} 
              className="orCard clickable" 
              onClick={() => onOpenOthersDokbaek?.(card.id)} // 상세 보기로 연결
            >
              <div className="orCardTop">
                <h3 className="orCardTitle">{card.title}</h3>
              </div>
              <p className="orCardBody">{card.snippet}</p>
              <div className="orCardUser">{card.user}</div>
            </article>
          ))}
        </section>
        <div className="orMore">more reviews . . .</div>
      </main>
      <BookSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        books={modalBooks}
        onSelect={(book) => {
          setSelectedBook(book.title);
          setQuery(book.title);
        }}
      />
    </div>
  );
}
