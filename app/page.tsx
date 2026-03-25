'use client';

import { useEffect, useMemo, useState } from 'react';

interface Note {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

interface ApiError {
  message: string;
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
    const message =
      (data && typeof data === 'object' && 'error' in data && (data as ApiError).message) ||
      (data && typeof data === 'object' && 'message' in data && (data as ApiError).message) ||
      `Request failed with status ${res.status}`;
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
  const [formStatus, setFormStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>(
    { type: 'idle' }
  );

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  async function loadNotes() {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchJSON<Note[]>('/api/notes', { cache: 'no-store' });
      setNotes(data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
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
    if (!window.confirm(`Delete note \