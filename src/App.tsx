import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import './App.css';

type Post = {
  id: number;
  number: number;
  author: string;
  body: string;
  date: string;
  imageUrl?: string;
};

const STORAGE_KEY = 'panda_board_posts_v1';

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    number: 1,
    author: '名無しのぱんだ',
    body: 'ぱんだの掲示板へようこそ！🐼\nみんな同じ「名無しのぱんだ」だから気楽に書き込んでね。',
    date: '2026/11/24 12:50',
  },
  {
    id: 2,
    number: 2,
    author: '名無しのぱんだ',
    body: '>>1\n今日の笹は新鮮でおいしい〜！🎋✨',
    date: '2026/11/24 12:52',
  },
];

function formatNow(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

export function App() {
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // 読み込みエラー時は初期データを使用
    }
    return INITIAL_POSTS;
  });

  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(
    null
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const postRefs = useRef<Record<number, HTMLElement | null>>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
      // 画像サイズが大きすぎる場合などに備える
    }
  }, [posts]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageUrl(undefined);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選んでね🐼');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageUrl(undefined);
    setFileInputKey((prev) => prev + 1);
  };

  // 投稿の >>番号 ボタンを押したときの処理
  const handleReplyClick = (targetNumber: number) => {
    const anchor = `>>${targetNumber}`;
    setBody((prev) => {
      if (!prev.trim()) {
        return `${anchor}\n`;
      }
      const needsNewline = !prev.endsWith('\n');
      return `${prev}${needsNewline ? '\n' : ''}${anchor} `;
    });

    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 本文内の >>123 をクリック可能なボタンにして該当レスへジャンプ
  const handleJumpToPost = (targetNumber: number) => {
    const targetEl = postRefs.current[targetNumber];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedNumber(targetNumber);
      window.setTimeout(() => {
        setHighlightedNumber((current) =>
          current === targetNumber ? null : current
        );
      }, 1500);
    }
  };

  const renderBodyWithAnchors = (text: string) => {
    const parts = text.split(/(>>\d+)/g);
    return parts.map((part, index) => {
      const match = /^>>(\d+)$/.exec(part);
      if (match) {
        const num = Number(match[1]);
        return (
          <button
            key={index}
            type="button"
            className="anchor-link"
            onClick={() => handleJumpToPost(num)}
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = body.trim();

    if (!trimmed && !imageUrl) {
      return;
    }

    const nextNumber =
      posts.length > 0 ? Math.max(...posts.map((p) => p.number)) + 1 : 1;

    const newPost: Post = {
      id: Date.now(),
      number: nextNumber,
      author: '名無しのぱんだ',
      body: trimmed || '（画像だけ投稿したよ 📷）',
      date: formatNow(),
      imageUrl,
    };

    setPosts((prev) => [...prev, newPost]);
    setBody('');
    setImageUrl(undefined);
    setFileInputKey((prev) => prev + 1);
  };

  return (
    <div className="board-container">
      {/* ヘッダー */}
      <header className="board-header">
        <h1 className="board-title">
          <span>🐼</span> ぱんだの掲示板 <span>🍑</span>
        </h1>
       
       
      </header>

      {/* 新規投稿フォーム */}
      <section className="post-form-card">
        <h2 className="form-title">✍️ 新しく書き込む（名無しのぱんだ）</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              ref={textareaRef}
              id="content"
              className="form-textarea"
              placeholder="今日あったことや好きな笹の種類などを気軽に書いてね！（>>1 で返信もできるよ）"
              aria-label="本文"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="form-group image-upload-group">
            <label className="image-upload-label">
              📷 画像を添付する
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                className="image-file-input"
                onChange={handleImageChange}
              />
            </label>

            {imageUrl && (
              <div className="image-preview-box">
                <img
                  src={imageUrl}
                  alt="添付プレビュー"
                  className="image-preview"
                />
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={handleClearImage}
                >
                  ✕ 画像をやめる
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="submit-button">
            書き込む 🐾
          </button>
        </form>
      </section>

      {/* 投稿一覧 */}
      <main>
        <h2 className="posts-section-title">みんなの書き込み</h2>
        <div className="post-list">
          {posts.map((post) => {
            const isHighlighted = highlightedNumber === post.number;
            return (
              <article
                key={post.id}
                ref={(el) => {
                  postRefs.current[post.number] = el;
                }}
                className={`post-card ${isHighlighted ? 'post-card--highlighted' : ''}`}
              >
                <div className="post-meta">
                  <span className="post-number">{post.number}</span>
                  <button
                    type="button"
                    className="reply-anchor-button"
                    onClick={() => handleReplyClick(post.number)}
                    title={`>>${post.number} で返信する`}
                  >
                    &gt;&gt;{post.number}
                  </button>
                  <span className="post-author">{post.author}</span>
                  <span className="post-date">{post.date}</span>
                </div>
                <p className="post-body">{renderBodyWithAnchors(post.body)}</p>
                {post.imageUrl && (
                  <div className="post-image-wrap">
                    <img
                      src={post.imageUrl}
                      alt={`投稿${post.number}の添付画像`}
                      className="post-image"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      <footer className="board-footer">
        © ぱんだの掲示板
      </footer>
    </div>
  );
}

export default App;