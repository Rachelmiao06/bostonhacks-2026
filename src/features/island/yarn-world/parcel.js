// A small wool-wrapped gift that hangs from a cloud on a string. Part of the knitted world, not a UI icon:
// knit box, ribbon bands, a bow, a lid that lifts when it is opened, a soft glow and an occasional wiggle
// while it is ready to open.
//
// buildParcel({ parent, kit, x, y, z, hang }) -> { group, update(t, dt), setState(state, instant), open(), anchor(out), state }
//   state      'locked'  not earned yet: faint, still (its place in the clouds shows there is more to come)
//              'ready'   earned and unopened: full colour, soft glow, wiggles now and then
//              'opened'  lid up, pompom out
//   open()     ready -> opened with the opening animation; opened -> a small nudge; locked -> a small "not yet" shake.
//              Returns the state it ended in.
//   anchor     world point at the middle of the gift, for placing the ticket next to it
//
// Reusable: call buildParcel again with other colours (`wrap`, `ribbon`) for more gifts.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BODY = { w: 0.34, h: 0.24, d: 0.34 };
const LID_H = 0.075;
const RIBBON = 0.07;
const TOP = BODY.h + LID_H + 0.05; // top of the bow, where the string ties on

const spring = (t, k = 11, d = 0.55) => 1 - Math.exp(-d * k * t) * Math.cos(k * t * Math.sqrt(1 - d * d));

/** Soft round glow, drawn once on a canvas. */
function glowTexture() {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
	grd.addColorStop(0, 'rgba(255,226,170,0.85)');
	grd.addColorStop(0.55, 'rgba(255,214,150,0.28)');
	grd.addColorStop(1, 'rgba(255,214,150,0)');
	g.fillStyle = grd;
	g.fillRect(0, 0, 128, 128);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

export function buildParcel({ parent, kit, x = 0, y = 0, z = 0, yaw = 0, hang = 0.5, wrap = 'cream', ribbon = 'coral' }) {
	const { mat, P } = kit;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');

	const group = new THREE.Group();
	group.position.set(x, y, z);
	group.rotation.y = yaw;
	parent.add(group);

	const shake = new THREE.Group(); // wiggles as a whole
	group.add(shake);

	// own copies of the materials, so a locked gift can be faint without dimming the others
	const mats = [];
	const own = (m) => {
		const c = m.clone();
		mats.push(c);
		return c;
	};
	const wrapMat = own(mat(P[wrap], 'stockinette', [3, 3]));
	const ribbonMat = own(mat(P[ribbon], 'rib', [2, 4]));
	const bowMat = own(mat(P[ribbon], 'stockinette', [2, 2]));
	const pomMat = own(mat(P.mustard, 'boucle', [6, 3]));
	const stringMat = own(mat(P.cream, 'strand', [4, 1]));
	const add = (host, mesh) => {
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		host.add(mesh);
		return mesh;
	};

	// the string it hangs from, tied to the bow and running up into the cloud
	const string = add(shake, new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, hang, 6), stringMat));
	string.position.y = TOP + hang / 2 - 0.02;

	// body, with a ribbon band round it
	add(shake, new THREE.Mesh(new RoundedBoxGeometry(BODY.w, BODY.h, BODY.d, 4, 0.045), wrapMat)).position.y = BODY.h / 2;
	const bandA = add(shake, new THREE.Mesh(new RoundedBoxGeometry(RIBBON, BODY.h + 0.012, BODY.d + 0.012, 3, 0.02), ribbonMat));
	bandA.position.y = BODY.h / 2;
	const bandB = add(shake, new THREE.Mesh(new RoundedBoxGeometry(BODY.w + 0.012, BODY.h + 0.012, RIBBON, 3, 0.02), ribbonMat));
	bandB.position.y = BODY.h / 2;

	// lid on a hinge at its back edge, so opening tips it up and back
	const hinge = new THREE.Group();
	hinge.position.set(0, BODY.h, -BODY.d / 2 - 0.01);
	shake.add(hinge);
	const lid = new THREE.Group();
	lid.position.set(0, 0, BODY.d / 2 + 0.01);
	hinge.add(lid);
	add(lid, new THREE.Mesh(new RoundedBoxGeometry(BODY.w + 0.03, LID_H, BODY.d + 0.03, 4, 0.032), wrapMat)).position.y = LID_H / 2;
	const lidBand = add(lid, new THREE.Mesh(new RoundedBoxGeometry(RIBBON, LID_H + 0.012, BODY.d + 0.042, 3, 0.02), ribbonMat));
	lidBand.position.y = LID_H / 2;
	const lidBand2 = add(lid, new THREE.Mesh(new RoundedBoxGeometry(BODY.w + 0.042, LID_H + 0.012, RIBBON, 3, 0.02), ribbonMat));
	lidBand2.position.y = LID_H / 2;

	// bow: two soft loops and a knot, on the lid
	const bow = new THREE.Group();
	bow.position.y = LID_H + 0.005;
	lid.add(bow);
	const loopGeo = new THREE.SphereGeometry(0.055, 20, 14);
	for (const sx of [-1, 1]) {
		const loop = add(bow, new THREE.Mesh(loopGeo, bowMat));
		loop.scale.set(1.15, 0.7, 0.62);
		loop.position.set(sx * 0.062, 0.035, 0);
		loop.rotation.z = -sx * 0.5;
	}
	add(bow, new THREE.Mesh(new THREE.SphereGeometry(0.033, 16, 12), bowMat)).position.y = 0.032;
	for (const sx of [-1, 1]) {
		const tail = add(bow, new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.012, 0.085, 2, 0.005), ribbonMat));
		tail.position.set(sx * 0.03, 0.006, 0.07);
		tail.rotation.y = sx * 0.35;
	}

	// the surprise inside: a small pompom that pops up when the lid lifts
	const pom = add(shake, new THREE.Mesh(new THREE.SphereGeometry(0.058, 20, 14), pomMat));
	pom.position.y = BODY.h - 0.02;
	pom.scale.setScalar(0.001);

	// a larger, invisible target so a finger (or a mouse) hits it easily
	const hit = new THREE.Mesh(
		new THREE.SphereGeometry(0.42, 12, 8),
		new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
	);
	hit.position.y = 0.2;
	group.add(hit);

	// soft glow around the gift, only while it is ready
	const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0 });
	const glow = new THREE.Sprite(glowMat);
	glow.scale.setScalar(1.15);
	glow.position.y = 0.17;
	group.add(glow);

	let state = 'ready';
	let openT = -1; // seconds since the opening started, or -1
	let nudgeT = -1;
	let shakeT = -1;
	let unlockT = -1;
	let hover = 0;
	let hoverTarget = 0;
	let nextWiggle = 3.5 + Math.abs(x + z) * 0.7;
	let wiggleT = -1;
	const LID_OPEN = 1.05; // radians

	const setLid = (k) => {
		hinge.rotation.x = -LID_OPEN * k;
		bow.position.y = LID_H + 0.005 + 0.05 * Math.max(0, Math.sin(Math.min(1, k) * Math.PI)) * (k < 1 ? 1 : 0);
		pom.scale.setScalar(Math.max(0.001, Math.min(1, (k - 0.25) / 0.75)));
		pom.position.y = BODY.h - 0.02 + 0.07 * Math.min(1, k);
	};
	setLid(0);

	const fade = (faint) => {
		for (const m of mats) {
			m.transparent = faint;
			m.opacity = faint ? 0.4 : 1;
			m.depthWrite = !faint;
			m.needsUpdate = true;
		}
	};

	group.userData.onHover = (on) => {
		hoverTarget = on ? 1 : 0;
	};

	function setState(next, instant = false) {
		const was = state;
		state = next;
		openT = nudgeT = shakeT = -1;
		shake.rotation.set(0, 0, 0);
		shake.scale.set(1, 1, 1);
		fade(next === 'locked');
		setLid(next === 'opened' ? 1 : 0);
		if (next !== 'ready') glowMat.opacity = 0;
		// just earned: a happy little hop
		if (was === 'locked' && next === 'ready' && !instant) unlockT = 0;
	}

	function open() {
		if (state === 'locked') {
			shakeT = 0;
		} else if (state === 'opened') {
			nudgeT = 0;
		} else {
			state = 'opened';
			openT = 0;
			wiggleT = -1;
		}
		return state;
	}

	function update(t, dt) {
		// hover: a little lift
		hover += (hoverTarget - hover) * Math.min(1, dt * 10);
		shake.position.y = 0.012 * hover;

		if (openT >= 0) {
			openT += dt;
			const k = reduced.matches ? 1 : Math.min(1.12, spring(openT, 12, 0.5));
			setLid(k);
			const squash = reduced.matches ? 0 : Math.exp(-openT * 7) * Math.sin(openT * 22) * 0.05;
			shake.scale.set(1 - squash, 1 + squash, 1 - squash);
			if (openT > 1.2) {
				openT = -1;
				setLid(1);
				shake.scale.set(1, 1, 1);
			}
		}
		if (nudgeT >= 0) {
			nudgeT += dt;
			shake.rotation.z = reduced.matches ? 0 : Math.exp(-nudgeT * 6) * Math.sin(nudgeT * 24) * 0.08;
			if (nudgeT > 0.8) {
				nudgeT = -1;
				shake.rotation.z = 0;
			}
		}
		if (shakeT >= 0) {
			// "not yet": a small side-to-side shake
			shakeT += dt;
			shake.rotation.z = reduced.matches ? 0 : Math.exp(-shakeT * 7) * Math.sin(shakeT * 30) * 0.07;
			if (shakeT > 0.7) {
				shakeT = -1;
				shake.rotation.z = 0;
			}
		}
		if (unlockT >= 0) {
			unlockT += dt;
			shake.position.y += reduced.matches ? 0 : Math.max(0, Math.sin(Math.min(unlockT * 6, Math.PI))) * 0.12;
			if (unlockT > 0.6) unlockT = -1;
		}

		if (state === 'ready') {
			// breathe a soft glow, and wiggle now and then
			glowMat.opacity = reduced.matches ? 0.3 : 0.28 + 0.12 * Math.sin(t * 1.6 + x);
			if (!reduced.matches && wiggleT < 0 && t > nextWiggle) {
				wiggleT = 0;
				nextWiggle = t + 6 + (Math.sin(t * 12.9898 + x) * 0.5 + 0.5) * 3;
			}
			if (wiggleT >= 0) {
				wiggleT += dt;
				shake.rotation.z = Math.exp(-wiggleT * 4.5) * Math.sin(wiggleT * 26) * 0.1;
				shake.position.y += Math.max(0, Math.sin(Math.min(wiggleT * 9, Math.PI))) * 0.03;
				if (wiggleT > 1) {
					wiggleT = -1;
					shake.rotation.z = 0;
				}
			}
		} else {
			glowMat.opacity += (0 - glowMat.opacity) * Math.min(1, dt * 4);
		}
	}

	const tmp = new THREE.Vector3();
	function anchor(out) {
		return group.getWorldPosition(out ?? tmp).add(new THREE.Vector3(0, 0.15, 0));
	}

	return {
		group,
		update,
		open,
		setState,
		anchor,
		get state() {
			return state;
		},
	};
}
