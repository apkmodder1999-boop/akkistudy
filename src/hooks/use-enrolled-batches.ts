import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "akki_enrolled_batches_v1";
const EVENT_NAME = "akki-enrolled-changed";

function getStoredEnrolledIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEnrolledIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // ignore quota errors
  }
}

export function useEnrolledBatches() {
  const [enrolledIds, setEnrolledIds] = useState<string[]>(getStoredEnrolledIds);

  useEffect(() => {
    const update = () => {
      setEnrolledIds(getStoredEnrolledIds());
    };

    window.addEventListener(EVENT_NAME, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(EVENT_NAME, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const isEnrolled = useCallback(
    (batchId: string) => {
      return enrolledIds.includes(batchId);
    },
    [enrolledIds],
  );

  const enroll = useCallback((batchId: string, batchName?: string) => {
    if (!batchId) return;
    const current = getStoredEnrolledIds();
    if (!current.includes(batchId)) {
      const next = [batchId, ...current];
      saveEnrolledIds(next);
      setEnrolledIds(next);
      toast.success(batchName ? `Enrolled in "${batchName}"` : "Successfully enrolled!", {
        description: "Access it anytime from the Enrolled Batches tab.",
      });
    }
  }, []);

  const unenroll = useCallback((batchId: string, batchName?: string) => {
    if (!batchId) return;
    const current = getStoredEnrolledIds();
    if (current.includes(batchId)) {
      const next = current.filter((id) => id !== batchId);
      saveEnrolledIds(next);
      setEnrolledIds(next);
      toast.info(batchName ? `Removed "${batchName}"` : "Unenrolled from batch", {
        description: "Batch removed from your enrolled list.",
      });
    }
  }, []);

  const toggleEnroll = useCallback(
    (batchId: string, batchName?: string) => {
      if (isEnrolled(batchId)) {
        unenroll(batchId, batchName);
      } else {
        enroll(batchId, batchName);
      }
    },
    [isEnrolled, enroll, unenroll],
  );

  return {
    enrolledIds,
    enrolledCount: enrolledIds.length,
    isEnrolled,
    enroll,
    unenroll,
    toggleEnroll,
  };
}
