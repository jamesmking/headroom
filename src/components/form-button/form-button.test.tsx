import {act, fireEvent, render, screen} from '@testing-library/react';
import {FormButton} from './form-button';

/**
 * The behaviour worth testing is not "a spinner exists" but *which* button
 * gets one. A form shares a single pending state, so without tracking the
 * press, one click would spin every button in the form at once.
 */
const deferred = () => {
  let resolve!: () => void;
  const settled = new Promise<void>(r => {
    resolve = r;
  });
  // Resolving is not enough on its own: the pending state only clears once
  // React has seen the promise settle, so the await belongs inside `act`.
  const finish = () =>
    act(async () => {
      resolve();
      await settled;
    });
  return {settled, finish};
};

/** Click, and let React commit the resulting pending state. */
const press = (button: HTMLElement) =>
  act(async () => {
    fireEvent.click(button);
  });

describe('FormButton', () => {
  it('acknowledges only the button that was pressed', async () => {
    const {settled, finish} = deferred();
    render(
      <form action={async () => settled}>
        <FormButton spinner>Save</FormButton>
        <FormButton spinner>Delete</FormButton>
      </form>
    );

    await press(screen.getByRole('button', {name: 'Save'}));

    expect(screen.getByRole('button', {name: 'Save'})).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', {name: 'Delete'})).not.toHaveAttribute('aria-busy');

    await finish();
  });

  it('locks every control in the form, so a second action cannot be fired', async () => {
    const {settled, finish} = deferred();
    render(
      <form action={async () => settled}>
        <FormButton>Save</FormButton>
        <FormButton>Delete</FormButton>
      </form>
    );

    await press(screen.getByRole('button', {name: 'Save'}));

    expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Delete'})).toBeDisabled();

    await finish();
  });

  it('releases the form once the action settles', async () => {
    const {settled, finish} = deferred();
    render(
      <form action={async () => settled}>
        <FormButton>Save</FormButton>
      </form>
    );

    await press(screen.getByRole('button', {name: 'Save'}));
    expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled();

    await finish();

    const save = screen.getByRole('button', {name: 'Save'});
    expect(save).not.toBeDisabled();
    expect(save).not.toHaveAttribute('aria-busy');
  });

  it('runs the action once however many times the button is pressed', async () => {
    const {settled, finish} = deferred();
    const action = jest.fn(async () => settled);
    render(
      <form action={action}>
        <FormButton>Save</FormButton>
      </form>
    );

    const save = screen.getByRole('button', {name: 'Save'});
    await press(save);
    await press(save);

    expect(action).toHaveBeenCalledTimes(1);
    await finish();
  });

  it('behaves as an ordinary button outside a form', async () => {
    const onClick = jest.fn();
    render(<FormButton onClick={onClick}>Alone</FormButton>);

    const button = screen.getByRole('button', {name: 'Alone'});
    expect(button).not.toBeDisabled();

    await press(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
