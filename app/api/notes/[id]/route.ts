import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: 'Invalid note id' }, { status: 400 });
  }

  try {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    console.error('Error fetching note', error);
    return NextResponse.json({ message: 'Failed to fetch note' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: 'Invalid note id' }, { status: 400 });
  }

  try {
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });

    return NextResponse.json({ message: 'Note deleted', id }, { status: 200 });
  } catch (error) {
    console.error('Error deleting note', error);
    return NextResponse.json({ message: 'Failed to delete note' }, { status: 500 });
  }
}
