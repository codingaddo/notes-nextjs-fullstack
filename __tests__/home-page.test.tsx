import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '@/app/page';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch as any;
  jest.resetAllMocks();
});

describe('HomePage UI', () => {
  it('renders header and basic layout', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '[]',
    });

    render(<HomePage />);

    expect(await screen.findByText('Purple Notes')).toBeInTheDocument();
    expect(screen.getByText(/Capture quick thoughts/i)).toBeInTheDocument();
    expect(screen.getByText('Your notes')).toBeInTheDocument();
    expect(screen.getByText('New note')).toBeInTheDocument();
  });

  it('creates a note successfully', async () => {
    // Initial GET
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '[]',
    });

    const createdNote = {
      id: 1,
      title: 'Test note',
      body: 'Body',
      createdAt: new Date().toISOString(),
    };

    // POST /api/notes
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () => JSON.stringify(createdNote),
    });

    render(<HomePage />);

    fireEvent.change(await screen.findByLabelText('Title'), {
      target: { value: 'Test note' },
    });
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'Body' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save note/i }));

    await waitFor(() => {
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });
  });

  it('deletes a note', async () => {
    const note = {
      id: 1,
      title: 'To delete',
      body: 'Body',
      createdAt: new Date().toISOString(),
    };

    // Initial GET
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([note]),
    });

    // DELETE /api/notes/1
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: 'Note deleted' }),
    });

    // Mock confirm dialog
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<HomePage />);

    const deleteButton = await screen.findByRole('button', { name: /delete note/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('To delete')).not.toBeInTheDocument();
    });

    window.confirm = originalConfirm;
  });
});
