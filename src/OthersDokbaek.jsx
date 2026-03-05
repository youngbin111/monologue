import React, { useEffect, useState } from "react";
import "./OthersDokbaek.css";
import { fetchBookDetail, fetchPublicPostDetail } from "./api/fetchers";

export default function OthersDokbaek({ postId, onGoSignUp, onOpenBook }) {
  const [post, setPost] = useState(null);
  const [book, setBook] = useState(null);
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
        const detail = await fetchPublicPostDetail({ id });
        if (isCancelled) return;
        setPost(detail);
        setBook(null);
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

  useEffect(() => {
    let isCancelled = false;
    const bookId = `${post?.book_id ?? ""}`.trim();
    if (!bookId) {
      setBook(null);
      return;
    }

    const run = async () => {
      try {
        const detail = await fetchBookDetail({ id: bookId });
        if (isCancelled) return;
        setBook(detail);
      } catch (error) {
        if (isCancelled) return;
        setBook(null);
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [post?.book_id]);

  const handleExit = () => {
    alert("독백 보기를 종료합니다");
    if (typeof onGoSignUp === "function") onGoSignUp();
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleString("ko-KR");
  };

  const coverImage = book?.coverImage || "http://monologue.ehdgus.com/api/img/S000216796615.jpg";
  const coverAlt = `${post?.book_title ?? "책"} 표지`;

  return (
    /* SignUpProcess의 right-fixed-section 내부에 표시됩니다 */
    <div className="od-sub-content">
      <main className="odMain">
        <section className="odPanel">
          {isLoading && <div className="odState">독서록을 불러오는 중...</div>}
          {!isLoading && errorMessage && <div className="odError">{errorMessage}</div>}
          {!isLoading && !errorMessage && !post && (
            <div className="odState">표시할 독서록이 없습니다.</div>
          )}

          {!isLoading && !errorMessage && post && (
            <>
          {/* TOP TITLE */}
          <h1 className="odTitle">
            <span className="odTitleUser">{post.user ?? "user"}</span>님의 독백
          </h1>

          {/* CONTENT ROW */}
          <div className="odRow">
            {/* BOOK COVER */}
            <div className="odCoverWrap">
              <div className="odCoverFrame">
                <img
                  className="odCoverImg"
                  src={coverImage}
                  alt={coverAlt}
                />
              </div>
            </div>

            {/* BOOK INFO */}
            <div className="odInfo">
              <button
                type="button"
                className="odBookTitleBtn"
                onClick={() => typeof onOpenBook === "function" && onOpenBook()}
              >
                {post.book_title ?? "제목 없음"}
              </button>

              <div className="odRatingBlock">
                <div className="odLabel">작성일 {formatDate(post.created_at)}</div>
                <div className="odLabel">{post.is_public ? "공개 글" : "비공개 글"}</div>
              </div>
            </div>
          </div>

          {/* REVIEW BOX */}
          <div className="odReviewBox">
            <div className="odReviewText">
              {post.content ?? "내용이 없습니다."}
            </div>
          </div>

          {/* EXIT BUTTON */}
          <div className="odExitRow">
            <button type="button" className="odExitBtn" onClick={handleExit}>
              독백 종료
            </button>
          </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
