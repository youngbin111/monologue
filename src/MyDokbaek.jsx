import React, { useEffect, useMemo, useState } from "react";
import "./MyDokbaek.css";
import { authFetch, deleteMyPost, fetchBooksByCategory, searchBooks, updateMyPost } from "./api/fetchers";

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="stars" role="radiogroup" aria-label="마음에 남은 정도 별점">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${active >= n ? "on" : ""}`}
          aria-label={`${n}점`}
          aria-checked={value === n}
          role="radio"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      <span className="starsValue">{value ? `${value}/5` : "미선택"}</span>
    </div>
  );
}

function BookSearchModal({ isOpen, onClose, books, onSelect, limit = 5, searchUrl }) {
  const [q, setQ] = useState("");
  const [remoteBooks, setRemoteBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usedApi, setUsedApi] = useState(false);

  const filteredLocal = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return books;
    return books.filter((b) => {
      const hay = `${b.title} ${b.author ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, books]);

  useEffect(() => {
    if (!isOpen) {
      setQ("");
      setRemoteBooks([]);
      setIsLoading(false);
      setErrorMessage("");
      setUsedApi(false);
      return;
    }

    const keyword = q.trim();
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
  }, [isOpen, q, limit, searchUrl]);

  const visibleBooks = q.trim() && usedApi ? remoteBooks : filteredLocal;

  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="책 검색 및 선택"
      >
        <div className="modalTop">
          <h3>책 검색</h3>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="modalSearchRow">
          <input
            className="modalSearchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="책 제목 / 작가로 검색"
            autoFocus
          />
        </div>

        <div className="modalList">
          {isLoading && <div className="emptyState">검색 중...</div>}
          {!isLoading && errorMessage && <div className="modalError">{errorMessage}</div>}
          {!isLoading && visibleBooks.length === 0 ? (
            <div className="emptyState">검색 결과가 없어요.</div>
          ) : (
            visibleBooks.map((b) => (
              <button
                key={b.id}
                type="button"
                className="bookRow"
                onClick={() => {
                  onSelect(b);
                  onClose();
                }}
              >
                {b.cover ? (
                  <img className="bookThumb" src={b.cover} alt={`${b.title} 표지`} />
                ) : (
                  <div className="bookThumb" aria-hidden="true" />
                )}
                <div className="bookMeta">
                  <div className="bookTitle">{b.title}</div>
                  <div className="bookAuthor">{b.author}</div>
                </div>
                <span className="pickBadge">선택</span>
              </button>
            ))
          )}
        </div>

        <div className="modalBottom">
          <button type="button" className="ghostBtn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyDokbaek({ onFinish, initialPost = null, onCancelEdit }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBooks, setModalBooks] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [hashtagLine, setHashtagLine] = useState("");
  const [reviewText, setReviewText] = useState("");
  const isEditMode = Boolean(initialPost?.id);

  const pickWordFromOneLine = (line) => {
    const candidates = String(line ?? "")
      .split(/\s+/)
      .map((token) => token.replace(/^#+/, "").replace(/[^A-Za-z0-9가-힣_-]/g, ""))
      .filter(Boolean);

    return candidates[0] ?? "";
  };

  useEffect(() => {
    if (!isEditMode) return;

    setSelectedBook({
      id: initialPost?.book_id ?? initialPost?.bookId ?? `post-${initialPost?.id}`,
      title: initialPost?.book_title ?? "",
      author: initialPost?.author ?? "",
      cover: initialPost?.cover_image ?? initialPost?.cover ?? null,
    });
    setIsPublic(Boolean(initialPost?.is_public));
    setReviewText(initialPost?.content ?? "");
  }, [initialPost, isEditMode]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        const result = await fetchBooksByCategory({
          category: "01",
          limit: 10,
        });
        if (isCancelled) return;
        setModalBooks(Array.isArray(result.results) ? result.results : []);
      } catch (error) {
        if (isCancelled) return;
        setModalBooks([]);
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 책 선택 + 리뷰 작성이 되어야 버튼이 활성화됩니다.
  const canFinish = Boolean(selectedBook) && Boolean(reviewText.trim());

  const handleFinish = async () => {
    if (!selectedBook) return alert("책을 먼저 선택해주세요.");
    if (!reviewText.trim()) return alert("독서록을 작성해주세요.");

    const payload = {
      book_title: selectedBook.title,
      content: reviewText.trim(),
      is_public: isPublic,
    };

    const apiBase = (process.env.REACT_APP_API_BASE_URL ?? "").replace(/\/$/, "");
    const postUrl = process.env.REACT_APP_POSTS_API_URL ?? `${apiBase}/api/posts/`;
    let savedPost = null;

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        const updated = await updateMyPost({
          id: initialPost.id,
          payload,
        });
        if (!updated?.id) {
          throw new Error("독서록 수정 응답 형식이 올바르지 않습니다.");
        }
        savedPost = updated;
      } else {
        const response = await authFetch(postUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        let data = null;
        try {
          data = await response.json();
        } catch (parseError) {
          data = null;
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
          }
          const fieldErrors = data && typeof data === "object"
            ? Object.values(data).flat?.().join?.("\n")
            : "";
          throw new Error(
            fieldErrors ||
            data?.message ||
            data?.detail ||
            (response.status === 400
              ? "독서록 입력값이 올바르지 않습니다."
              : `요청 실패: ${response.status}`)
          );
        }

        if (!data?.id || !data?.book_title) {
          throw new Error("독서록 저장 응답 형식이 올바르지 않습니다.");
        }
        savedPost = data;
      }

      const pickedWord = pickWordFromOneLine(hashtagLine);
      if (pickedWord) {
        localStorage.setItem("myDokbaekOneLineWord", pickedWord);
      } else {
        localStorage.removeItem("myDokbaekOneLineWord");
      }
    } catch (error) {
      console.error("독백 저장 실패:", error);
      alert(error.message || "저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    } finally {
      setIsSubmitting(false);
    }

    alert(isEditMode ? "수정되었습니다!" : "저장되었습니다!");

    // Save result payload so list can reflect immediately even before next fetch cycle.
    if (typeof onFinish === "function") onFinish(savedPost);
  };

  const handleDelete = async () => {
    if (!isEditMode || !initialPost?.id) return;

    const shouldDelete = window.confirm("정말 삭제하겠습니까?");
    if (!shouldDelete) return;

    try {
      setIsSubmitting(true);
      await deleteMyPost({ id: initialPost.id });
      alert("삭제되었습니다.");
      if (typeof onFinish === "function") {
        onFinish(null, { deletedId: initialPost.id });
      }
    } catch (error) {
      alert(error.message || "삭제에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-dokbaek-sub-wrapper">
      <main className="main">
        <header className="topHeader">
          <div className="pageHint">나의 독백</div>
          <div className="rightHint">쓴 독서록 확인하는칸</div>
        </header>

        <section className="panel">
          <div className="panelHeader">
            <h1 className="panelTitle">나의 독백</h1>
            <p className="panelSub">오늘은 어떤 기분이었나요? 오늘의 책은 무엇인가요?</p>
          </div>

          <div className="contentRow">
            <div className="coverCol">
              <div className="coverFrame">
                {selectedBook && selectedBook.cover ? (
                  <img className="coverImg" src={selectedBook.cover} alt={`${selectedBook.title} 표지`} />
                ) : (
                  <div className="coverPlaceholder">
                    <div className="phIcon">📚</div>
                    <div className="phText">책을 선택해주세요</div>
                  </div>
                )}

                <button
                  type="button"
                  className="zoomBtn"
                  onClick={() => setIsModalOpen(true)}
                  aria-label="책 검색 및 선택"
                  title="책 검색"
                >
                  🔍
                </button>
              </div>
            </div>

            <div className="infoCol">
              <div className="todayBookTitle">
                오늘의 책은?{" "}
                <span className="todayBookValue">{selectedBook ? selectedBook.title : "미선택"}</span>
              </div>

              <div className="privacyRow">
                <button
                  type="button"
                  className={`pillBtn ${isPublic ? "active" : ""}`}
                  onClick={() => setIsPublic(true)}
                >
                  공개
                </button>
                <button
                  type="button"
                  className={`pillBtn ${!isPublic ? "active" : ""}`}
                  onClick={() => setIsPublic(false)}
                >
                  비공개
                </button>
              </div>

              <div className="field">
                <div className="fieldLabel">마음에 남은 정도</div>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div className="field">
                <div className="fieldLabel">오늘 읽은 책은?</div>
                <input
                  className="hashInput"
                  value={hashtagLine}
                  onChange={(e) => setHashtagLine(e.target.value)}
                  placeholder="#해시태그 #한줄평 (예: #여운가득 #문장맛집)"
                />
                <div className="helperText">한 줄로 짧게 적어도 돼요. 해시태그 여러 개 OK.</div>
              </div>
            </div>
          </div>

          <div className="reviewBox">
            <textarea
              className="reviewTextarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="오늘의 독서록을 작성해주세요. (자유롭게 길게 써도 돼요)"
            />
            <div className="reviewMetaRow">
              <span className="counter">{reviewText.length.toLocaleString()}자</span>

              <button
                type="button"
                className={`finishBtn ${canFinish ? "" : "disabled"}`}
                onClick={handleFinish}
                disabled={!canFinish || isSubmitting}
              >
                {isSubmitting ? "저장 중..." : isEditMode ? "수정 완료" : "독백 종료"}
              </button>
            </div>
            {isEditMode ? (
              <div className="editActionRow">
                <button
                  type="button"
                  className="cancelEditBtn"
                  onClick={() => onCancelEdit?.()}
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="deleteBtn"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  삭제
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <BookSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={modalBooks}
        onSelect={setSelectedBook}
      />
    </div>
  );
}
