import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './Home'; // Adjust path to your Home component

describe('Home Component', () => {
  it('should render the main heading', () => {
    // You'll need to wrap Home in any required providers (like Router, Redux, etc.)
    // For this example, we'll assume it renders without them.
    render(<Home />);

    // Check if the main hero heading is visible.
    expect(screen.getByText(/Report Local Issues\\./i)).toBeInTheDocument();
  });
});

