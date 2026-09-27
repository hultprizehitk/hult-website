"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { firebaseClient } from "@/lib/firebase/client";

export interface Live<T> {
  data: T;
  loading: boolean;
  /** Document exists (docs only). */
  exists: boolean;
  /** Had server data, now serving cache: connection lost. */
  offline: boolean;
  error: Error | null;
}

type Inner<T> = Omit<Live<T>, "loading"> & { path: string | null; synced: boolean };

/**
 * Live single-document listener (no polling). `path = null` = not listening yet.
 * State is keyed by path, so switching paths never shows the previous document.
 */
export function useDocData<T>(path: string | null): Live<T | null> {
  const [s, setS] = useState<Inner<T | null>>({ path: null, data: null, exists: false, offline: false, error: null, synced: false });
  useEffect(() => {
    if (!path) return;
    const { db } = firebaseClient();
    return onSnapshot(
      doc(db, path),
      { includeMetadataChanges: true },
      (snap) =>
        setS((prev) => {
          const synced = (prev.path === path && prev.synced) || !snap.metadata.fromCache;
          return { path, data: snap.exists() ? (snap.data() as T) : null, exists: snap.exists(), offline: synced && snap.metadata.fromCache, error: null, synced };
        }),
      (error) => setS((prev) => ({ ...prev, path, error })),
    );
  }, [path]);
  const current = s.path === path && path !== null;
  return { data: current ? s.data : null, exists: current && s.exists, loading: path !== null && !current, offline: current && s.offline, error: current ? s.error : null };
}

/** Live collection listener ordered by one field. */
export function useCollectionData<T>(path: string | null, orderField: string): Live<T[]> {
  const [s, setS] = useState<Inner<T[]>>({ path: null, data: [], exists: false, offline: false, error: null, synced: false });
  useEffect(() => {
    if (!path) return;
    const { db } = firebaseClient();
    return onSnapshot(
      query(collection(db, path), orderBy(orderField)),
      { includeMetadataChanges: true },
      (snap) =>
        setS((prev) => {
          const synced = (prev.path === path && prev.synced) || !snap.metadata.fromCache;
          return { path, data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T), exists: true, offline: synced && snap.metadata.fromCache, error: null, synced };
        }),
      (error) => setS((prev) => ({ ...prev, path, error })),
    );
  }, [path, orderField]);
  const current = s.path === path && path !== null;
  return { data: current ? s.data : [], exists: current, loading: path !== null && !current, offline: current && s.offline, error: current ? s.error : null };
}
