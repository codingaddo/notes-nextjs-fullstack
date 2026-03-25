import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error('Error fetching notes', error);
    return NextResponse.json({ message: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const noteBody = typeof body.body === 'string' ? body.body.trim() : '';

    const errors: string[] = [];
    if (!title) errors.push('Title is required');
    if (!noteBody) errors.push('Body is required');

    if (errors.length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: { title, body: noteBody },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note', error);
    return NextResponse.json({ message: 'Failed to create note' }, { status: 500 });
  }
}
