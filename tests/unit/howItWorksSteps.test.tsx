import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@/i18n';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';

const steps = () => screen.getAllByRole('tab');
const selected = () => screen.getByRole('tab', { selected: true });

describe('how-it-works steps', () => {
  afterEach(() => vi.useRealTimers());

  it('switches the excerpt as soon as the mouse moves onto a step', () => {
    render(<HowItWorksSection />);
    fireEvent.pointerMove(steps()[1], { pointerType: 'mouse' });
    expect(selected()).toBe(steps()[1]);
  });

  it('keeps the excerpt when a step scrolls under a resting pointer', () => {
    vi.useFakeTimers();
    render(<HowItWorksSection />);
    // Scrolling fires enter/over events at the resting pointer, but no pointermove.
    fireEvent.mouseEnter(steps()[2]);
    act(() => vi.advanceTimersByTime(1000));
    expect(selected()).toBe(steps()[0]);
  });

  it('ignores touch drags across the steps', () => {
    render(<HowItWorksSection />);
    fireEvent.pointerMove(steps()[2], { pointerType: 'touch' });
    expect(selected()).toBe(steps()[0]);
  });
});
