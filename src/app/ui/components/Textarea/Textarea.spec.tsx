import React from 'react';
import { render, screen } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea component', () => {
  test('renders with testId', () => {
    const testId = 'testId';
    render(
      <Textarea id={'description'} name={'description'} testId={testId} />,
    );
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });
});
