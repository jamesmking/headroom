import {ButtonLink} from '@/components/button-link';
import {settingsPath} from '@/routes';
import styles from './role-required.module.scss';

/**
 * Shown in place of the meeting or task form when there is nothing to file the
 * new record under.
 *
 * Every meeting and task belongs to a role, so an account with no roles cannot
 * create either. Putting the explanation inside the form rather than disabling
 * each add control means every entry point — the panel button, a gap in the
 * day, a slot in the week — explains itself the same way.
 */
export const RoleRequired = ({noun}: {noun: 'meeting' | 'task'}) => (
  <div className={styles.Prompt}>
    <p className={styles.Headline}>Create a role first</p>
    <p>
      {`Every ${noun} belongs to a role — that is what lets Headroom show you where your time
      actually goes. Add one in Settings and this form will be ready.`}
    </p>
    <ButtonLink href={settingsPath()}>Go to Settings</ButtonLink>
  </div>
);
