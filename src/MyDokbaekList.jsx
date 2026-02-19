import React, { useEffect, useMemo, useState } from "react";
import "./MyDokbaekList.css";
import { fetchMyPosts } from "./api/fetchers";

export default function MyDokbaekList({ onOpenPostDetail, onWriteDokbaek }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const result = await fetchMyPosts();
        if (isCancelled) return;
        setPosts(result);
      } catch (error) {
        if (isCancelled) return;
        setPosts([]);
        setErrorMessage(error.message || "내 독서록 목록 조회 중 오류가 발생했습니다.");
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

  const myPosts = useMemo(() => {
    return posts.map((post) => ({
      id: post.id,
      title: post.book_title ?? "제목 없음",
      content: post.content ?? "",
      createdAt: post.created_at ?? "",
      isPublic: Boolean(post.is_public),
      bookId: post.book_id ?? post.bookId ?? "",
      cover: post.cover_image ?? post.cover ?? null,
    }));
  }, [posts]);

  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <div className="mdl-container-inline">
      <main className="mdl-main">
        <header className="mdl-header">
          <h1>나의 독백들</h1>
        </header>

        {isLoading && <div className="mdl-state">내 독서록을 불러오는 중...</div>}
        {!isLoading && errorMessage && <div className="mdl-error">{errorMessage}</div>}
        {!isLoading && !errorMessage && myPosts.length === 0 && (
          <div className="mdl-state">작성한 독서록이 아직 없어요.</div>
        )}

        <section className="mdl-grid">
          {myPosts.map((post, index) => (
            <article className="mdl-card-wrap" key={`${post.id}-${index}`}>
              <button
                type="button"
                className="mdl-card"
                onClick={() => onOpenPostDetail?.(post.id)}
                aria-label={`${post.title} 독서록 상세 보기`}
              >
                {post.cover ? (
                  <img src={post.cover} alt={post.title} />
                ) : (
                  <div className="mdl-card-fallback">{post.title}</div>
                )}
              </button>
              <div className="mdl-title-line" />
              <h3 className="mdl-title">{post.title}</h3>
              <p className="mdl-snippet">{post.content || "내용 없음"}</p>
              <div className="mdl-meta">
                <span>{formatDate(post.createdAt)}</span>
                <span>{post.isPublic ? "공개" : "비공개"}</span>
              </div>
            </article>
          ))}
        </section>

        <div className="mdl-write-btn-wrap">
          <button type="button" className="mdl-write-btn" onClick={() => onWriteDokbaek?.()}>
            독백 쓰기
          </button>
        </div>
      </main>
    </div>
  );
}
