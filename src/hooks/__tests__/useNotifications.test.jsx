import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Mock dependencies
vi.mock('../../context/AuthContext');
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
    }))
  }
}));

describe('useNotifications hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty notifications when no user is logged in', () => {
    useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  it('should fetch notifications when user is present', async () => {
    const mockUser = { id: 'test-user-123' };
    const mockData = [
      { id: 1, message: 'Test 1', read: false },
      { id: 2, message: 'Test 2', read: true }
    ];

    useAuth.mockReturnValue({ user: mockUser });
    
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });

    supabase.from.mockReturnValue({ select: mockSelect, eq: mockEq, order: mockOrder, limit: mockLimit });

    const { result } = renderHook(() => useNotifications());
    
    await waitFor(() => {
      expect(result.current.notifications).toEqual(mockData);
      expect(result.current.unreadCount).toBe(1);
      expect(result.current.loading).toBe(false);
    });
  });
});
