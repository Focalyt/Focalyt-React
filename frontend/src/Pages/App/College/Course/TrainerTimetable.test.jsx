import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import TrainerTimetable from './TrainerTimetable';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
const props = { backendUrl: '/api', token: 'trainer-token', onSelect: jest.fn(), onScheduleLoaded: jest.fn() };
const booking = {
  _id: 'booking-1', assignmentId: 'assignment-b8', sessionId: 'shared-session',
  dateKey: '2026-10-30', startTime: '09:00', endTime: '10:00',
  title: 'AI session', topic: 'Introduction to AI', batchId: 'b8', batchName: 'Batch B8',
  period: 'Period 1', track: 'course',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date('2026-10-30T12:00:00'));
  axios.get.mockResolvedValue({ data: { status: true, data: [booking] } });
});
afterEach(() => jest.useRealTimers());

test('shows actual booking time, batch and topic; opens the exact batch assignment', async () => {
  render(<TrainerTimetable {...props} />);
  const title = await screen.findByText('AI session');
  expect(title.closest('button')).toHaveAttribute('title', expect.stringContaining('Introduction to AI'));
  expect(screen.getByText('09:00')).toBeInTheDocument();
  expect(screen.getByText('to 10:00')).toBeInTheDocument();
  expect(screen.getByText('Today')).toBeInTheDocument();
  fireEvent.click(title.closest('button'));
  expect(props.onSelect).toHaveBeenCalledWith(booking);
  expect(axios.get).toHaveBeenCalledWith('/api/college/timetable/my-bookings', expect.objectContaining({
    headers: { 'x-auth': 'trainer-token' }, params: { from: '2026-10-26', to: '2026-11-01' },
  }));
});

test('next week requests a new range and clears the previous schedule', async () => {
  render(<TrainerTimetable {...props} />);
  await screen.findByText('AI session');
  axios.get.mockResolvedValue({ data: { status: true, data: [] } });
  fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
  await screen.findByText('No classes scheduled for this week.');
  expect(screen.queryByText('AI session')).not.toBeInTheDocument();
  expect(axios.get).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({
    params: { from: '2026-11-02', to: '2026-11-08' },
  }));
});

test('keeps different batch bookings for the same course session distinct', async () => {
  axios.get.mockResolvedValue({ data: { status: true, data: [booking, {
    ...booking, _id: 'booking-2', assignmentId: 'assignment-b9',
    batchId: 'b9', batchName: 'Batch B9', startTime: '14:00', endTime: '15:00',
  }] } });
  render(<TrainerTimetable {...props} />);
  await screen.findByText('2 scheduled classes');
  fireEvent.change(screen.getByLabelText('Batch'), { target: { value: 'b9' } });
  expect(screen.getAllByText('AI session')).toHaveLength(1);
  expect(screen.getByText('14:00')).toBeInTheDocument();
  expect(screen.queryByText('09:00')).not.toBeInTheDocument();
});

test('reports a failed request and retries without showing it as an empty week', async () => {
  axios.get.mockRejectedValueOnce(new Error('Unable to load classes'));
  render(<TrainerTimetable {...props} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load classes');
  expect(screen.queryByText('No classes scheduled for this week.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(screen.getByText('AI session')).toBeInTheDocument());
});
