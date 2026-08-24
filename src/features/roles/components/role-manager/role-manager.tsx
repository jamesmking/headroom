'use client';

import clsx from 'clsx';
import {Archive, Pencil, Plus, RotateCcw} from 'lucide-react';
import {useActionState, useCallback, useEffect, useState} from 'react';
import {Button} from '@/components/button';
import {EmptyState} from '@/components/empty-state';
import {Field, fieldStyles} from '@/components/field';
import {FormMessage} from '@/components/form-message';
import {Panel} from '@/components/panel';
import {deleteEmptyRole, toggleRoleActive} from '@/features/roles/actions/quick-actions';
import {saveRoleAction} from '@/features/roles/actions/role-actions';
import type {RoleView} from '@/features/roles/queries/get-roles';
import {idleResult} from '@/lib/action-result';
import styles from './role-manager.module.scss';

/** Distinct, AA-safe starting colours for a new role. */
const SUGGESTED_COLOURS = ['#3373b0', '#2f9e6f', '#d9822b', '#8e6bbf', '#b03024', '#0f7b8a'];

export const RoleManager = ({roles}: {roles: RoleView[]}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

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
        <div className={styles.Manager}>
          {[...active, ...archived].map(role => (
            <RoleRow key={role.id} role={role} onEdit={setEditingId} />
          ))}
        </div>
      )}
    </Panel>
  );
};

const RoleRow = ({role, onEdit}: {role: RoleView; onEdit: (id: string) => void}) => {
  const historyCount = role.meetingCount + role.taskCount;

  return (
    <div
      className={clsx(styles.Row, !role.active && styles.Archived)}
      style={{'--role-colour': role.colour} as React.CSSProperties}
    >
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
