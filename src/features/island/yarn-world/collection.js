// The collection gallery's 3D row: the island's own knitted objects, cloned, floating in a line.
//
// ONE WebGL renderer, ONE scene and ONE camera draw every item (never a canvas per item). The objects are clones of the
// island's real objects, so they share the island's geometry, textures and wool materials (including the fuzz shader):
// the same look, nothing redrawn. A locked item gets a muted copy of those materials; unlocked items use them as they are.
// The island's own scene, renderer and camera are not touched.
//
// createCollection(canvas, { sources, states, reveal }) -> controller
//   sources  [Object3D[]] per item: the island objects that stand for it (from world.collectibles())
//   states   ['unlocked' | 'locked'] per item
//   reveal   Set of item indices that were just earned: they rise into view once, with a warm highlight that fades
// controller: setActive(i), setHover(i | null), resize(w, h), slots() -> [{ x, y, size }] in canvas pixels, dispose()
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const FOV = 28;
const DIST = 9;
const FLOAT_PX = 6; // gentle vertical float, 4 to 8 px
const MUTED = new THREE.Color('#d6cfbf'); // a lighter wash, so locked pieces stay bright and recognisable

const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

function softTexture(rgb, alpha) {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	const grd = g.createRadialGradient(64, 64, 2, 64, 64, 62);
	grd.addColorStop(0, `rgba(${rgb},${alpha})`);
	grd.addColorStop(1, `rgba(${rgb},0)`);
	g.fillStyle = grd;
	g.fillRect(0, 0, 128, 128);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

export function createCollection(canvas, { sources, states, reveal = new Set() }) {
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setClearColor(0x000000, 0);
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.toneMapping = THREE.NeutralToneMapping;
	renderer.toneMappingExposure = 1.0; // brighter than the island: the pieces are the focus

	const scene = new THREE.Scene();
	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environmentIntensity = 0.45;
	const sun = new THREE.DirectionalLight('#fff0d8', 3.5);
	sun.position.set(3, 5, 4);
	scene.add(sun);
	scene.add(new THREE.HemisphereLight('#fff3e4', '#9a8a7a', 1.0));
	const fill = new THREE.DirectionalLight('#ffffff', 0.9); // soft light from the front, so no side is dull
	fill.position.set(-3, 2, 6);
	scene.add(fill);

	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
	camera.position.set(0, 0.3, DIST);
	camera.lookAt(0, 0, 0);

	const shadowTex = softTexture('90,70,50', 0.28);
	const glowTex = softTexture('255,214,150', 0.9);
	const disposables = [shadowTex, glowTex];
	const mutedCache = new Map();
	const muted = (m) => {
		let c = mutedCache.get(m);
		if (!c) {
			c = m.clone();
			// keep the island's special shader hooks (wool fuzz) so a muted tree is still fuzzy
			c.onBeforeCompile = m.onBeforeCompile;
			c.customProgramCacheKey = m.customProgramCacheKey;
			if (c.color) c.color.lerp(MUTED, 0.3);
			c.transparent = true;
			c.opacity = 0.86;
			mutedCache.set(m, c);
			disposables.push(c);
		}
		return c;
	};

	// ---- one slot per item ------------------------------------------------------------------------------
	const slots = sources.map((parts, i) => {
		const lockedItem = states[i] === 'locked';
		const row = new THREE.Group(); // the objects of this item side by side
		let cursor = 0;
		for (const src of parts) {
			const clone = src.clone(true);
			clone.position.set(0, 0, 0);
			clone.rotation.x = clone.rotation.z = 0;
			clone.visible = true;
			clone.traverse((o) => {
				if (o.userData) o.userData = {};
				o.frustumCulled = false;
				if (lockedItem && o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(muted) : muted(o.material);
			});
			const part = new THREE.Group();
			part.add(clone);
			part.updateMatrixWorld(true);
			const box = new THREE.Box3().setFromObject(part);
			const size = box.getSize(new THREE.Vector3());
			const center = box.getCenter(new THREE.Vector3());
			clone.position.set(-center.x, -center.y, -center.z);
			part.position.x = cursor + size.x / 2;
			cursor += size.x + size.x * 0.12;
			row.add(part);
		}
		// normalise: every item the same size, centred, whatever it is
		const box = new THREE.Box3().setFromObject(row);
		const size = box.getSize(new THREE.Vector3());
		const center = box.getCenter(new THREE.Vector3());
		row.position.set(-center.x, -center.y, -center.z);
		// flat things (flowers, stones, a garden) would look tiny at the same longest side, so they get a little more size
		const flat = size.y < 0.4 * Math.max(size.x, size.z);
		const unit = (flat ? 1.45 : 1) / Math.max(size.x, size.y, size.z, 1e-3);
		const spin = new THREE.Group();
		spin.add(row);
		const holder = new THREE.Group();
		holder.add(spin);
		const halfH = (size.y * unit) / 2;

		const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: lockedItem ? 0.55 : 1 }));
		shadow.rotation.x = -Math.PI / 2;
		disposables.push(shadow.geometry, shadow.material);
		const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 }));
		disposables.push(glow.material);

		const group = new THREE.Group();
		group.add(shadow, holder, glow);
		scene.add(group);
		return { i, group, holder, spin, shadow, glow, unit, halfH, locked: lockedItem, phase: i * 1.37, yaw: 0.5 + i * 0.6, hover: 0, sel: 0, reveal: reveal.has(i) ? 0 : 1 };
	});

	// ---- layout and animation ---------------------------------------------------------------------------------
	let W = 1;
	let H = 1;
	let visible = 5;
	let spacing = 3;
	let itemSize = 2;
	let pxToWorld = 0.01;
	let active = 0;
	let activeSmooth = 0;
	let hover = null;
	let raf = 0;
	let last = performance.now();
	let t = 0;
	let revealDelay = 0.5; // seconds after opening before newly earned items rise in

	function layout() {
		const worldH = 2 * Math.tan((FOV * Math.PI) / 360) * DIST;
		const worldW = worldH * (W / H);
		visible = W < 700 ? 3 : 5;
		spacing = worldW / visible;
		itemSize = Math.min(spacing * (W < 700 ? 0.82 : 0.7), worldH * 0.48);
		pxToWorld = worldH / H;
	}

	function frame(now) {
		raf = requestAnimationFrame(frame);
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		t += dt;
		activeSmooth += (active - activeSmooth) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 7));
		revealDelay -= dt;
		for (const s of slots) {
			const d = s.i - activeSmooth;
			const near = Math.max(0, 1 - Math.abs(d)); // 1 at the centre
			s.hover += ((hover === s.i ? 1 : 0) - s.hover) * Math.min(1, dt * 10);
			s.sel += ((active === s.i ? 1 : 0) - s.sel) * Math.min(1, dt * 8);
			const calm = reduced.matches ? 0 : 1;
			if (s.reveal < 1 && revealDelay <= 0) s.reveal = Math.min(1, s.reveal + dt / (reduced.matches ? 0.01 : 1.5));
			const rise = ease(s.reveal);
			const x = d * spacing;
			const float = Math.sin(t * 0.9 + s.phase) * FLOAT_PX * pxToWorld * calm;
			const lift = s.hover * 14 * pxToWorld;
			const size = itemSize * (0.88 + 0.22 * near) * (1 + 0.07 * s.hover) * (0.7 + 0.3 * rise);
			s.group.position.set(x, float + lift - (1 - rise) * itemSize * 0.9, s.sel * 0.5);
			s.yaw += dt * 0.28 * calm * (1 - 0.9 * s.hover);
			s.spin.rotation.y = s.yaw;
			s.holder.scale.setScalar(size * s.unit);
			s.shadow.position.set(0, -(s.halfH * size) - 0.18 * size - (float + lift) * 0.3, 0);
			s.shadow.scale.setScalar(size * (0.85 - 0.1 * s.hover));
			s.glow.position.set(0, 0, 0.2);
			s.glow.scale.setScalar(size * 1.5);
			s.glow.material.opacity = s.reveal < 1 ? Math.sin(Math.min(1, s.reveal) * Math.PI) * 0.8 : 0;
			s.group.visible = Math.abs(d) < visible / 2 + 1.2 && rise > 0.02;
		}
		renderer.render(scene, camera);
	}

	raf = requestAnimationFrame(frame);

	return {
		setActive(i) {
			active = Math.max(0, Math.min(slots.length - 1, i));
		},
		setHover(i) {
			hover = i;
		},
		resize(w, h) {
			W = Math.max(1, w);
			H = Math.max(1, h);
			renderer.setSize(W, H, false);
			camera.aspect = W / H;
			camera.updateProjectionMatrix();
			layout();
		},
		/** Where each item is on the canvas right now, in pixels (centre x, centre y, drawn size). */
		slots() {
			const out = [];
			const v = new THREE.Vector3();
			for (const s of slots) {
				v.copy(s.group.position).project(camera);
				const sizePx = (itemSize * (0.88 + 0.22 * Math.max(0, 1 - Math.abs(s.i - activeSmooth)))) / pxToWorld;
				out.push({ x: (v.x * 0.5 + 0.5) * W, y: (0.5 - v.y * 0.5) * H, size: sizePx, shown: s.group.visible });
			}
			return out;
		},
		spacingPx: () => spacing / pxToWorld,
		dispose() {
			cancelAnimationFrame(raf);
			for (const d of disposables) d.dispose?.();
			pmrem.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		},
	};
}
