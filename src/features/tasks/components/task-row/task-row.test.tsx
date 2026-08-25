import {act, fireEvent, render, screen} from '@testing-library/react';
import type {TaskView} from '@/features/tasks/types';
import {TaskRow} from './task-row';

/**
 * The actions never settle, so anything the row shows during these tests is
 * showing *before* the server has answered — which is the whole point.
 *
 * Declared inline because `jest.mock` is hoisted above the file's own
 * definitions.
 */
jest.mock('@/features/tasks/actions/quick-actions', () => {
  const neverSettles = () => new Promise<void>(() => {});
  return {
    moveTaskStatus: jest.fn(neverSettles),
    addTaskToPlan: jest.fn(neverSettles),
    removeTaskFromPlan: jest.fn(neverSettles),
  };
});

const task = (over: Partial<TaskView> = {}): TaskView => ({
  id: 'task-1',
  title: 'Review the release notes',
  jiraUrl: null,
  dueDate: null,
  status: 'BACKLOG',
  notes: null,
  role: {id: 'role-1', name: 'Platform', shortName: 'PLAT', colour: '#1f5f9e'},
  completedAt: null,
  onTodaysPlan: false,
  ...over,
});

const renderRow = (over: Partial<TaskView> = {}) =>
  render(<TaskRow task={task(over)} planDate="2026-08-25" today="2026-08-25" />);

const press = (button: HTMLElement) =>
  act(async () => {
    fireEvent.click(button);
  });

/**
 * The status control is not covered here, and cannot be: it identifies the
 * pressed button by its submitted name and value, and jsdom's `FormData`
 * ignores the submitter argument entirely — `new FormData(form, button)`
 * returns the same entries as `new FormData(form)`. Real browsers implement it
 * per spec. The plan toggle exercises the same optimistic mechanism through a
 * path jsdom can drive.
 */
describe('TaskRow', () => {
  it('flips the plan control before the server has answered', async () => {
    renderRow();

    await press(screen.getByRole('button', {name: /Add .* to today's work/i}));

    expect(screen.getByRole('button', {name: /Remove .* from today's work/i})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /Add .* to today's work/i})).toBeNull();
  });

  it('flips back the other way too', async () => {
    renderRow({onTodaysPlan: true});

    await press(screen.getByRole('button', {name: /Remove .* from today's work/i}));

    expect(screen.getByRole('button', {name: /Add .* to today's work/i})).toBeInTheDocument();
  });
});
