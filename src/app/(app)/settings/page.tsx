import type {Metadata} from 'next';
import {Panel} from '@/components/panel';
import {requireUser} from '@/features/auth/queries/get-current-user';
import {RoleManager} from '@/features/roles/components/role-manager';
import {getAllRoles} from '@/features/roles/queries/get-roles';
import {FamilyCalendarForm} from '@/features/settings/components/family-calendar-form';
import {WorkingDayForm} from '@/features/settings/components/working-day-form';
import {getSettings} from '@/features/settings/queries/get-settings';
import styles from './page.module.scss';

export const metadata: Metadata = {title: 'Settings'};

export const dynamic = 'force-dynamic';

/** A short, sensible list first, then everything else the platform knows. */
const timeZoneOptions = (current: string): string[] => {
  const common = [
    'Europe/London',
    'Europe/Dublin',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Australia/Sydney',
  ];

  const all =
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];

  return [...new Set([current, ...common, ...all])];
};

const SettingsPage = async () => {
  const user = await requireUser();
  const [settings, roles] = await Promise.all([getSettings(user.id), getAllRoles(user.id)]);

  return (
    <div className={styles.Page}>
      <header>
        <span className={styles.Eyebrow}>Settings</span>
        <h1 className={styles.Heading}>Settings</h1>
      </header>

      <RoleManager roles={roles} />

      <Panel title="Working day">
        <WorkingDayForm
          startMinutes={settings.workdayStartMinutes}
          endMinutes={settings.workdayEndMinutes}
          timeZone={settings.timeZone}
          timeZones={timeZoneOptions(settings.timeZone)}
        />
      </Panel>

      <Panel title="Family calendar">
        <FamilyCalendarForm
          hasIcalUrl={settings.hasIcalUrl}
          icalHost={settings.icalHost}
          enabled={settings.familyCalendarEnabled}
        />
      </Panel>

      <Panel title="Account">
        <dl className={styles.Account}>
          <dt className={styles.Term}>Name</dt>
          <dd className={styles.Value}>{user.name ?? 'Not provided by Google'}</dd>

          <dt className={styles.Term}>Email</dt>
          <dd className={styles.Value}>{user.email}</dd>

          <dt className={styles.Term}>Sign-in</dt>
          <dd className={styles.Value}>Google</dd>
        </dl>
        <p className={styles.Note}>
          Access is controlled by the ALLOWED_EMAILS environment variable on the server. To let
          someone else in, add their address there and restart the application.
        </p>
      </Panel>
    </div>
  );
};

export default SettingsPage;
