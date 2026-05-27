import { useState, useRef, useEffect } from "react";

const GOALS = ["All", "Relatability", "Saveable", "Educational", "Emotional connection", "Product awareness", "Conversion", "Pinterest traffic", "Authority building", "Brand identity", "Shareable"];
const TYPES = ["All", "image", "reel", "carousel"];
const STATUSES = ["All", "published", "scheduled", "draft"];

const STATUS_COLORS = {
  published: { bg: "#d1fae5", text: "#065f46" },
  scheduled: { bg: "#dbeafe", text: "#1e40af" },
  draft: { bg: "#ebe8e2", text: "#7a7470" },
};
const GOAL_COLORS = {
  Relatability: { bg: "#fef3c7", text: "#92400e" },
  Saveable: { bg: "#ede9fe", text: "#5b21b6" },
  Educational: { bg: "#dbeafe", text: "#1e40af" },
  "Emotional connection": { bg: "#fce7f3", text: "#9d174d" },
  "Product awareness": { bg: "#d1fae5", text: "#065f46" },
  Conversion: { bg: "#fee2e2", text: "#991b1b" },
  "Pinterest traffic": { bg: "#fef3c7", text: "#78350f" },
  "Authority building": { bg: "#f3f4f6", text: "#374151" },
  "Brand identity": { bg: "#ede9fe", text: "#4c1d95" },
  Shareable: { bg: "#d1fae5", text: "#064e3b" },
};
const TYPE_ICONS = { reel: "▶", carousel: "⊞", image: null };

const BRAND = {
  bg: "#f9f6f2",
  header: "#f5f1ec",
  surface: "#f5f1ec",
  card: "#ffffff",
  border: "#e0dbd4",
  borderLight: "#ebe8e2",
  text: "#2c2825",
  muted: "#9b9590",
  accent: "#f5f1ec",
  accentDark: "#ebe8e2",
  button: "#2c2825",
  buttonText: "#f5f1ec",
  font: "'Montserrat', sans-serif",
};

function isCanvaUrl(url) { return url && url.includes("canva.com"); }

function Badge({ label, colors }) {
  return (
    <span style={{ background: colors.bg, color: colors.text, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, textTransform: "capitalize", letterSpacing: "0.02em", fontFamily: BRAND.font }}>
      {label}
    </span>
  );
}

async function fetchNotionPosts() {
  const res = await fetch("/api/notion", { method: "POST" });
  const data = await res.json();
  return data.results.map((page) => ({
    id: page.id,
    headline: page.properties.Title?.title?.[0]?.plain_text || "Untitled",
    status: page.properties.Status?.select?.name?.trim()?.toLowerCase() || "draft",
    type: page.properties["Post Type"]?.select?.name?.trim()?.toLowerCase() || "image",
    date: page.properties["Scheduled Date"]?.date?.start?.split("T")[0] || "",
    time: page.properties["Scheduled Date"]?.date?.start?.split("T")[1]?.slice(0, 5) || "12:00",
    caption: page.properties.Caption?.rich_text?.[0]?.plain_text || "",
    hashtags: page.properties.Hashtags?.rich_text?.[0]?.plain_text || "",
    goal: page.properties.Goal?.select?.name?.trim() || "",
    imageUrl: page.properties["Image URL"]?.url || page.properties["Image"]?.files?.[0]?.file?.url || page.properties["Image"]?.files?.[0]?.external?.url || "",
    likes: page.properties.Likes?.number || 0,
    comments: page.properties.Comments?.number || 0,
    carouselImages: page.properties["Carousel Images"]?.rich_text?.[0]?.plain_text || "",
    videoUrl: page.properties["Reel Video URL"]?.url || page.properties["Reel Video URL"]?.files?.[0]?.file?.url || page.properties["Reel Video URL"]?.files?.[0]?.external?.url || "",
  }));
}

function CanvaFrame({ url, scale, fullSize }) {
  const embedUrl = url.includes("?embed") ? url : url + "?embed";
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#fff" }}>
      <iframe
        src={embedUrl}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "1080px",
          height: "1300px",
          transform: `translate(-50%, -46%) scale(${scale})`,
          transformOrigin: "center center",
          border: "none",
          pointerEvents: fullSize ? "auto" : "none",
        }}
        allowFullScreen
        loading="lazy"
        title="Canva design"
      />
    </div>
  );
}

function MediaDisplay({ post, fullSize = false }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselImages = post.carouselImages ? post.carouselImages.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const isReel = post.type === "reel" && post.videoUrl && !isCanvaUrl(post.videoUrl);
const isCanvaReel = post.type === "reel" && post.videoUrl && isCanvaUrl(post.videoUrl);
  const isCarousel = post.type === "carousel" && carouselImages.length > 1;
  const isCanva = isCanvaUrl(post.imageUrl);
  const draftFilter = post.status === "draft" ? "grayscale(40%) opacity(0.8)" : "none";
  const togglePlay = () => { if (!videoRef.current) return; if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); } setPlaying(!playing); };

  if (isCanvaReel) return <CanvaFrame url={post.videoUrl} scale={fullSize ? 0.52 : 0.25} fullSize={fullSize} />;
  if (isReel) return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000" }}>
      <video ref={videoRef} src={post.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} loop playsInline onEnded={() => setPlaying(false)} />
      <div onClick={fullSize ? togglePlay : undefined} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: fullSize ? "pointer" : "default", background: playing ? "transparent" : "rgba(0,0,0,0.25)" }}>
        {!playing && <div style={{ width: fullSize ? 56 : 24, height: fullSize ? 56 : 24, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: fullSize ? 20 : 9, marginLeft: 2 }}>▶</span></div>}
      </div>
      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 10, fontFamily: BRAND.font }}>▶ REEL</div>
    </div>
  );

  if (isCarousel) return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img src={carouselImages[carouselIndex]} alt={`Slide ${carouselIndex + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {fullSize && carouselIndex > 0 && <button onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => i - 1); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer", fontFamily: BRAND.font }}>‹</button>}
      {fullSize && carouselIndex < carouselImages.length - 1 && <button onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => i + 1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer", fontFamily: BRAND.font }}>›</button>}
      {fullSize && <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>{carouselImages.map((_, i) => <div key={i} onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }} style={{ width: i === carouselIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === carouselIndex ? "#fff" : "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 0.2s" }} />)}</div>}
      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 10, fontFamily: BRAND.font }}>⊞ {carouselIndex + 1}/{carouselImages.length}</div>
    </div>
  );

  if (isCanva) return <CanvaFrame url={post.imageUrl} scale={fullSize ? 0.52 : 0.25} fullSize={fullSize} />;

  return (
    <img src={post.imageUrl} alt={post.headline} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: draftFilter }}
      onError={(e) => { e.target.src = `https://via.placeholder.com/400x400/e0dbd4/9b9590?text=${encodeURIComponent(post.type)}`; }} />
  );
}

function PostCard({ post, onClick, onDragStart, onDragOver, onDrop }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, post.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, post.id)}
      onClick={() => onClick(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", aspectRatio: "1/1", cursor: "pointer", borderRadius: 3, overflow: "hidden", transition: "transform 0.15s", transform: hovered ? "scale(1.02)" : "scale(1)" }}
    >
      <MediaDisplay post={post} fullSize={false} />
      {hovered && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(44,40,37,0.72)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 8, pointerEvents: "none" }}>
          <p style={{ color: "#f5f1ec", fontSize: 10, fontWeight: 600, margin: "0 0 3px", lineHeight: 1.3, fontFamily: BRAND.font }}>{post.headline}</p>
          <p style={{ color: "rgba(245,241,236,0.65)", fontSize: 9, margin: 0, fontFamily: BRAND.font }}>{post.date} · {post.time}</p>
        </div>
      )}
      {TYPE_ICONS[post.type] && !isCanvaUrl(post.imageUrl) && (
        <div style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 9, padding: "2px 5px", borderRadius: 3, fontFamily: BRAND.font }}>{TYPE_ICONS[post.type]}</div>
      )}
      <div style={{ position: "absolute", bottom: 5, left: 5 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: post.status === "published" ? "#10b981" : post.status === "scheduled" ? "#93c5fd" : "#c9c4be", border: "1.5px solid rgba(255,255,255,0.7)" }} />
      </div>
    </div>
  );
}

function PostModal({ post, onClose }) {
  if (!post) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(44,40,37,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24, fontFamily: BRAND.font }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: BRAND.card, borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", border: `0.5px solid ${BRAND.border}` }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "14px 14px 0 0", overflow: "hidden", minHeight: 280 }}>
          <MediaDisplay post={post} fullSize={true} />
          <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, background: "rgba(44,40,37,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#f5f1ec", fontSize: 14, cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BRAND.font }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <Badge label={post.status} colors={STATUS_COLORS[post.status]} />
            <Badge label={post.type} colors={{ bg: BRAND.accentDark, text: BRAND.muted }} />
            {post.goal && <Badge label={post.goal} colors={GOAL_COLORS[post.goal] || { bg: BRAND.accentDark, text: BRAND.muted }} />}
          </div>
          <h3 style={{ color: BRAND.text, fontSize: 16, fontWeight: 600, margin: "0 0 6px", fontFamily: BRAND.font }}>{post.headline}</h3>
          <p style={{ color: BRAND.muted, fontSize: 13, margin: "0 0 14px", lineHeight: 1.6, fontFamily: BRAND.font }}>{post.caption}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderTop: `0.5px solid ${BRAND.border}`, paddingTop: 14 }}>
            <div><p style={{ color: BRAND.muted, fontSize: 10, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: BRAND.font }}>Date</p><p style={{ color: BRAND.text, fontSize: 13, fontWeight: 500, margin: 0, fontFamily: BRAND.font }}>{post.date}</p></div>
            <div><p style={{ color: BRAND.muted, fontSize: 10, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: BRAND.font }}>Time</p><p style={{ color: BRAND.text, fontSize: 13, fontWeight: 500, margin: 0, fontFamily: BRAND.font }}>{post.time}</p></div>
            {post.status === "published" && (
              <>
                <div><p style={{ color: BRAND.muted, fontSize: 10, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: BRAND.font }}>Likes</p><p style={{ color: BRAND.text, fontSize: 13, fontWeight: 500, margin: 0, fontFamily: BRAND.font }}>{post.likes.toLocaleString()}</p></div>
                <div><p style={{ color: BRAND.muted, fontSize: 10, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: BRAND.font }}>Comments</p><p style={{ color: BRAND.text, fontSize: 13, fontWeight: 500, margin: 0, fontFamily: BRAND.font }}>{post.comments.toLocaleString()}</p></div>
              </>
            )}
          </div>
          {post.hashtags && <p style={{ color: "#7a7470", fontSize: 12, margin: "10px 0 0", lineHeight: 1.6, fontFamily: BRAND.font }}>{post.hashtags}</p>}
        </div>
      </div>
    </div>
  );
}

function AddPostModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ type: "image", status: "draft", date: "", time: "12:00", headline: "", caption: "", goal: "Awareness", hashtags: "", imageUrl: "" });
  const inputStyle = { width: "100%", background: BRAND.accent, border: `0.5px solid ${BRAND.border}`, borderRadius: 6, padding: "8px 10px", color: BRAND.text, fontSize: 13, fontFamily: BRAND.font, boxSizing: "border-box" };
  const labelStyle = { color: BRAND.muted, fontSize: 11, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: BRAND.font };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(44,40,37,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: BRAND.card, borderRadius: 14, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", padding: 24, border: `0.5px solid ${BRAND.border}`, fontFamily: BRAND.font }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ color: BRAND.text, fontSize: 15, fontWeight: 600, margin: 0, fontFamily: BRAND.font }}>Add new post</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: BRAND.muted, fontSize: 18, fontFamily: BRAND.font }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={labelStyle}>Type</label><select style={inputStyle} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="image">Image</option><option value="reel">Reel</option><option value="carousel">Carousel</option></select></div>
            <div><label style={labelStyle}>Status</label><select style={inputStyle} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option></select></div>
          </div>
          <div><label style={labelStyle}>Headline</label><input style={inputStyle} placeholder="Post headline" value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} /></div>
          <div><label style={labelStyle}>Caption</label><textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} placeholder="Post caption..." value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Time</label><input type="time" style={inputStyle} value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} /></div>
          </div>
          <div><label style={labelStyle}>Goal</label><select style={inputStyle} value={form.goal} onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))}>{["Awareness", "Education", "Conversion", "Community"].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
          <div><label style={labelStyle}>Image URL</label><input style={inputStyle} placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} /></div>
          <div><label style={labelStyle}>Hashtags</label><input style={inputStyle} placeholder="#hashtag #another" value={form.hashtags} onChange={(e) => setForm((p) => ({ ...p, hashtags: e.target.value }))} /></div>
          <button onClick={() => { if (form.headline) { onAdd({ ...form, id: "p" + Date.now(), likes: 0, comments: 0, carouselImages: "", videoUrl: "" }); onClose(); } }}
            style={{ background: BRAND.button, color: BRAND.buttonText, border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4, fontFamily: BRAND.font, letterSpacing: "0.03em" }}>
            Add to grid
          </button>
        </div>
      </div>
    </div>
  );
}

function GridView({ posts, onPostClick, columns }) {
  const [draggedId, setDraggedId] = useState(null);
  const [localPosts, setLocalPosts] = useState(posts);
  useEffect(() => { setLocalPosts(posts); }, [posts]);
  const handleDragStart = (e, id) => { setDraggedId(id); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedId === targetId) return;
    const updated = [...localPosts];
    const fromIdx = updated.findIndex((p) => p.id === draggedId);
    const toIdx = updated.findIndex((p) => p.id === targetId);
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setLocalPosts(updated);
    setDraggedId(null);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 2 }}>
      {localPosts.map((post) => <PostCard key={post.id} post={post} onClick={onPostClick} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} />)}
    </div>
  );
}

function ContentPlanner({ posts }) {
  const published = posts.filter((p) => p.status === "published");
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const drafts = posts.filter((p) => p.status === "draft");
  const goalBreakdown = GOALS.slice(1).map((g) => ({ goal: g, count: posts.filter((p) => p.goal === g).length }));
  const maxGoal = Math.max(...goalBreakdown.map((g) => g.count), 1);
  const typeBreakdown = TYPES.slice(1).map((t) => ({ type: t, count: posts.filter((p) => p.type === t).length }));

  const statCard = (label, value, sub) => (
    <div style={{ background: BRAND.accent, borderRadius: 10, padding: "14px 16px", border: `0.5px solid ${BRAND.border}` }}>
      <p style={{ color: BRAND.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px", fontFamily: BRAND.font }}>{label}</p>
      <p style={{ color: BRAND.text, fontSize: 22, fontWeight: 600, margin: "0 0 2px", letterSpacing: "-0.02em", fontFamily: BRAND.font }}>{value}</p>
      {sub && <p style={{ color: BRAND.muted, fontSize: 11, margin: 0, fontFamily: BRAND.font }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {statCard("Total posts", posts.length, "in your database")}
        {statCard("Drafts", drafts.length, "still to work on")}
        {statCard("Scheduled", scheduled.length, "ready to go")}
        {statCard("Published", published.length, "already live")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: BRAND.card, border: `0.5px solid ${BRAND.border}`, borderRadius: 12, padding: 18 }}>
          <h4 style={{ color: BRAND.text, fontSize: 12, fontWeight: 600, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: BRAND.font }}>Goal distribution</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goalBreakdown.map(({ goal, count }) => (
              <div key={goal}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: BRAND.text, fontFamily: BRAND.font }}>{goal}</span>
                  <span style={{ fontSize: 12, color: BRAND.muted, fontWeight: 600, fontFamily: BRAND.font }}>{count}</span>
                </div>
                <div style={{ height: 4, background: BRAND.borderLight, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / maxGoal) * 100}%`, background: "#2c2825", borderRadius: 4, transition: "width 0.4s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: BRAND.card, border: `0.5px solid ${BRAND.border}`, borderRadius: 12, padding: 18 }}>
          <h4 style={{ color: BRAND.text, fontSize: 12, fontWeight: 600, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: BRAND.font }}>Content mix</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {typeBreakdown.map(({ type, count }) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, background: BRAND.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, border: `0.5px solid ${BRAND.border}` }}>
                  {type === "reel" ? "▶" : type === "carousel" ? "⊞" : "◻"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: BRAND.text, textTransform: "capitalize", fontFamily: BRAND.font }}>{type}s</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.text, fontFamily: BRAND.font }}>{count}</span>
                  </div>
                  <div style={{ fontSize: 10, color: BRAND.muted, fontFamily: BRAND.font }}>{posts.length ? Math.round((count / posts.length) * 100) : 0}% of feed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("grid");
  const [columns, setColumns] = useState(3);
  const [filterGoal, setFilterGoal] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    fetchNotionPosts().then((data) => { setPosts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const dark = {
    bg: "#1c1a18", header: "#232019", surface: "#232019", card: "#2a2723",
    border: "#3a3632", text: "#f0ebe4", muted: "#7a7470", accent: "#2a2723", accentDark: "#3a3632",
  };

  const theme = isDark ? dark : BRAND;

  const filteredPosts = posts.filter((p) => {
    if (filterGoal !== "All" && p.goal !== filterGoal) return false;
    if (filterType !== "All" && p.type !== filterType) return false;
    if (filterStatus !== "All" && p.status !== filterStatus) return false;
    return true;
  });

  const selectStyle = {
    background: isDark ? dark.accent : BRAND.accent,
    border: `0.5px solid ${isDark ? dark.border : BRAND.border}`,
    borderRadius: 6, padding: "5px 9px",
    color: isDark ? dark.text : BRAND.text,
    fontSize: 11, fontFamily: BRAND.font, cursor: "pointer",
  };

  const tabActive = { fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 6, background: isDark ? dark.card : BRAND.card, color: isDark ? dark.text : BRAND.text, border: `0.5px solid ${isDark ? dark.border : BRAND.border}`, cursor: "pointer", fontFamily: BRAND.font };
  const tabInactive = { fontSize: 11, padding: "5px 14px", color: isDark ? dark.muted : BRAND.muted, background: "transparent", border: "none", cursor: "pointer", fontFamily: BRAND.font };

  return (
    <div style={{ background: isDark ? dark.bg : BRAND.bg, minHeight: "100vh", fontFamily: BRAND.font }}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ background: isDark ? dark.header : BRAND.header, borderBottom: `0.5px solid ${isDark ? dark.border : BRAND.border}`, padding: "0 20px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 50 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: isDark ? dark.text : BRAND.text, letterSpacing: "-0.01em", fontFamily: BRAND.font }}>IG Grid Planner</span>
              <span style={{ background: isDark ? dark.accentDark : BRAND.accentDark, color: isDark ? dark.muted : BRAND.muted, fontSize: 8, fontWeight: 600, padding: "2px 7px", borderRadius: 3, letterSpacing: "0.1em", border: `0.5px solid ${isDark ? dark.border : BRAND.border}`, fontFamily: BRAND.font }}>NOTION</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: isDark ? dark.accentDark : BRAND.accentDark, borderRadius: 8, padding: 3, display: "flex", gap: 1, border: `0.5px solid ${isDark ? dark.border : BRAND.border}` }}>
                <button style={activeTab === "grid" ? tabActive : tabInactive} onClick={() => setActiveTab("grid")}>Grid preview</button>
                <button style={activeTab === "planner" ? tabActive : tabInactive} onClick={() => setActiveTab("planner")}>Planner</button>
              </div>
              <button onClick={() => setIsDark((d) => !d)} style={{ background: isDark ? dark.accentDark : BRAND.accentDark, border: `0.5px solid ${isDark ? dark.border : BRAND.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: isDark ? dark.muted : BRAND.muted, fontSize: 13, fontFamily: BRAND.font }}>
                {isDark ? "☀" : "◑"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {activeTab === "grid" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <select style={selectStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
                <select style={selectStyle} value={filterGoal} onChange={(e) => setFilterGoal(e.target.value)}>{GOALS.map((g) => <option key={g} value={g}>{g === "All" ? "All goals" : g}</option>)}</select>
                <select style={selectStyle} value={filterType} onChange={(e) => setFilterType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 11, color: isDark ? dark.muted : BRAND.muted, fontFamily: BRAND.font }}>Columns:</span>
                  {[3, 4, 5].map((c) => (
                    <button key={c} onClick={() => setColumns(c)} style={{ width: 26, height: 26, borderRadius: 5, border: `0.5px solid ${columns === c ? (isDark ? dark.text : BRAND.button) : (isDark ? dark.border : BRAND.border)}`, background: columns === c ? (isDark ? dark.text : BRAND.button) : "transparent", color: columns === c ? (isDark ? dark.bg : BRAND.buttonText) : (isDark ? dark.muted : BRAND.muted), fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: BRAND.font }}>{c}</button>
                  ))}
                </div>
                <button onClick={() => setShowAddModal(true)} style={{ background: isDark ? dark.text : BRAND.button, color: isDark ? dark.bg : BRAND.buttonText, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: BRAND.font, letterSpacing: "0.02em" }}>+ Add post</button>
              </div>

              <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                {[{ label: "Published", color: "#10b981" }, { label: "Scheduled", color: "#93c5fd" }, { label: "Draft", color: "#c9c4be" }].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 11, color: isDark ? dark.muted : BRAND.muted, fontFamily: BRAND.font }}>{label}</span>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: isDark ? dark.muted : BRAND.muted, fontFamily: BRAND.font }}>▶ Reel</span>
                <span style={{ fontSize: 11, color: isDark ? dark.muted : BRAND.muted, fontFamily: BRAND.font }}>⊞ Carousel</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: isDark ? dark.muted : BRAND.muted, fontFamily: BRAND.font }}>{filteredPosts.length} posts · Drag to rearrange</span>
              </div>

              <div style={{ background: isDark ? dark.surface : BRAND.surface, borderRadius: 10, padding: 2, border: `0.5px solid ${isDark ? dark.border : BRAND.border}` }}>
                {loading
                  ? <div style={{ padding: 60, textAlign: "center", color: isDark ? dark.muted : BRAND.muted, fontSize: 12, fontFamily: BRAND.font }}>Loading your posts…</div>
                  : filteredPosts.length === 0
                    ? <div style={{ padding: 60, textAlign: "center", color: isDark ? dark.muted : BRAND.muted, fontSize: 12, fontFamily: BRAND.font }}>No posts match your filters.</div>
                    : <GridView posts={filteredPosts} onPostClick={setSelectedPost} columns={columns} />}
              </div>
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <span style={{ fontSize: 10, color: isDark ? dark.muted : BRAND.muted, fontFamily: BRAND.font, letterSpacing: "0.02em" }}>Showing feed as it appears on desktop · Hover to preview · Click to expand</span>
              </div>
            </>
          )}
          {activeTab === "planner" && <ContentPlanner posts={posts} />}
        </div>
      </div>

      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      {showAddModal && <AddPostModal onClose={() => setShowAddModal(false)} onAdd={(post) => setPosts((p) => [post, ...p])} />}
    </div>
  );
}
