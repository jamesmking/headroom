'use client';

import clsx from 'clsx';
import {Archive, ChevronDown, ChevronUp, Pencil, Plus, RotateCcw} from 'lucide-react';
import {useActionState, useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '@/components/button';
import {EmptyState} from '@/components/empty-state';
import {Field, fieldStyles} from '@/components/field';
import {FormMessage} from '@/components/form-message';
import {Panel} from '@/components/panel';
import {deleteEmptyRole, moveRole, toggleRoleActive} from '@/features/roles/actions/quick-actions';
import {saveRoleAction} from '@/features/roles/actions/role-actions';
import type {RoleView} from '@/features/roles/queries/get-roles';
import {type Direction, canMove} from '@/features/roles/reorder';
import {idleResult} from '@/lib/action-result';
import styles from './role-manager.module.scss';

/** Distinct, AA-safe starting colours for a new role. */
const SUGGESTED_COLOURS = ['#3373b0', '#2f9e6f', '#d9822b', '#8e6bbf', '#b03024', '#0f7b8a'];

export const RoleManager = ({roles}: {roles: RoleView[]}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // A ref rather than state: this records an intention for the next render and
  // must not itself cause one.
  const pendingFocus = useRef<{id: string; direction: Direction} | null>(null);

  /**
   * Move the keyboard focus with the role that just moved, rather than leaving
   * it on whatever row has taken that position. Without this, pressing "move
   * up" twice would move two different roles.
   */
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;

    const select = (direction: Direction) =>
      document.querySelector<HTMLButtonElement>(
        `[data-role-move="${pending.id}"][data-direction="${direction}"]`
      );

    // At the end of the list that button is disabled, so fall back to the
    // other one and keep focus on the role the user was moving.
    const wanted = select(pending.direction);
    const target =
      wanted && !wanted.disabled ? wanted : select(pending.direction === 'up' ? 'down' : 'up');

    target?.focus();
  }, [roles]);

  const close = useCallback(() => {
    setAdding(false);
    setEditingId(null);
  }, []);

  const active = roles.filter(role => role.active);
  const archived = roles.filter(role => !role.active);
  const editing = editingId ? (roles.find(role => role.id === editingId) ?? null) : null;

  return (
    <Panel
      title="Roles and teams"
      meta={active.length > 0 ? `${active.length} active` : undefined}
      flush
      actions={
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
        >
          <Plus size={14} aria-hidden="true" />
          Add role
        </Button>
      }
    >
      {adding && (
        <RoleForm
          key="create"
          suggestedColour={SUGGESTED_COLOURS[roles.length % SUGGESTED_COLOURS.length]}
          onDone={close}
        />
      )}
      {editing && <RoleForm key={editing.id} role={editing} onDone={close} />}

      {roles.length === 0 ? (
        <EmptyState
          message="No roles yet."
          hint="Add one for each team you work across, then give each a colour."
        />
      ) : (
        <>
          <p className={styles.Hint}>
            This order is used everywhere roles are listed — the role filter on Tasks and the role
            menus on meetings and tasks.
          </p>
          <div className={styles.Manager}>
            {active.map((role, index) => (
              <RoleRow
                key={role.id}
                role={role}
                index={index}
                groupSize={active.length}
                onEdit={setEditingId}
                onMove={pending => (pendingFocus.current = pending)}
              />
            ))}
            {archived.map((role, index) => (
              <RoleRow
                key={role.id}
                role={role}
                index={index}
                groupSize={archived.length}
                onEdit={setEditingId}
                onMove={pending => (pendingFocus.current = pending)}
              />
            ))}
          </div>
        </>
      )}
    </Panel>
  );
};

const RoleRow = ({
  role,
  index,
  groupSize,
  onEdit,
  onMove,
}: {
  role: RoleView;
  /** Position within its own group, so moves match what is on screen. */
  index: number;
  groupSize: number;
  onEdit: (id: string) => void;
  onMove: (pending: {id: string; direction: Direction}) => void;
}) => {
  const historyCount = role.meetingCount + role.taskCount;

  return (
    <div
      className={clsx(styles.Row, !role.active && styles.Archived)}
      style={{'--role-colour': role.colour} as React.CSSProperties}
    >
      <form action={moveRole} className={styles.Reorder}>
        <input type="hidden" name="id" value={role.id} />
        <button
          type="submit"
          name="direction"
          value="up"
          data-role-move={role.id}
          data-direction="up"
          className={styles.Move}
          disabled={!canMove(index, groupSize, 'up')}
          onClick={() => onMove({id: role.id, direction: 'up'})}
        >
          <ChevronUp size={12} aria-hidden="true" />
          <span className="sr-only">{`Move ${role.name} up`}</span>
        </button>
        <button
          type="submit"
          name="direction"
          value="down"
          data-role-move={role.id}
          data-direction="down"
          className={styles.Move}
          disabled={!canMove(index, groupSize, 'down')}
          onClick={() => onMove({id: role.id, direction: 'down'})}
        >
          <ChevronDown size={12} aria-hidden="true" />
          <span className="sr-only">{`Move ${role.name} down`}</span>
        </button>
      </form>

      <span className={styles.Swatch} aria-hidden="true" />

      <div className={styles.Info}>
        <span className={styles.Name}>
          {role.name}
          <span className={styles.Short}>{role.shortName}</span>
          {!role.active && <span className={styles.Badge}>Archived</span>}
        </span>
        {role.description && <p className={styles.Description}>{role.description}</p>}
        {historyCount > 0 && (
          <p className={styles.History}>
            {role.meetingCount} {role.meetingCount === 1 ? 'meeting' : 'meetings'} ·{' '}
            {role.taskCount} {role.taskCount === 1 ? 'task' : 'tasks'}
          </p>
        )}
      </div>

      <div className={styles.Controls}>
        <Button variant="ghost" size="small" onClick={() => onEdit(role.id)}>
          <Pencil size={13} aria-hidden="true" />
          Edit
        </Button>

        <form action={toggleRoleActive}>
          <input type="hidden" name="id" value={role.id} />
          <input type="hidden" name="active" value={role.active ? 'false' : 'true'} />
          <Button type="submit" variant="ghost" size="small">
            {role.active ? (
              <>
                <Archive size={13} aria-hidden="true" />
                Archive
              </>
            ) : (
              <>
                <RotateCcw size={13} aria-hidden="true" />
                Restore
              </>
            )}
          </Button>
        </form>

        {/* Deleting is only offered when nothing would be lost. */}
        {historyCount === 0 && (
          <form action={deleteEmptyRole}>
            <input type="hidden" name="id" value={role.id} />
            <Button type="submit" variant="ghost" size="small">
              Delete
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

const RoleForm = ({
  role,
  suggestedColour,
  onDone,
}: {
  role?: RoleView;
  suggestedColour?: string;
  onDone: () => void;
}) => {
  const [result, formAction] = useActionState(saveRoleAction, idleResult);
  const errors = result.fieldErrors ?? {};

  useEffect(() => {
    if (result.status === 'success') onDone();
  }, [result, onDone]);

  return (
    <form action={formAction} className={styles.Form}>
      <p className={styles.Legend}>{role ? 'Edit role' : 'New role'}</p>
      {role && <input type="hidden" name="id" value={role.id} />}

      <FormMessage result={result} />

      <div className={styles.Grid}>
        <Field label="Name" error={errors.name}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="name"
              className={fieldStyles.Input}
              defaultValue={role?.name ?? ''}
              placeholder="Payments"
              maxLength={60}
              required
              autoFocus
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Short name" hint="Shown on meetings and tasks." error={errors.shortName}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="shortName"
              className={fieldStyles.Input}
              defaultValue={role?.shortName ?? ''}
              placeholder="PAY"
              maxLength={8}
              required
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Colour" error={errors.colour}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="colour"
              type="color"
              className={styles.Colour}
              defaultValue={role?.colour ?? suggestedColour ?? '#3373b0'}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Description" optional error={errors.description} className={styles.Full}>
          {({id, describedBy, invalid}) => (
            <input
              id={id}
              name="description"
              className={fieldStyles.Input}
              defaultValue={role?.description ?? ''}
              maxLength={280}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>
      </div>

      <div className={styles.Footer}>
        <Button type="submit" pendingAware>
          {role ? 'Save role' : 'Add role'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
