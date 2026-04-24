type NavigatePayload = {
  to: string;
  replace?: boolean;
};

type NavigateListener = (payload: NavigatePayload) => void;

const listeners = new Set<NavigateListener>();

export const publishNavigate = (payload: NavigatePayload): void => {
  listeners.forEach((listener) => {
    listener(payload);
  });
};

export const subscribeNavigate = (listener: NavigateListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
