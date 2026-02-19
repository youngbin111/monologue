import React from "react";

export default function GenreSelect({
  allGenres,
  selectedGenres,
  onToggleGenre,
  onNext,
}) {
  return (
    <div className="genre-box">
      <div className="genre-header">
        <h2>장르 선택</h2>
        <p>읽어보거나, 관심이 가는 책을 선택해주세요</p>
      </div>

      <div className="genre-grid">
        {allGenres.slice(0, 15).map((genre) => (
          <button
            key={genre}
            className={`genre-pill ${selectedGenres.includes(genre) ? "selected" : ""}`}
            onClick={() => onToggleGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      <div className="genre-grid">
        {allGenres.slice(15).map((genre) => (
          <button
            key={genre}
            className={`genre-pill ${selectedGenres.includes(genre) ? "selected" : ""}`}
            onClick={() => onToggleGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      <button className="finish-btn" onClick={onNext}>
        다음
      </button>
    </div>
  );
}
