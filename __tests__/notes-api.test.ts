import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as listNotes, POST as createNote } from '@/app/api/notes/route';
import { DELETE as deleteNote } from '@/app/api/notes/[id]/route';

// Use a separate SQLite database file for tests
process.env.DATABASE_URL = 'file:./dev-test.db';

beforeAll(async () => {
  await prisma.$connect();
  await prisma.note.deleteMany();
});

afterAll(async () => {
  await prisma.note.deleteMany();
  await prisma.$disconnect();
});

function createJsonRequest(method: string, body: unknown) {
  const url = 'http://localhost/api/notes';
  const request = new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  } as any);
  return request;
}

describe('Notes API', () => {
  it('creates a note and lists it', async () => {
    const req = createJsonRequest('POST', { title: 'Test Note', body: 'Content' });
    const res = await createNote(req);
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.title).toBe('Test Note');

    const listRes = await listNotes();
    expect(listRes.status).toBe(200);
    const notes = await listRes.json();
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThan(0);
  });

  it('deletes a note', async () => {
    const created = await prisma.note.create({ data: { title: 'To Delete', body: 'Body' } });

    const url = `http://localhost/api/notes/${created.id}`;
    const req = new NextRequest(url, { method: 'DELETE' } as any);
    const res = await deleteNote(req, { params: { id: String(created.id) } });

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.message).toBe('Note deleted');

    const exists = await prisma.note.findUnique({ where: { id: created.id } });
    expect(exists).toBeNull();
  });
});
