'use client';

import {useCallback, useState} from 'react';
import {useFormStatus} from 'react-dom';

/**
 * Whether *this* button is the one holding up its form.
 *
 * `useFormStatus` reports that the enclosing form is submitting, but not which
 * control started it — so a form with save, skip and delete buttons would show
 * three spinners for one click. Tracking the press keeps the spinner on the
 * button actually pressed, while still letting every control lock so a second
 * action cannot be fired into a request already in flight.
 *
 * The press is cleared on the falling edge of `pending` rather than whenever
 * the form is idle. A click and the submission it starts are not guaranteed to
 * land in the same render, and clearing on "not pending" would drop the press
 * in the gap between them — the spinner would never appear at all.
 *
 * Only meaningful inside a `<form>`; elsewhere `pending` is always false and
 * this reduces to an ordinary button.
 */
export const useSubmitState = (): {
  /** This button was pressed and its form has not finished. */
  busy: boolean;
  /** The form is busy, whichever button started it. */
  formPending: boolean;
  onPress: () => void;
} => {
  const {pending} = useFormStatus();
  const [pressed, setPressed] = useState(false);
  const [wasPending, setWasPending] = useState(pending);

  // Adjusting state during render, rather than in an effect: React re-runs
  // this component immediately and never commits the intermediate result.
  if (pending !== wasPending) {
    setWasPending(pending);
    if (!pending) setPressed(false);
  }

  const onPress = useCallback(() => setPressed(true), []);

  return {busy: pending && pressed, formPending: pending, onPress};
};
