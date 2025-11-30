/** React-based popup implementation */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Note } from '../db/types';
import { Message, MessageResponse } from '../background/messages';

type LoadState = 'idle' | 'loading' | 'error';

function sendMessage<T = any>(message: Message): Promise<MessageResponse<T>> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => resolve(response));
  });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [state, setState] = useState<LoadState>('idle');

  const load = useCallback(async () => {
    setState('loading');
    const res = await sendMessage<Note[]>({ type: 'get-notes' });
    if (res.success && res.data) {
      setNotes(res.data);
      setState('idle');
    } else {
      setState('error');
    }
  }, []);

  const add = useCallback(async (content: string) => {
    if (!content.trim()) return;
    const res = await sendMessage<Note>({
      type: 'save-note',
      note: { type: 'text', content, source: {} }
    });
    if (res.success && res.data) {
      setNotes((prev: Note[]) => [res.data as Note, ...prev]);
    }
  }, []);

  const update = useCallback(async (id: string, content: string) => {
    const res = await sendMessage<Note>({ type: 'update-note', id, content });
    if (res.success && res.data) {
      setNotes((prev: Note[]) => prev.map((n: Note) => (n.id === id ? (res.data as Note) : n)));
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const res = await sendMessage({ type: 'delete-note', id });
    if (res.success) {
      setNotes((prev: Note[]) => prev.filter((n: Note) => n.id !== id));
    }
  }, []);

  const exportJSON = useCallback(async () => {
    const res = await sendMessage<string>({ type: 'export-notes' });
    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clipnote-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  return { notes, state, load, add, update, remove, exportJSON };
};

interface QuickAddProps { onAdd: (content: string) => void }
const QuickAdd: React.FC<QuickAddProps> = ({ onAdd }: QuickAddProps) => {
  const [value, setValue] = useState<string>('');
  const save = () => {
    onAdd(value.trim());
    setValue('');
  };
  return (
    <section className="quick-add">
      <textarea
        value={value}
  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
        placeholder="Type a quick note..."
        rows={3}
      />
      <button className="btn btn-primary" onClick={save} disabled={!value.trim()}>Save Note</button>
    </section>
  );
};

interface NoteItemProps { note: Note; onUpdate: (id: string, content: string) => void; onDelete: (id: string) => void }
const NoteItem: React.FC<NoteItemProps> = ({ note, onUpdate, onDelete }: NoteItemProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  useEffect(() => setDraft(note.content), [note.content]);
  const save = () => {
    if (draft.trim() && draft !== note.content) onUpdate(note.id, draft.trim());
    setEditing(false);
  };
  return (
    <div className="note-item" data-id={note.id}>
      <div className="note-header">
        <span className="note-date">{formatDate(note.createdAt)}</span>
        {note.source.url && (
          <a href={note.source.url} target="_blank" rel="noreferrer" className="note-source">🔗 Source</a>
        )}
      </div>
      {editing ? (
        <textarea
          className="note-content-edit"
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
          onBlur={save}
          autoFocus
        />
      ) : (
  <div className="note-content" role="textbox" onClick={() => setEditing(true)}>{note.content}</div>
      )}
      <div className="note-actions">
        <button className="btn-icon" title="Delete" onClick={() => onDelete(note.id)}>🗑️</button>
      </div>
    </div>
  );
};

interface NotesSectionProps { notes: Note[]; onUpdate: (id: string, c: string) => void; onDelete: (id: string) => void; onExport: () => void }
const NotesSection: React.FC<NotesSectionProps> = ({ notes, onUpdate, onDelete, onExport }: NotesSectionProps) => {
  if (!notes.length) {
    return (
      <div className="empty-state">
        <p>No notes yet. Start by:</p>
        <ul>
          <li>Typing a quick note above</li>
          <li>Selecting text and pressing <kbd>Ctrl+Shift+K</kbd></li>
        </ul>
      </div>
    );
  }
  return (
    <section className="notes-section">
      <div className="notes-header">
        <h2>Your Notes</h2>
        <button className="btn btn-secondary" onClick={onExport}>Export JSON</button>
      </div>
      <div className="notes-list">
        {notes.map(n => (
          <NoteItem key={n.id} note={n} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
};

const ToastContainer: React.FC<{ toasts: Array<{ id: number; text: string }> }> = ({ toasts }) => {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className="toast-icon">✅</span>
          <span className="toast-text">{t.text}</span>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const { notes, state, load, add, update, remove, exportJSON } = useNotes();
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);

  const pushToast = useCallback((text: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (msg: Message) => {
      if ((msg as any).type === 'toast' && (msg as any).text) {
        pushToast((msg as any).text);
      }
    };
    chrome.runtime.onMessage.addListener(handler as any);
    return () => chrome.runtime.onMessage.removeListener(handler as any);
  }, [pushToast]);

  const header = useMemo(() => (
    <header className="app-header">
      <div className="brand">
        <img src="../../icons/icon128.png" alt="ClipNote" className="logo" />
        <div className="titles">
          <h1>ClipNote</h1>
          <p className="subtitle">Your offline second brain</p>
        </div>
      </div>
    </header>
  ), []);
  return (
    <div className="container">
      {header}
      <QuickAdd onAdd={add} />
      {state === 'error' && <div className="error">Failed to load notes.</div>}
      {state === 'loading' && !notes.length ? <div className="loading">Loading…</div> : null}
      <NotesSection notes={notes} onUpdate={update} onDelete={remove} onExport={exportJSON} />
      <ToastContainer toasts={toasts} />
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
