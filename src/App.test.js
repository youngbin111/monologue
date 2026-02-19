import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main navigation items', () => {
  render(<App />);
  expect(screen.getByText('나의 독백')).toBeInTheDocument();
  expect(screen.getAllByText('다른 독백들').length).toBeGreaterThan(0);
  expect(screen.getByText('마이페이지')).toBeInTheDocument();
});
