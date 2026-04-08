import React, { useEffect, useRef, useState } from 'react';
import * as OBCF from "@thatopen/components-front";
import {
  highlightByGuids,
  initBimEngine,
  ensureLoaderSetup,
  loadIfcFromBuffer,
  fitCameraToModels,
} from '../../utils/BimUtils';
import './Viewer.css';

const API = 'http://127.0.0.1:5001';

const Viewer = ({ selectedGuids = [], files = [] }) => {
  const containerRef = useRef(null);
  const componentsRef = useRef(null);
  const worldRef = useRef(null);
  const modelsRef = useRef([]);

  const [loadingText, setLoadingText] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!files.length) return;

    let isMounted = true;

    const setupViewer = async () => {
      if (!containerRef.current || componentsRef.current) return;

      const { components, world } = initBimEngine(containerRef.current);
      componentsRef.current = components;
      worldRef.current = world;

      try {
        if (!isMounted) return;
        setLoadingText('Initializing engine...');
        await ensureLoaderSetup(components);

        if (!isMounted) return;
        setLoadingText('Downloading models...');
        const downloads = await Promise.all(
          files.map(async (file) => {
            const res = await fetch(`${API}/api/get-ifc?file=${encodeURIComponent(file)}`);
            return { file, buffer: new Uint8Array(await res.arrayBuffer()) };
          })
        );

        const loaded = [];
        for (let i = 0; i < downloads.length; i++) {
          if (!isMounted) return;
          const { file, buffer } = downloads[i];
          const label = file.replace(/\.ifc$/i, '');
          setLoadingText(`Processing ${label} (${i + 1}/${downloads.length})...`);

          const model = await loadIfcFromBuffer(components, world, buffer, false);
          if (model) loaded.push(model);
        }

        if (!isMounted || !loaded.length) return;

        setLoadingText('Rendering scene...');
        modelsRef.current = loaded;
        fitCameraToModels(world, loaded);

        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));

        if (!isMounted) return;
        setIsReady(true);

      } catch (err) {
        if (isMounted) console.error('IFC Load Error:', err);
      }
    };

    setupViewer();

    return () => {
      isMounted = false;
      if (componentsRef.current) {
        componentsRef.current.dispose();
        componentsRef.current = null;
        worldRef.current = null;
        modelsRef.current = [];
      }
    };
  }, [files]);

  useEffect(() => {
    const components = componentsRef.current;
    const models = modelsRef.current;
    if (!components || !models.length) return;

    const highlighter = components.get(OBCF.Highlighter);
    if (selectedGuids.length > 0) {
      highlightByGuids(components, models, selectedGuids);
    } else {
      highlighter?.clear('select');
    }
  }, [selectedGuids]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} className="viewer-container" />
      {!isReady && (
        <div className="viewer-loading-overlay">
          <p className="viewer-loading-text">{loadingText}</p>
        </div>
      )}
    </div>
  );
};

export default Viewer;
