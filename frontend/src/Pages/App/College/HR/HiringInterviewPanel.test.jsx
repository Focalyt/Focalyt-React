import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import HiringInterviewPanel from './HiringInterviewPanel';

jest.mock('axios', () => ({ get: jest.fn(), put: jest.fn() }));
const details = { hiring: { status: 'shortlisted', comment: '', eventDate: null, concernedPerson: '', jobId: 'job' },
  company: { id: 'company', name: 'Example Company' }, job: { id: 'job', title: 'Sales' }, executives: [{ id: 'person', name: 'Recruiter' }] };
const profile = { _id: 'application', _candidate: { name: 'Amit Kumar' }, _course: { name: 'Sales' }, corporateHiringStatus: details.hiring };

beforeEach(() => {
  jest.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  axios.get.mockResolvedValue({ data: { success: true, data: details } });
});

test('displays saved hiring stage and loads company details only when opened', async () => {
  render(<HiringInterviewPanel profile={profile} token="auth-token" backendUrl="/api" />);
  expect(screen.getByText('Shortlisted')).toBeInTheDocument();
  expect(axios.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Manage hiring' }));
  expect(await screen.findByText('Example Company')).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith('/api/college/hr/leads/application/hiring', expect.objectContaining({ headers: { 'x-auth': 'auth-token' } }));
  expect(screen.getByLabelText('Concerned person')).toHaveDisplayValue('Not assigned');
});

test('saves interview time in UTC using the IST entered by HR and updates the card', async () => {
  const onSaved = jest.fn();
  const hiring = { ...details.hiring, status: 'interview due', eventDate: '2099-01-01T09:00:00.000Z' };
  axios.put.mockResolvedValue({ data: { success: true, data: { ...details, hiring } } });
  render(<HiringInterviewPanel profile={profile} token="token" backendUrl="/api" onSaved={onSaved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Manage hiring' }));
  await screen.findByText('Example Company');
  fireEvent.change(screen.getByLabelText('Hiring stage'), { target: { value: 'interview due' } });
  fireEvent.change(screen.getByLabelText('Event date & time · IST'), { target: { value: '2099-01-01T14:30' } });
  fireEvent.change(screen.getByLabelText('Concerned person'), { target: { value: 'person' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save hiring details' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(hiring, 'company'));
  expect(axios.put).toHaveBeenCalledWith('/api/college/hr/leads/application/hiring', expect.objectContaining({ status: 'interview due', eventDate: '2099-01-01T09:00:00.000Z', concernedPerson: 'person' }), expect.anything());
  expect(screen.getByText('Interview Due')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('keeps edits and displays server errors when saving fails', async () => {
  axios.put.mockRejectedValue({ response: { data: { message: 'Unable to save hiring details.' } } });
  render(<HiringInterviewPanel profile={profile} token="token" backendUrl="/api" />);
  fireEvent.click(screen.getByRole('button', { name: 'Manage hiring' }));
  await screen.findByText('Example Company');
  fireEvent.change(screen.getByLabelText('Comment / interview notes'), { target: { value: 'Keep this note' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save hiring details' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save hiring details.');
  expect(screen.getByLabelText('Comment / interview notes')).toHaveValue('Keep this note');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('allows retry after a loading error', async () => {
  axios.get.mockRejectedValueOnce(new Error('Network error'));
  render(<HiringInterviewPanel profile={profile} token="token" backendUrl="/api" />);
  fireEvent.click(screen.getByRole('button', { name: 'Manage hiring' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('Example Company')).toBeInTheDocument();
});
