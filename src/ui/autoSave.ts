export function createAutoSave(scheduleMs = 400) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let suppressed = false;

  const schedule = (save: () => void) => {
    if (suppressed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      save();
    }, scheduleMs);
  };

  const runSuppressed = (fn: () => void) => {
    suppressed = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      fn();
    } finally {
      suppressed = false;
    }
  };

  return { schedule, runSuppressed, isSuppressed: () => suppressed };
}
