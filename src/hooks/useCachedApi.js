import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiUrl } from '../services/api';

const cache = new Map();

const getCacheEntry = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  return entry;
};

const setCacheEntry = (key, value) => {
  cache.set(key, value);
};

const buildKey = (endpoint) => String(endpoint || '');

export const prefetchCachedApi = async (endpoint) => {
  const key = buildKey(endpoint);
  const existing = getCacheEntry(key);
  if (existing && existing?.promise) return existing.promise;

  const token = localStorage.getItem('token');
  if (!token) return null;

  const controller = new AbortController();
  const promise = fetch(getApiUrl(endpoint), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    signal: controller.signal
  })
    .then(async (res) => {
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message || `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        throw err;
      }
      const entry = {
        data: json,
        fetchedAt: Date.now()
      };
      setCacheEntry(key, entry);
      return json;
    })
    .finally(() => {
      const after = getCacheEntry(key);
      if (after?.promise) {
        const { promise: _p, controller: _c, ...rest } = after;
        setCacheEntry(key, rest);
      }
    });

  setCacheEntry(key, {
    ...(existing || {}),
    promise,
    controller
  });

  return promise;
};

export const useCachedApi = (endpoint, { ttlMs = 30_000 } = {}) => {
  const key = buildKey(endpoint);
  const [data, setData] = useState(() => getCacheEntry(key)?.data ?? null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(() => !getCacheEntry(key)?.data);
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchNow = useCallback(async ({ background = false } = {}) => {
    if (!endpoint) return null;

    const token = localStorage.getItem('token');
    if (!token) {
      if (!background) setLoading(false);
      return null;
    }

    if (background) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const json = await fetch(getApiUrl(endpoint), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const message = body?.message || `Request failed (${res.status})`;
          const err = new Error(message);
          err.status = res.status;
          throw err;
        }
        return body;
      });

      const entry = {
        data: json,
        fetchedAt: Date.now()
      };
      setCacheEntry(key, entry);

      if (mountedRef.current) {
        setData(json);
      }

      return json;
    } catch (e) {
      if (mountedRef.current) setError(e);
      return null;
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint, key]);

  useEffect(() => {
    if (!endpoint) {
      setData(null);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const existing = getCacheEntry(key);
    if (existing?.data) {
      setData(existing.data);
      setLoading(false);

      const age = Date.now() - (existing.fetchedAt || 0);
      if (age > ttlMs) {
        fetchNow({ background: true });
      }
    } else {
      fetchNow({ background: false });
    }
  }, [endpoint, key, ttlMs, fetchNow]);

  const refetch = useCallback(() => fetchNow({ background: false }), [fetchNow]);

  return {
    data,
    error,
    loading,
    refreshing,
    refetch
  };
};
