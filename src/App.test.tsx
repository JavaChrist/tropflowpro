import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders React TypeScript TailwindCSS title', () => {
  render(<App />);
  const titleElement = screen.getByText(/React \+ TypeScript \+ TailwindCSS/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders success message', () => {
  render(<App />);
  const successMessage = screen.getByText(/Configuration réussie/i);
  expect(successMessage).toBeInTheDocument();
});
