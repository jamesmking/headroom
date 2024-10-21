import React from 'react';
import { render, screen } from '@testing-library/react';
import { Radios } from './Radios';

describe('Radios component', () => {
  test('renders with testId', () => {
    const testId = 'testId';
    const options = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
    render(
      <Radios
        label={'Make a selection'}
        name={'country'}
        testId={testId}
        options={options}
      />,
    );
    const element = screen.getByTestId(testId);
    expect(element).toBeTruthy();
  });
});
