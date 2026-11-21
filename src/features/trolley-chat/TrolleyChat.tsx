"use client";

import Image from "next/image";
import avatar from "../../../public/assets/chat/trolley.jpg";
import { ArrowUp, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { HISTORY_LIMIT, QUESTION_LIMIT, type Message } from "./conversation";
import "./trolley-chat.css";

type Props = {
  placement?: "bottom-right" | "bottom-left" | "inline";
  className?: string;
};

const starters = ["How do I find a mission?", "Help me write a report", "Where are my rewards?"];

export function TrolleyChat({ placement = "bottom-right", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(false);
  const [source, setSource] = useState<"guide" | "ai" | null>(null);
  const requestActive = useRef(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [open, history, waiting, error]);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  async function requestReply(turns: Message[]) {
    if (requestActive.current) return;
    requestActive.current = true;
    setWaiting(true);
    setError(false);
    try {
      const res = await fetch("/api/trolley-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: turns.slice(-HISTORY_LIMIT) }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error();
      const reply = await res.json();
      if (typeof reply.answer !== "string" || !reply.answer.trim()) throw new Error();
      setHistory([...turns, { role: "assistant", content: reply.answer }]);
      setSource(reply.source);
    } catch {
      setError(true);
    } finally {
      requestActive.current = false;
      setWaiting(false);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || requestActive.current || error) return;
    const question: Message = { role: "user", content };
    const turns = [...history, question].slice(-HISTORY_LIMIT);
    setHistory(turns);
    setDraft("");
    void requestReply(turns);
  }

  return (
    <div className={`trolley-chat ${className}`} data-placement={placement}
      onKeyDown={e => { if (open && e.key === "Escape") { e.stopPropagation(); close(); } }}>
      {open && (
        <section id={panelId} className="trolley-chat__panel" role="dialog" aria-label="Chat with Trolley">
          <header className="trolley-chat__header">
            <span className="trolley-chat__portrait"><Image src={avatar} alt="" width={40} height={40} /></span>
            <div><strong>Trolley</strong><small>{source === "guide" ? "Built-in rider guide" : "Tada rider guide"}</small></div>
            <button type="button" onClick={close} aria-label="Close chat"><X size={18} /></button>
          </header>
          <div className="trolley-chat__log" ref={log} role="log" aria-label="Conversation" aria-live="polite">
            {history.length === 0 && <>
              <p>Hi, I’m Trolley. What would you like to do on the T?</p>
              <div className="trolley-chat__starters">{starters.map(label =>
                <button type="button" key={label} onClick={() => send(label)}>{label}</button>
              )}</div>
            </>}
            {history.map((message, index) => (
              <p key={index} data-role={message.role}><span className="sr-only">{message.role === "user" ? "You" : "Trolley"}: </span>{message.content}</p>
            ))}
            {waiting && <small>Thinking…</small>}
            {error && <div><p>Couldn’t get a reply.</p><button type="button" onClick={() => void requestReply(history)}>Retry</button>
              <button type="button" onClick={() => {
                setDraft(history[history.length - 1].content);
                setHistory(history.slice(0, -1));
                setError(false);
                input.current?.focus();
              }}>Edit question</button></div>}
          </div>
          <form className="trolley-chat__composer" onSubmit={e => { e.preventDefault(); send(draft); }}>
            <textarea ref={input} aria-label="Message Trolley" placeholder="Message Trolley…" rows={1}
              maxLength={QUESTION_LIMIT} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }} />
            <button type="submit" aria-label="Send message" disabled={waiting || error || !draft.trim()}><ArrowUp size={18} /></button>
          </form>
        </section>
      )}
      <button ref={launcher} type="button" className="trolley-chat__launcher"
        aria-label={open ? "Hide Trolley chat" : "Open Trolley chat"} aria-expanded={open}
        aria-controls={open ? panelId : undefined} aria-haspopup="dialog" onClick={() => open ? close() : setOpen(true)}>
        <Image src={avatar} alt="" width={56} height={56} draggable={false} />
      </button>
    </div>
  );
}
