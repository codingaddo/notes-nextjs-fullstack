'use client';

import { useEffect, useMemo, useState } from 'react';

interface Note {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

// Loose shape for API error payloads coming from the backend.
// We always treat parsed JSON as unknown first and only read these
// properties after runtime checks in fetchJSON.
interface ApiError {
  message?: string;
  error?: string;
}

async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();

  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore JSON parse errors; will fall back to generic message
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;

    if (data && typeof data === 'object') {
      const unknownData: unknown = data;
      const anyData = unknownData as Partial<ApiError>;
      if (typeof anyData.message === 'string') {
        message = anyData.message;
      } else if (typeof anyData.error === 'string') {
        message = anyData.error;
      }
    }

    throw new Error(message);
  }

  return data as T;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formErrors, setFormErrors] = useState<{ title?: string; body?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  async function loadNotes() {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchJSON<Note[]>("/api/notes", { cache: "no-store" });
      const sorted = data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setNotes(sorted);
      if (!selectedId && sorted.length > 0) {
        setSelectedId(sorted[0].id);
      }
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load notes.');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateForm() {
    const errors: { title?: string; body?: string } = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.trim().length > 120) {
      errors.title = 'Title must be 120 characters or fewer.';
    }

    if (!body.trim()) {
      errors.body = 'Body is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus({ type: 'idle' });

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = { title: title.trim(), body: body.trim() };
      const created = await fetchJSON<Note>('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setNotes((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setTitle('');
      setBody('');
      setFormErrors({});
      setFormStatus({ type: 'success', message: 'Note saved.' });
    } catch (err) {
      setFormStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save note.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(note: Note, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm('Delete note "' + (note.title || 'Untitled') + '"? This cannot be undone.')) {
      return;
    }

    setDeletingId(note.id);
    try {
      await fetchJSON<{ message: string }>(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });

      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      setSelectedId((current) => {
        if (current !== note.id) return current;
        const remaining = notes.filter((n) => n.id !== note.id);
        return remaining.length ? remaining[0].id : null;
      });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete note. Please try again in a moment.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main>
      <div className="app-shell">
        <header className="app-header" aria-label="Purple Notes header">
          <div>
            <div className="app-title">
              Purple Notes
              <span className="app-title-pill">Next.js · Prisma</span>
            </div>
            <p className="app-subtitle">
              Capture quick thoughts with a fast, minimal notes experience.
            </p>
          </div>
          <div className="chip" aria-label="App status">
            <span className="chip-dot" aria-hidden="true" />
            <span>Connected to local SQLite</span>
          </div>
        </header>

        <section className="app-layout" aria-label="Notes layout">
          {/* Notes list + detail */}
          <section className="card" aria-label="Notes list">
            <div className="card-inner">
              <div className="card-header">
                <h2 className="card-title">Your notes</h2>
                <span className="card-badge">
                  {loadingList ? 'Loading…' : `${notes.length} note${notes.length === 1 ? '' : 's'}`}
                </span>
              </div>

              <div className="notes-list-container">
                {listError && (
                  <p className="form-error" role="alert">
                    {listError}
                  </p>
                )}

                {loadingList ? (
                  <p className="text-muted">Fetching your notes…</p>
                ) : notes.length === 0 ? (
                  <p className="notes-list-empty">No notes yet. Create your first note on the right.</p>
                ) : (
                  <div className="notes-list scroll-fade">
                    {notes.map((note) => {
                      const isSelected = note.id === selectedId;
                      return (
                        <article
                          key={note.id}
                          className={`note-item${isSelected ? ' selected' : ''}`}
                          onClick={() => setSelectedId(note.id)}
                        >
                          <div className="note-main">
                            <div className="note-title">{note.title || 'Untitled note'}</div>
                            <div className="note-meta">
                              <span>{formatDate(note.createdAt)}</span>
                            </div>
                            <p className="note-body-preview">{note.body}</p>
                          </div>
                          <button
                            type="button"
                            className="note-delete-btn"
                            onClick={(e) => handleDelete(note, e)}
                            disabled={deletingId === note.id}
                            aria-label={`Delete note ${note.title || 'Untitled'}`}
                          >
                            {deletingId === note.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}

                <div className="separator" />

                <section aria-label="Selected note details">
                  {selectedNote ? (
                    <div className="note-detail">
                      <div className="note-meta" style={{ marginBottom: '0.25rem' }}>
                        <span className="badge-soft">Selected</span>
                        <span>{formatDate(selectedNote.createdAt)}</span>
                      </div>
                      <div style={{ fontWeight: 550, marginBottom: '0.25rem' }}>
                        {selectedNote.title || 'Untitled note'}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.86rem' }}>{selectedNote.body}</div>
                    </div>
                  ) : (
                    <p className="text-muted">Select a note from the list to see its full content.</p>
                  )}
                </section>
              </div>
            </div>
          </section>

          {/* Create note form */}
          <section className="card" aria-label="Create note">
            <div className="card-inner">
              <div className="card-header">
                <h2 className="card-title">New note</h2>
                <span className="card-badge">Autosaves to SQLite via API</span>
              </div>

              <form className="form" onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <label className="form-label" htmlFor="title">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    className="form-input"
                    placeholder="Meeting notes, ideas, todos…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={submitting}
                  />
                  {formErrors.title && (
                    <p className="form-error" role="alert">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                <div className="form-row">
                  <label className="form-label" htmlFor="body">
                    Body
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    className="form-textarea"
                    placeholder="Write your note here…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={submitting}
                  />
                  {formErrors.body && (
                    <p className="form-error" role="alert">
                      {formErrors.body}
                    </p>
                  )}
                </div>

                <div className="form-footer">
                  <div className="form-status-wrapper">
                    {formStatus.type === 'error' && (
                      <span className="form-status form-status--error" role="alert">
                        {formStatus.message}
                      </span>
                    )}
                    {formStatus.type === 'success' && (
                      <span className="form-status form-status--success">
                        {formStatus.message}
                      </span>
                    )}
                    {formStatus.type === 'idle' && (
                      <span className="form-status">Notes are stored locally in SQLite.</span>
                    )}
                  </div>

                  <button type="submit" className="button-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save note'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
