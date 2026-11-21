// Mounts the Yarn World scene (by Kris Yang, MIT) inside a container element and returns a dispose function.
// Adapted from the original main.js: sized to its container instead of the window, no URL switches,
// no body-level buttons, and everything it adds to the page is removed again on dispose.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { buildWorld } from './world.js';
import { DofPass, makeDepthTarget } from './dof.js';
import { setupPoke } from './poke.js';
import { setupGuide } from './guide.js';
import { setMuted, isMuted, unlockAudio, suspendAudio } from './sound.js';
import { setupAmbience } from './ambience.js';
import { S } from './layout.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const BACKGROUND = '#ebe5d9'; // warm stone

/**
 * @param {HTMLElement} container
 * @param {{ isUnlocked: (stage: string, k: number) => boolean, onPhase?: (phase: string) => void, instant?: boolean, onHotspot?: (id: string, state: string) => void, onHover?: (id: string, on: boolean) => void }} options
 */
export function mountIsland(container, { isUnlocked, onPhase, onHotspot, onHover, instant = false }) {
	const size = () => ({ w: Math.max(1, container.clientWidth), h: Math.max(1, container.clientHeight) });
	let { w, h } = size();

	const renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setSize(w, h);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	renderer.toneMapping = THREE.NeutralToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.domElement.style.display = 'block';
	renderer.domElement.style.touchAction = 'none';
	// a long press on the thread must not open the browser's text or image menu
	renderer.domElement.style.userSelect = 'none';
	renderer.domElement.style.webkitUserSelect = 'none';
	renderer.domElement.style.webkitTouchCallout = 'none';
	container.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(BACKGROUND);
	scene.fog = new THREE.Fog(BACKGROUND, S(24), 62);

	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environmentIntensity = 0.25;

	const sun = new THREE.DirectionalLight('#ffe6c4', 3.4);
	sun.position.set(9, 7, 5);
	sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	sun.shadow.camera.left = -12;
	sun.shadow.camera.right = 12;
	sun.shadow.camera.top = 12;
	sun.shadow.camera.bottom = -12;
	sun.shadow.camera.far = 40;
	sun.shadow.radius = 6;
	sun.shadow.bias = -0.0004;
	sun.shadow.normalBias = 0.02;
	scene.add(sun);
	scene.add(new THREE.HemisphereLight('#fde8d2', '#7a6a5c', 0.55));

	const world = buildWorld(scene, {
		isUnlocked,
		onHotspot,
		onHover: (id, on) => {
			pointerOnObject = on;
			onHover?.(id, on);
		},
	});
	if (instant) world.snapIsland();
	const focus = world.focusTarget ?? new THREE.Vector3(0, 0.6, 0);

	const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);
	camera.position.set(S(9), S(6.5), S(11));
	// on tall (phone) screens the island is wider than the view: back the camera off to fit it
	camera.position.multiplyScalar(Math.max(0.88, 1.1 / camera.aspect)); // a little closer than before on wide screens, backed off on tall ones
	// on a tall (phone) screen, look down a bit more steeply so the island fills the screen instead of leaving empty sky
	if (camera.aspect < 0.9) camera.position.y *= 1.4;
	// the fog starts relative to the default camera distance: push it back by the same factor or the whole scene looks washed out
	scene.fog.near *= Math.max(1, 1.1 / camera.aspect);
	scene.fog.far *= Math.max(1, 1.1 / camera.aspect);
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.copy(focus);
	controls.enableDamping = true;
	// A gentle sway instead of a full spin: the near side of the island, where the journal and gifts are, never turns
	// out of view, so their labels stay attached and on screen. It pauses while you drag and while a ticket is open.
	controls.autoRotate = false;
	const SWAY_AMPLITUDE = 0.5; // radians, about 29 degrees each way
	const SWAY_PERIOD = 46; // seconds for a full there-and-back
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
	let swayHeld = false;
	let pointerOnObject = false; // hold still while a pointer is on an object, so it cannot drift from under it
	let userActive = false;
	let idleAt = 0;
	let swayLast = 0;
	let swayResume = true;
	controls.addEventListener('start', () => {
		userActive = true;
	});
	controls.addEventListener('end', () => {
		userActive = false;
		idleAt = performance.now() / 1000;
	});
	const swayAxis = new THREE.Vector3(0, 1, 0);
	const swayOffset = new THREE.Vector3();
	function sway() {
		const now = performance.now() / 1000;
		if (swayHeld || pointerOnObject || userActive || reducedMotion.matches || now - idleAt < 2.5) {
			swayResume = true;
			return;
		}
		const az = SWAY_AMPLITUDE * Math.sin((now * Math.PI * 2) / SWAY_PERIOD);
		if (swayResume) {
			swayResume = false;
		} else {
			swayOffset.copy(camera.position).sub(controls.target).applyAxisAngle(swayAxis, az - swayLast);
			camera.position.copy(controls.target).add(swayOffset);
		}
		swayLast = az;
	}
	controls.maxPolarAngle = Math.PI * 0.47;
	controls.minDistance = 4;
	controls.maxDistance = S(30) * Math.max(1, 1.1 / camera.aspect);

	const pr = renderer.getPixelRatio();
	const composer = new EffectComposer(renderer, makeDepthTarget(w * pr, h * pr));
	composer.addPass(new RenderPass(scene, camera));
	const bokeh = new DofPass(camera, { focus: 14, aperture: 0.0008, maxblur: 0.004, focusRange: 0.2 });
	composer.addPass(bokeh);
	composer.addPass(new OutputPass());
	// compile every shader up front (hidden objects included) so nothing hitches when the island knits in
	renderer.setRenderTarget(composer.readBuffer);
	renderer.compileAsync(scene, camera);
	renderer.setRenderTarget(null);

	const resize = () => {
		({ w, h } = size());
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
		composer.setSize(w, h);
	};
	const observer = new ResizeObserver(resize);
	observer.observe(container);

	// Adaptive resolution: if the frame rate falls behind the screen, lower the pixel ratio step by step.
	const startupDts = [];
	let refreshFps = 60;
	let fpsFrames = 0;
	let fpsTime = 0;
	function adaptPixelRatio(dt) {
		if (startupDts.length) {
			startupDts.sort((a, b) => a - b);
			refreshFps = Math.round(1 / startupDts[Math.floor(startupDts.length * 0.1)]);
			startupDts.length = 0;
		}
		fpsFrames++;
		fpsTime += dt;
		if (fpsTime < 2) return;
		const fps = fpsFrames / fpsTime;
		fpsFrames = fpsTime = 0;
		const cur = renderer.getPixelRatio();
		if (fps >= refreshFps * 0.9 || cur <= 1) return;
		const next = Math.max(1, cur - 0.25);
		renderer.setPixelRatio(next);
		composer.setPixelRatio(next);
		resize();
	}

	// auto focus: a ray from the screen center sets the depth-of-field distance
	const focusTargets = [];
	scene.traverse((o) => {
		if (!o.isMesh || o.isInstancedMesh) return;
		if (!o.geometry.boundsTree) o.geometry.computeBoundsTree();
		focusTargets.push(o);
	});
	const raycaster = new THREE.Raycaster();
	raycaster.firstHitOnly = true;
	const screenCenter = new THREE.Vector2(0, 0);
	let focusDist = camera.position.distanceTo(controls.target);

	const timer = new THREE.Timer();
	const FOCUS_HOLD = 4;
	const focusLock = { point: new THREE.Vector3(), until: -1 };
	const poke = setupPoke({
		dom: renderer.domElement,
		camera,
		controls,
		targets: focusTargets,
		grabbables: world.grabbables,
		groundAt: world.groundAt,
		onPoke: (hit) => {
			focusLock.point.copy(hit.point);
			focusLock.until = timer.getElapsed() + FOCUS_HOLD;
		},
	});

	// our fix: inside the scene container, not document.body. The island page is `fixed z-30`, which hid the body-level guide (z-5) behind it.
	const guide = setupGuide({ camera, dom: renderer.domElement, parent: container });
	const ambience = setupAmbience({ camera, target: controls.target, riverPoint: world.riverPoint, windAt: world.wind.at });

	// browsers only allow sound after a gesture; the first touch on the scene starts it
	const unlock = () => unlockAudio();
	renderer.domElement.addEventListener('pointerdown', unlock);

	const onKey = (e) => {
		if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
		if (e.key === 'm' || e.key === 'M') setMuted(!isMuted());
	};
	addEventListener('keydown', onKey);

	const anchorPoint = new THREE.Vector3();
	const hotspot = (id) => world.hotspots.find((h) => h.id === id);
	let lastPhase = '';
	renderer.setAnimationLoop(() => {
		timer.update();
		const rawDt = timer.getDelta();
		const dt = Math.min(rawDt, 0.05);
		const t = timer.getElapsed();
		sway();
		controls.update(dt);
		if (t < focusLock.until) {
			focusDist = camera.position.distanceTo(focusLock.point);
		} else {
			raycaster.setFromCamera(screenCenter, camera);
			const hit = raycaster.intersectObjects(focusTargets, false)[0];
			if (hit) focusDist = hit.distance;
		}
		bokeh.uniforms.focus.value += (focusDist - bokeh.uniforms.focus.value) * Math.min(1, dt * 6);
		// a pull of about half the window height knits the whole island, whatever the zoom
		world.setPullSpan(0.5 * 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.distanceTo(controls.target));
		world.update?.(t, dt);
		if (world.phase !== lastPhase) onPhase?.((lastPhase = world.phase));
		guide.update(world.hint, dt);
		ambience(dt);
		composer.render(dt);
		if (t < 3) startupDts.push(rawDt);
		else adaptPixelRatio(rawDt);
	});

	// ?debug=1 exposes the scene for inspection (used by the tests)
	if (new URLSearchParams(location.search).get('debug') === '1') window.__island = { world, camera, controls };
	return {
		world,
		/** Replay the knit-in with whatever is unlocked right now. */
		replay: () => world.playIntro(),
		offerGift: (stages, label, onKnitted) => world.offerGift(stages, label, onKnitted),
		/** New pieces fall onto the island from above. pick(stage, k) chooses which. */
		dropIn: (pick, onDone) => world.dropIn(pick, onDone),
		acceptGift: () => world.acceptGift(),
		/** The three gifts. States: 'locked' | 'ready' | 'opened'. */
		setGiftStates: (states, instant) => states.forEach((st, i) => hotspot(`gift-${i}`)?.setState?.(st, instant)),
		/** Open a hotspot (journal or a gift) with its little animation; returns the state it ends in. */
		openHotspot: (id) => hotspot(id)?.open(),
		/** Glow a hotspot, e.g. while its page control has keyboard focus. */
		highlightHotspot: (id, on) => hotspot(id)?.highlight?.(on),
		/** Where a hotspot is on screen, in container pixels, so labels and tickets can sit next to it. */
		hotspotScreen: (id, out) => {
			hotspot(id).anchor(anchorPoint).project(camera);
			out.x = (anchorPoint.x * 0.5 + 0.5) * container.clientWidth;
			out.y = (0.5 - anchorPoint.y * 0.5) * container.clientHeight;
			out.visible = anchorPoint.z < 1;
			return out;
		},
		/** Hold the gentle camera sway while a ticket is open, so the camera stays where it is. */
		holdCamera: (hold) => {
			swayHeld = hold;
		},
		dispose() {
			renderer.setAnimationLoop(null);
			observer.disconnect();
			removeEventListener('keydown', onKey);
			renderer.domElement.removeEventListener('pointerdown', unlock);
			poke?.dispose?.();
			guide.dispose();
			ambience.dispose();
			suspendAudio();
			controls.dispose();
			scene.traverse((o) => {
				if (o.geometry) o.geometry.dispose();
				const m = o.material;
				if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
			});
			pmrem.dispose();
			composer.dispose?.();
			renderer.dispose();
			renderer.domElement.remove();
		},
	};
}
