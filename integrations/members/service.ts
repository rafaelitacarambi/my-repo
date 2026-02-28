/**
 * Mock Members Service
 */
import { Member } from ".";

export const getCurrentMember = async (): Promise<Member | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('member-store');
    if (stored) {
      const state = JSON.parse(stored);
      if (state.member) return state.member;
    }
  } catch (e) {
    console.error('Error reading member from storage:', e);
  }

  return null;
};

