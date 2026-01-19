import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'trainwell_install_prompt';
const DAYS_BEFORE_SHOWING = 3;
const MAX_SHOW_COUNT = 5;

interface InstallPromptState {
  showCount: number;
  loginCount: number;
  dismissed: boolean;
  signupDate: string | null;
}

const getStoredState = (): InstallPromptState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    showCount: 0,
    loginCount: 0,
    dismissed: false,
    signupDate: null,
  };
};

const saveState = (state: InstallPromptState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

export const useInstallPrompt = (profileCreatedAt: string | null) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [state, setState] = useState<InstallPromptState>(getStoredState);

  useEffect(() => {
    if (!profileCreatedAt) return;

    const currentState = getStoredState();
    
    // Initialize signup date if not set
    if (!currentState.signupDate) {
      currentState.signupDate = profileCreatedAt;
      saveState(currentState);
    }

    // Check if user signed up more than 3 days ago
    const signupDate = new Date(currentState.signupDate || profileCreatedAt);
    const now = new Date();
    const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceSignup < DAYS_BEFORE_SHOWING) {
      setShouldShow(false);
      return;
    }

    // Check if already shown 5 times
    if (currentState.showCount >= MAX_SHOW_COUNT) {
      setShouldShow(false);
      return;
    }

    // Increment login count for this session
    const newLoginCount = currentState.loginCount + 1;
    
    // Show on alternate logins (odd login counts: 1, 3, 5, 7, 9)
    const isAlternateLogin = newLoginCount % 2 === 1;
    
    // Update state
    const newState = {
      ...currentState,
      loginCount: newLoginCount,
    };
    
    if (isAlternateLogin && currentState.showCount < MAX_SHOW_COUNT) {
      newState.showCount = currentState.showCount + 1;
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
    
    saveState(newState);
    setState(newState);
  }, [profileCreatedAt]);

  const dismiss = useCallback(() => {
    setShouldShow(false);
  }, []);

  const remindLater = useCallback(() => {
    setShouldShow(false);
  }, []);

  return {
    shouldShow,
    dismiss,
    remindLater,
    showCount: state.showCount,
  };
};
