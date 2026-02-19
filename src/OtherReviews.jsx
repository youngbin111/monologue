import React, { useEffect, useMemo, useState } from "react";
import "./OtherReviews.css";
import BookSearchModal from "./BookSearchModal";
import { fetchPublicPosts } from "./api/fetchers";

const LEGACY_REVIEWS = [
  { id: "b1", title: "회색인간", user: "user dtpm***", snippet: "담담한 문장이지만 마음을 파고든 순간이었어요..." },
  { id: "b2", title: "총,균,쇠", user: "user qn***", snippet: "내용 자체는 어려운데 큰 흐름을 이해하니 좋았어요..." },
  { id: "b3", title: "메타버스", user: "user z***", snippet: "가상과 현실의 경계가 점점 흐려지는 느낌..." },
  { id: "b4", title: "사피엔스", user: "user ali***", snippet: "인간이라는 존재를 더 넓게 보게 됐어요..." },
  { id: "b5", title: "데미안", user: "user nori***", snippet: "처음 읽을 땐 난해했는데, 지금은 문장들이 남아요..." },
  { id: "b6", title: "채식주의자", user: "user ash", snippet: "익숙한 세계가 낯설어지는 감각이 있어요..." },
  { id: "b7", title: "클린 코드", user: "user byt*", snippet: "코드를 왜 깔끔하게 써야 하는지 '태도'를 배우게 됐어요..." },
  { id: "b8", title: "나미야 잡화점의 기적", user: "user dawn", snippet: "처음엔 잔잔한데 끝에 남는 게 커요..." },
  { id: "b9", title: "이기적 유전자", user: "user sigm*", snippet: "사고방식이 확장되는 느낌. 다시 읽고 싶어요." },
  { id: "b10", title: "1984", user: "user zer*", snippet: "불안한데 눈을 뗄 수 없는 디스토피아..." },
];

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
    const mapped = posts.map((post) => ({
      id: post.id,
      title: post.book_title ?? "제목 없음",
      user: post.user ?? "user",
      snippet: post.content ?? "",
      createdAt: post.created_at ?? "",
      isPublic: Boolean(post.is_public),
    }));

    return mapped.length > 0 ? mapped : LEGACY_REVIEWS;
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
