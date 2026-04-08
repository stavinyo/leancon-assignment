import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";

// ─── Engine Setup ────────────────────────────────────────────────────────────

export function initBimEngine(container) {
    const components = new OBC.Components();
    const world = components.get(OBC.Worlds).create();

    world.scene    = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera   = new OBC.SimpleCamera(components);

    components.init();
    world.scene.setup();

    _configureBackground(world);
    _configureLighting(world);

    components.get(OBC.IfcLoader).settings.wasm = {
        path: "https://unpkg.com/web-ifc@0.0.59/",
        absolute: true,
    };

    return { components, world };
}

function _configureBackground(world) {
    world.scene.three.background = null;
    world.scene.three.environment = null;
    world.renderer.three.setClearColor(0x000000, 0);
    world.renderer.three.domElement.style.background = "transparent";
}

function _configureLighting(world) {
    const scene = world.scene.three;

    scene.children
        .filter(c => c.isLight)
        .forEach(l => scene.remove(l));

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.0));

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(5, 10, 5);
    sun.castShadow = true;
    scene.add(sun);
}

// ─── Model Loading ───────────────────────────────────────────────────────────

export async function ensureLoaderSetup(components) {
    const loader = components.get(OBC.IfcLoader);
    if (!loader.isSetup) await loader.setup();
}

export async function loadIfcFromBuffer(components, world, buffer) {
    const model = await components.get(OBC.IfcLoader).load(buffer);
    if (!model) return null;

    world.scene.three.add(model);

    await components.get(OBC.IfcRelationsIndexer).process(model);
    await new Promise(resolve => requestAnimationFrame(resolve));

    _ensureHighlighterReady(components, world);

    return model;
}

// ─── Camera ──────────────────────────────────────────────────────────────────

export function fitCameraToModels(world, models) {
    const totalBox = new THREE.Box3();
    models.forEach(m => totalBox.expandByObject(m));
    if (!totalBox.isEmpty()) world.camera.controls.fitToBox(totalBox, true);
}

// ─── Highlighting ─────────────────────────────────────────────────────────────

export async function highlightByGuids(components, models, guids) {
    const modelList = Array.isArray(models) ? models : [models];
    if (!modelList.length || !guids?.length) return;

    const highlighter = components.get(OBCF.Highlighter);
    if (!highlighter?.isSetup) return;

    highlighter.clear("select");

    const fragmentIdMap = _buildFragmentIdMap(modelList, guids);
    if (Object.keys(fragmentIdMap).length > 0) {
        await highlighter.highlightByID("select", fragmentIdMap, true, true);
    }
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

function _ensureHighlighterReady(components, world) {
    const highlighter = components.get(OBCF.Highlighter);
    if (!highlighter.isSetup) highlighter.setup({ world });
}

function _buildFragmentIdMap(models, guids) {
    const map = {};
    for (const model of models) {
        for (const guid of guids) {
            const expressID = model.globalToExpressIDs.get(guid);
            if (expressID === undefined) continue;
            for (const [fragmentId, ids] of Object.entries(model.getFragmentMap([expressID]))) {
                if (!map[fragmentId]) map[fragmentId] = new Set();
                ids.forEach(id => map[fragmentId].add(id));
            }
        }
    }
    return map;
}
