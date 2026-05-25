import { useState, useRef, useEffect } from "react";

const GOALS = ["All", "Awareness", "Education", "Conversion", "Community"];
const TYPES = ["All", "image", "reel", "carousel"];
const STATUSES = ["All", "published", "scheduled", "draft"];
const STATUS_COLORS = { published: { bg: "#d1fae5", text: "#065f46" }, scheduled: { bg: "#dbeafe", text: "#1e40af" }, draft: { bg: "#f3f4f6", text: "#374151" } };
const GOAL_COLORS = { Awareness: { bg: "#fef3c7", text: "#92400e" }, Education: { bg: "#ede9fe", text: "#5b21b6" }, Conversion: { bg: "#fee2e2", text: "#991b1b" }, Community: { bg: "#d1fae5", text: "#065f46" } };
const TYPE_ICONS = { reel: "▶", carousel: "⊞", image: null };

function isCanvaUrl(url) { return url && url.includes("canva.com"); }

function Badge({ label, colors }) {
  return <span style={{ background: colors.bg, color: colors.text, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, textTransform: "capitalize", letterSpacing: "0.02em" }}>{label}</span>;
}

async function fetchNotionPosts() {
  const res = await fetch("/api/notion", { method: "POST" });
  const data = await res.json();
  return data.results.map((page) => ({
    id: page.id,
    headline: page.properties.Title?.title?.[0]?.plain_text || "Untitled",
    status: page.properties.Status?.select?.name?.toLowerCase() || "draft",
    type: page.properties["Post Type"]?.select?.name?.toLowerCase() || "image",
    date: page.properties["Scheduled Date"]?.date?.start?.split("T")[0] || "",
    time: page.properties["Scheduled Date"]?.date?.start?.split("T")[1]?.slice(0, 5) || "12:00",
    caption: page.properties.Caption?.rich_text?.[0]?.plain_text || "",
    hashtags: page.properties.Hashtags?.rich_text?.[0]?.plain_text || "",
    goal: page.properties.Goal?.select?.name || "",
    imageUrl: page.properties["Image URL"]?.url || "",
    likes: page.properties.Likes?.number || 0,
    comments: page.properties.Comments?.number || 0,
    carouselImages: page.properties["Carousel Images"]?.rich_text?.[0]?.plain_text || "",
    videoUrl: page.properties["Reel Video URL"]?.url || "",
  }));
}

function CanvaFrame({ url, scale, fullSize }) {
  const embedUrl = url.includes("?embed") ? url : url + "?embed";
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#f0eeea" }}>
      <iframe
        src={embedUrl}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "1080px",
          height: "1080px",
          transform: `translate(-50%, -50%) scale(${scale})`,
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
  const isReel = post.type === "reel" && post.videoUrl;
  const isCarousel = post.type === "carousel" && carouselImages.length > 1;
  const isCanva = isCanvaUrl(post.imageUrl);
  const draftFilter = post.status === "draft" ? "grayscale(60%) opacity(0.7)" : "none";
  const togglePlay = () => { if (!videoRef.current) return; if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); } setPlaying(!playing); };

  if (isReel) return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000" }}>
      <video ref={videoRef} src={post.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} loop playsInline onEnded={() => setPlaying(false)} />
      <div onClick={fullSize ? togglePlay : undefined} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: fullSize ? "pointer" : "default", background: playing ? "transparent" : "rgba(0,0,0,0.3)" }}>
        {!playing && <div style={{ width: fullSize ? 64 : 28, height: fullSize ? 64 : 28, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: fullSize ? 24 : 10, marginLeft: 2 }}>▶</span></div>}
      </div>
      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>▶ REEL</div>
    </div>
  );

  if (isCarousel) return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img src={carouselImages[carouselIndex]} alt={`Slide ${carouselIndex + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {fullSize && carouselIndex > 0 && <button onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => i - 1); }} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 20, cursor: "pointer" }}>‹</button>}
      {fullSize && carouselIndex < carouselImages.length - 1 && <button onClick={(e) => { e.stopPropagation(); setCarouselIndex((i) => i + 1); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 20, cursor: "pointer" }}>›</button>}
      {fullSize && <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>{carouselImages.map((_, i) => <div key={i} onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }} style={{ width: i === carouselIndex ? 20 : 8, height: 8, borderRadius: 4, background: i === carouselIndex ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />)}</div>}
      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>⊞ {carouselIndex + 1}/{carouselImages.length}</div>
    </div>
  );

  if (isCanva) return <CanvaFrame url={post.imageUrl} scale={fullSize ? 0.58 : 0.28} fullSize={fullSize} />;

  return (
    <img
      src={post.imageUrl}
      alt={post.headline}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: draftFilter }}
      onError={(e) => { e.target.src = `https://via.placeholder.com/400x400/6366f1/white?text=${encodeURIComponent(post.type.toUpperCase())}`; }}
    />
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
      style={{ position: "relative", aspectRatio: "1/1", cursor: "pointer", borderRadius: 4, overflow: "hidden", border: "2px solid transparent", transition: "transform 0.15s", transform: hovered ? "scale(1.02)" : "scale(1)" }}
    >
      <MediaDisplay post={post} fullSize={false} />
      {hovered && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 8, pointerEvents: "none" }}>
          <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, margin: "0 0 4px", lineHeight: 1.3 }}>{post.headline}</p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, margin: 0 }}>{post.date} · {post.time}</p>
        </div>
      )}
      {TYPE_ICONS[post.type] && !isCanvaUrl(post.imageUrl) && (
        <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 5px", borderRadius: 3 }}>{TYPE_ICONS[post.type]}</div>
      )}
      <div style={{ position: "absolute", bottom: 5, left: 5 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: post.status === "published" ? "#10b981" : post.status === "scheduled" ? "#3b82f6" : "#9ca3af", border: "1.5px solid rgba(255,255,255,0.8)" }} />
      </div>
    </div>
  );
}

function PostModal({ post, onClose, isDark }) {
  if (!post) return null;
  const bg = isDark ? "#18181b" : "#ffffff";
  const text = isDark ? "#f4f4f5" : "#18181b";
  const muted = isDark ? "#a1a1aa" : "#6b7280";
  const border = isDark ? "#3f3f46" : "#e5e7eb";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: bg, borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "16px 16px 0 0", overflow: "hidden", minHeight: 300 }}>
          <MediaDisplay post={post} fullSize={true} />
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", zIndex: 10 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Badge label={post.status} colors={STATUS_COLORS[post.status]} />
            <Badge label={post.type} colors={{ bg: isDark ? "#27272a" : "#f3f4f6", text: isDark ? "#d4d4d8" : "#374151" }} />
            {post.goal && <Badge label={post.goal} colors={GOAL_COLORS[post.goal] || { bg: "#f3f4f6", text: "#374151" }} />}
          </div>
          <h3 style={{ color: text, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{post.headline}</h3>
          <p style={{ color: muted, fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>{post.caption}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: `1px solid ${border}`, paddingTop: 16 }}>
            <div><p style={{ color: muted, fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</p><p style={{ color: text, fontSize: 14, fontWeight: 500, margin: 0 }}>{post.date}</p></div>
            <div><p style={{ color: muted, fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Time</p><p style={{ color: text, fontSize: 14, fontWeight: 500, margin: 0 }}>{post.time}</p></div>
            {post.status === "published" && (
              <>
                <div><p style={{ color: muted, fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Likes</p><p style={{ color: text, fontSize: 14, fontWeight: 500, margin: 0 }}>{post.likes.toLocaleString()}</p></div>
                <div><p style={{ color: muted, fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Comments</p><p style={{ color: text, fontSize: 14, fontWeight: 500, margin: 0 }}>{post.comments.toLocaleString()}</p></div>
              </>
            )}
          </div>
          {post.hashtags && <p style={{ color: "#6366f1", fontSize: 13, margin: "12px 0 0", lineHeight: 1.6 }}>{post.hashtags}</p>}
        </div>
      </div>
    </div>
  );
}

function AddPostModal({ onClose, onAdd, isDark }) {
  const [form, setForm] = useState({ type: "image", status: "draft", date: "", time: "12:00", headline: "", caption: "", goal: "Awareness", hashtags: "", imageUrl: "" });
  const bg = isDark ? "#18181b" : "#ffffff";
  const text = isDark ? "#f4f4f5" : "#18181b";
  const border = isDark ? "#3f3f46" : "#e5e7eb";
  const inputBg = isDark ? "#27272a" : "#f9fafb";
  const inputStyle = { width: "100%", background: inputBg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", color: text, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: bg, borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: text, fontSize: 18, fontWeight: 700, margin: 0 }}>Add new post</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Type</label><select style={inputStyle} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="image">Image</option><option value="reel">Reel</option><option value="carousel">Carousel</option></select></div>
            <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Status</label><select style={inputStyle} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option></select></div>
          </div>
          <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Headline</label><input style={inputStyle} placeholder="Post headline or title" value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} /></div>
          <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Caption</label><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Post caption..." value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Date</label><input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></div>
            <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Time</label><input type="time" style={inputStyle} value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} /></div>
          </div>
          <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Goal</label><select style={inputStyle} value={form.goal} onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))}>{["Awareness", "Education", "Conversion", "Community"].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
          <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Image URL (Canva share link, ImgBB, Unsplash…)</label><input style={inputStyle} placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} /></div>
          <div><label style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: 12, display: "block", marginBottom: 4 }}>Hashtags</label><input style={inputStyle} placeholder="#hashtag #another" value={form.hashtags} onChange={(e) => setForm((p) => ({ ...p, hashtags: e.target.value }))} /></div>
          <button onClick={() => { if (form.headline) { onAdd({ ...form, id: "p" + Date.now(), likes: 0, comments: 0, carouselImages: "", videoUrl: "" }); onClose(); } }} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>Add to grid</button>
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
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 3 }}>
      {localPosts.map((post) => <PostCard key={post.id} post={post} onClick={onPostClick} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} />)}
    </div>
  );
}

function ContentPlanner({ posts, isDark }) {
  const bg = isDark ? "#18181b" : "#ffffff";
  const surface = isDark ? "#27272a" : "#f9fafb";
  const text = isDark ? "#f4f4f5" : "#18181b";
  const muted = isDark ? "#a1a1aa" : "#6b7280";
  const border = isDark ? "#3f3f46" : "#e5e7eb";
  const published = posts.filter((p) => p.status === "published");
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const totalLikes = published.reduce((s, p) => s + p.likes, 0);
  const totalComments = published.reduce((s, p) => s + p.comments, 0);
  const avgEngagement = published.length ? Math.round((totalLikes + totalComments) / published.length) : 0;
  const goalBreakdown = GOALS.slice(1).map((g) => ({ goal: g, count: posts.filter((p) => p.goal === g).length }));
  const maxGoal = Math.max(...goalBreakdown.map((g) => g.count), 1);
  const typeBreakdown = TYPES.slice(1).map((t) => ({ type: t, count: posts.filter((p) => p.type === t).length }));
  const upcoming = [...scheduled].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  const statCard = (label, value, sub) => (
    <div style={{ background: surface, borderRadius: 12, padding: "16px 20px" }}>
      <p style={{ color: muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: text, fontSize: 26, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ color: muted, fontSize: 12, margin: 0 }}>{sub}</p>}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {statCard("Total posts", posts.length, "in database")}
        {statCard("Scheduled", scheduled.length, "ready to go")}
        {statCard("Avg. engagement", avgEngagement.toLocaleString(), "per published post")}
        {statCard("Total likes", totalLikes.toLocaleString(), `${totalComments.toLocaleString()} comments`)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
          <h4 style={{ color: text, fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>Goal distribution</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goalBreakdown.map(({ goal, count }) => (
              <div key={goal}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, color: text }}>{goal}</span><span style={{ fontSize: 13, color: muted, fontWeight: 600 }}>{count}</span></div>
                <div style={{ height: 6, background: isDark ? "#3f3f46" : "#e5e7eb", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${(count / maxGoal) * 100}%`, background: GOAL_COLORS[goal]?.text || "#6366f1", borderRadius: 4, transition: "width 0.4s" }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
          <h4 style={{ color: text, fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>Content mix</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {typeBreakdown.map(({ type, count }) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, background: type === "reel" ? "#fee2e2" : type === "carousel" ? "#ede9fe" : "#dbeafe", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{type === "reel" ? "▶" : type === "carousel" ? "⊞" : "◻"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: text, textTransform: "capitalize" }}>{type}s</span><span style={{ fontSize: 13, fontWeight: 600, color: text }}>{count} posts</span></div>
                  <div style={{ fontSize: 11, color: muted }}>{posts.length ? Math.round((count / posts.length) * 100) : 0}% of feed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
        <h4 style={{ color: text, fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>Upcoming posts</h4>
        {upcoming.length === 0 ? <p style={{ color: muted, fontSize: 13 }}>No scheduled posts yet.</p> : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {upcoming.map((post, i) => (
              <div key={post.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < upcoming.length - 1 ? `1px solid ${border}` : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative", background: "#e5e7eb" }}>
                  {isCanvaUrl(post.imageUrl)
                    ? <CanvaFrame url={post.imageUrl} scale={0.037} fullSize={false} />
                    : <img src={post.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: text, fontSize: 13, fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.headline}</p>
                  <p style={{ color: muted, fontSize: 12, margin: 0 }}>{post.date} at {post.time}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <Badge label={post.type} colors={{ bg: isDark ? "#27272a" : "#f3f4f6", text: isDark ? "#d4d4d8" : "#374151" }} />
                  {post.goal && <Badge label={post.goal} colors={GOAL_COLORS[post.goal] || { bg: "#f3f4f6", text: "#374151" }} />}
                </div>
              </div>
            ))}
          </div>
        )}
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
    fetchNotionPosts()
      .then((data) => { setPosts(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, []);

  const bg = isDark ? "#09090b" : "#f8f8f8";
  const surface = isDark ? "#18181b" : "#ffffff";
  const text = isDark ? "#f4f4f5" : "#18181b";
  const muted = isDark ? "#a1a1aa" : "#6b7280";
  const border = isDark ? "#3f3f46" : "#e5e7eb";

  const filteredPosts = posts.filter((p) => {
    if (filterGoal !== "All" && p.goal !== filterGoal) return false;
    if (filterType !== "All" && p.type !== filterType) return false;
    if (filterStatus !== "All" && p.status !== filterStatus) return false;
    return true;
  });

  const tabStyle = (active) => ({ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: active ? (isDark ? "#27272a" : "#fff") : "transparent", color: active ? text : muted, boxShadow: active ? (isDark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.08)") : "none", transition: "all 0.15s" });
  const selectStyle = { background: isDark ? "#27272a" : "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: "6px 10px", color: text, fontSize: 12, fontFamily: "inherit", cursor: "pointer" };

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", color: text }}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "0 20px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 12, height: 12, border: "2px solid #fff", borderRadius: "50%" }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: text, letterSpacing: "-0.01em" }}>IG Grid Planner</span>
              <span style={{ background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>NOTION</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: isDark ? "#27272a" : "#f3f4f6", borderRadius: 10, padding: 3, display: "flex", gap: 2 }}>
                <button style={tabStyle(activeTab === "grid")} onClick={() => setActiveTab("grid")}>Grid preview</button>
                <button style={tabStyle(activeTab === "planner")} onClick={() => setActiveTab("planner")}>Planner</button>
              </div>
              <button onClick={() => setIsDark((d) => !d)} style={{ background: isDark ? "#27272a" : "#f3f4f6", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: text, fontSize: 14 }}>{isDark ? "☀" : "◑"}</button>
            </div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {activeTab === "grid" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <select style={selectStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
                <select style={selectStyle} value={filterGoal} onChange={(e) => setFilterGoal(e.target.value)}>{GOALS.map((g) => <option key={g} value={g}>{g === "All" ? "All goals" : g}</option>)}</select>
                <select style={selectStyle} value={filterType} onChange={(e) => setFilterType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: muted }}>Columns:</span>
                  {[3, 4, 5].map((c) => <button key={c} onClick={() => setColumns(c)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${columns === c ? "#6366f1" : border}`, background: columns === c ? "#6366f1" : "transparent", color: columns === c ? "#fff" : muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c}</button>)}
                </div>
                <button onClick={() => setShowAddModal(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add post</button>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                {[{ label: "Published", color: "#10b981" }, { label: "Scheduled", color: "#3b82f6" }, { label: "Draft", color: "#9ca3af" }].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} /><span style={{ fontSize: 12, color: muted }}>{label}</span></div>
                ))}
                <span style={{ fontSize: 12, color: muted }}>▶ Reel</span>
                <span style={{ fontSize: 12, color: muted }}>⊞ Carousel</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: muted }}>{filteredPosts.length} posts · Drag to rearrange</span>
              </div>
              <div style={{ background: surface, borderRadius: 16, padding: 3, border: `1px solid ${border}` }}>
                {loading
                  ? <div style={{ padding: 60, textAlign: "center", color: muted, fontSize: 14 }}>Loading your posts…</div>
                  : filteredPosts.length === 0
                    ? <div style={{ padding: 60, textAlign: "center", color: muted, fontSize: 14 }}>No posts match your filters.</div>
                    : <GridView posts={filteredPosts} onPostClick={setSelectedPost} columns={columns} />}
              </div>
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <span style={{ fontSize: 12, color: muted }}>Showing feed as it appears on desktop · Hover to preview · Click to expand</span>
              </div>
            </>
          )}
          {activeTab === "planner" && <ContentPlanner posts={posts} isDark={isDark} />}
        </div>
      </div>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} isDark={isDark} />}
      {showAddModal && <AddPostModal onClose={() => setShowAddModal(false)} onAdd={(post) => setPosts((p) => [post, ...p])} isDark={isDark} />}
    </div>
  );
}
