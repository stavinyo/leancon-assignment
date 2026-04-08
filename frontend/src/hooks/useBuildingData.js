import { useState, useEffect } from 'react';

const API = 'http://127.0.0.1:5001';

export const useBuildingData = () => {
  const [data, setData]       = useState(null);
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAll = async () => {
      try {
        const [dataRes, filesRes] = await Promise.all([
          fetch(`${API}/api/model-data`, { signal }),
          fetch(`${API}/api/files`,      { signal }),
        ]);

        if (!dataRes.ok)  throw new Error(`model-data: ${dataRes.status}`);
        if (!filesRes.ok) throw new Error(`files: ${filesRes.status}`);

        const [dataJson, filesJson] = await Promise.all([
          dataRes.json(),
          filesRes.json(),
        ]);

        setData(dataJson);
        setFiles(filesJson);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to fetch IFC data', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, []);

  return { data, files, loading, error };
};
