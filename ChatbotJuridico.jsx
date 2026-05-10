import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const styles = {
  fab: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#111",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    transition: "transform 0.2s",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  overlay: {
    position: "fixed",
    bottom: "96px",
    right: "28px",
    zIndex: 1000,
    width: "380px",
    maxHeight: "600px",
    display: "flex",
    flexDirection: "column",
    borderRadius: "16px",
    overflow: "hidden",
    border: "0.5px solid #e0e0e0",
    background: "#fff",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    animation: "slideUp 0.25s ease",
  },
  header: {
    background: "#111",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    flexShrink: 0,
  },
  avatarCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#2a2a2a",
    border: "1.5px solid #444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.2px",
  },
  headerSub: {
    fontSize: "11px",
    color: "#777",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#4caf50",
    display: "inline-block",
  },
  closeBtn: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#666",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: "300px",
    maxHeight: "420px",
  },
  dateDivider: {
    textAlign: "center",
    fontSize: "11px",
    color: "#bbb",
    margin: "4px 0",
  },
  msgRow: (isUser) => ({
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    flexDirection: isUser ? "row-reverse" : "row",
  }),
  msgAvatar: (isUser) => ({
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: isUser ? "#e0e0e0" : "#111",
    color: isUser ? "#666" : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 600,
    flexShrink: 0,
  }),
  bubble: (isUser) => ({
    padding: "9px 13px",
    borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    fontSize: "13px",
    lineHeight: "1.55",
    maxWidth: "240px",
    background: isUser ? "#111" : "#fff",
    color: isUser ? "#fff" : "#222",
    border: isUser ? "none" : "0.5px solid #e8e8e8",
  }),
  sourcesRow: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    marginTop: "6px",
  },
  sourceTag: {
    fontSize: "11px",
    padding: "2px 8px",
    background: "#f0f0f0",
    border: "0.5px solid #ddd",
    borderRadius: "20px",
    color: "#555",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  typingDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#bbb",
    display: "inline-block",
    animation: "bounce 1.2s infinite ease-in-out",
  },
  footer: {
    padding: "12px 14px",
    borderTop: "0.5px solid #eee",
    background: "#fff",
    flexShrink: 0,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f5f5f3",
    borderRadius: "10px",
    padding: "7px 10px 7px 14px",
    border: "0.5px solid #e0e0e0",
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: "13px",
    color: "#333",
    outline: "none",
    fontFamily: "inherit",
  },
  sendBtn: (disabled) => ({
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: disabled ? "#ccc" : "#111",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    flexShrink: 0,
    transition: "background 0.15s",
  }),
  disclaimer: {
    fontSize: "11px",
    color: "#bbb",
    textAlign: "center",
    margin: "8px 0 0",
  },
};

const IconScale = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const IconFile = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const TypingIndicator = () => (
  <div style={styles.msgRow(false)}>
    <div style={styles.msgAvatar(false)}>IA</div>
    <div style={{ ...styles.bubble(false), display: "flex", alignItems: "center", gap: "5px", padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ ...styles.typingDot, animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  </div>
);

const Message = ({ msg }) => (
  <div style={styles.msgRow(msg.isUser)}>
    <div style={styles.msgAvatar(msg.isUser)}>
      {msg.isUser ? "TÚ" : "IA"}
    </div>
    <div>
      <div style={styles.bubble(msg.isUser)}>{msg.text}</div>
      {msg.sources && msg.sources.length > 0 && (
        <div style={styles.sourcesRow}>
          {msg.sources.map((src, i) => (
            <span key={i} style={styles.sourceTag}>
              <IconFile /> {src}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default function ChatbotJuridico() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      isUser: false,
      text: "Hola, soy el asistente jurídico de la plataforma. Puedo responder preguntas basadas en los documentos legales del caso. ¿En qué puedo ayudarte?",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    const pregunta = input.trim();
    if (!pregunta || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), isUser: true, text: pregunta, sources: [] },
    ]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("pregunta", pregunta);

      const res = await fetch(`${API_URL}/consultar/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          text: data.respuesta_ia || "No se pudo obtener respuesta.",
          sources: data.fuentes_consultadas || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          isUser: false,
          text: "Hubo un error al conectar con el asistente. Por favor intenta de nuevo.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-5px); }
        }
        .fab-btn:hover { transform: scale(1.08); }
        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>

      {open && (
        <div style={styles.overlay} role="dialog" aria-label="Asistente Jurídico IA">
          <div style={styles.header}>
            <div style={styles.avatarCircle}>
              <IconScale />
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.headerTitle}>Asistente IA Jurídico</p>
              <p style={styles.headerSub}>
                <span style={styles.statusDot} />
                En línea · RAG sobre documentos del caso
              </p>
            </div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Cerrar chat">
              <IconClose />
            </button>
          </div>

          <div style={styles.body} ref={bodyRef} className="chat-body">
            <div style={styles.dateDivider}>
              {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
          </div>

          <div style={styles.footer}>
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                type="text"
                placeholder="Escribe una pregunta legal..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                aria-label="Mensaje"
              />
              <button
                style={styles.sendBtn(loading || !input.trim())}
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label="Enviar mensaje"
              >
                <IconSend />
              </button>
            </div>
            <p style={styles.disclaimer}>Respuestas basadas únicamente en documentos del caso</p>
          </div>
        </div>
      )}

      <button
        className="fab-btn"
        style={styles.fab}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente jurídico"}
      >
        {open ? <IconClose /> : <IconScale />}
      </button>
    </>
  );
}
