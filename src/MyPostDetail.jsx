import { useEffect, useState } from "react";
import "./MyPostDetail.css";
import { fetchMyPostDetail } from "./api/fetchers";

export default function MyPostDetail({ postId, onBack, onEditPost }) {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const id = `${postId ?? ""}`.trim();
    if (!id) {
      setPost(null);
      setErrorMessage("조회할 독서록 id가 없습니다.");
      return;
    }

    const run = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const detail = await fetchMyPostDetail({ id });
        if (isCancelled) return;
        setPost(detail);
      } catch (error) {
        if (isCancelled) return;
        setPost(null);
        setErrorMessage(error.message || "독서록 상세 조회 중 오류가 발생했습니다.");
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
  }, [postId]);

  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleString("ko-KR");
  };

  return (
    <div className="mpd-container">
      <button type="button" className="mpd-back-btn" onClick={onBack}>
        ← 목록으로
      </button>

      {isLoading && <div className="mpd-state">독서록을 불러오는 중...</div>}
      {!isLoading && errorMessage && <div className="mpd-error">{errorMessage}</div>}

      {!isLoading && !errorMessage && post && (
        <article className="mpd-card">
          <header className="mpd-header">
            <h1>{post.book_title ?? "제목 없음"}</h1>
            <div className="mpd-meta">
              <span>{post.user ?? "-"}</span>
              <span>{formatDate(post.created_at)}</span>
              <span>{post.is_public ? "공개" : "비공개"}</span>
            </div>
            <div className="mpd-actions">
              <button
                type="button"
                className="mpd-edit-btn"
                onClick={() => onEditPost?.(post)}
              >
                편집
              </button>
            </div>
          </header>

          <section className="mpd-content">{post.content ?? "내용이 없습니다."}</section>
        </article>
      )}
    </div>
  );
}
