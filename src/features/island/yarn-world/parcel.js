// Parcel: a small knitted gift box that waits on the island when a partner perk is available.
// It is not part of the knit-in (not in the weave items): the page shows it with show() once the island
// is fully there, and hides it again when the island unravels.
//   - idle: pops in with a spring, then gives a small wiggle every few seconds so it invites a poke
//   - poke: the lid flips up, a slip of paper rises out, the bow springs, then everything settles again
//     (the page opens the coupon ticket through the onOpen callback; poke again to see it again)
// Everything is the island's own yarn: kit.mat stitches and the same Spring, poke and sound helpers.
// The integrator calls setupParcel({ root, kit, terrain, at }) once, update(t, dt) every frame.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Spring } from './spring.js';
import { playChime, playPop } from './sound.js';

const BOX = { w: 0.62, h: 0.42, d: 0.62 };
const LID = { w: 0.68, h: 0.13, d: 0.68 };
const OPEN_ANGLE = 1.15; // rad the lid flips up
const OPEN_HOLD = 1.6; // seconds the box stays open
const WIGGLE_EVERY = 4.5; // seconds between idle wiggles

const noRaycast = () => {};

export function setupParcel({ root, kit, terrain, at, blockers }) {
	const { mat, sphereRep, P } = kit;

	const group = new THREE.Group();
	const [x, z] = at;
	group.position.set(x, terrain.heightAt(x, z), z);
	group.rotation.y = -0.5;
	group.visible = false;
	root.add(group);
	// sheep walk around it, like the kite stake
	blockers?.push([x, z, 0.5]);

	const meshes = [];
	function part(parent, geo, material, px, py, pz) {
		const m = new THREE.Mesh(geo, material);
		m.castShadow = true;
		m.receiveShadow = true;
		m.position.set(px, py, pz);
		m.raycast = noRaycast; // off until the parcel is shown
		parent.add(m);
		meshes.push(m);
		return m;
	}

	const boxMat = mat(P.mustard, 'stockinette', [7, 5]);
	const lidMat = mat(P.mustard, 'garter', [7, 3]);
	const ribbonMat = mat(P.coral, 'garter', [2, 6]);
	const bowMat = mat(P.coral, 'boucle', sphereRep(0.09));
	const paperMat = new THREE.MeshStandardMaterial({ color: P.white, roughness: 0.9, metalness: 0 });

	// the body sits on the ground; `tilt` is the wiggle, `pop` the appear / hover scale
	const tilt = new THREE.Group();
	group.add(tilt);
	const body = new THREE.Group();
	tilt.add(body);

	part(body, new RoundedBoxGeometry(BOX.w, BOX.h, BOX.d, 3, 0.07), boxMat, 0, BOX.h / 2, 0);
	// ribbon straps around the box (slightly wider than the box so they sit on top of the yarn)
	part(body, new RoundedBoxGeometry(0.11, BOX.h + 0.01, BOX.d + 0.02, 2, 0.03), ribbonMat, 0, BOX.h / 2, 0);
	part(body, new RoundedBoxGeometry(BOX.w + 0.02, BOX.h + 0.01, 0.11, 2, 0.03), ribbonMat, 0, BOX.h / 2, 0);

	// the paper slip waits inside, under the lid
	const paper = part(body, new THREE.BoxGeometry(0.42, 0.012, 0.3), paperMat, 0, BOX.h - 0.04, 0);

	// lid hinges on its back edge
	const hinge = new THREE.Group();
	hinge.position.set(0, BOX.h + LID.h / 2 - 0.02, -LID.d / 2);
	body.add(hinge);
	part(hinge, new RoundedBoxGeometry(LID.w, LID.h, LID.d, 3, 0.05), lidMat, 0, 0, LID.d / 2);
	part(hinge, new RoundedBoxGeometry(0.11, LID.h + 0.01, LID.d + 0.02, 2, 0.03), ribbonMat, 0, 0, LID.d / 2);
	part(hinge, new RoundedBoxGeometry(LID.w + 0.02, LID.h + 0.01, 0.11, 2, 0.03), ribbonMat, 0, 0, LID.d / 2);

	// bow on top of the lid: two loops and a knot
	const bow = new THREE.Group();
	bow.position.set(0, LID.h / 2 + 0.03, LID.d / 2);
	hinge.add(bow);
	const loopGeo = new THREE.SphereGeometry(0.1, 24, 16);
	const loopL = part(bow, loopGeo, bowMat, -0.1, 0.03, 0);
	loopL.scale.set(1.1, 0.7, 0.6);
	loopL.rotation.z = 0.5;
	const loopR = part(bow, loopGeo, bowMat, 0.1, 0.03, 0);
	loopR.scale.set(1.1, 0.7, 0.6);
	loopR.rotation.z = -0.5;
	part(bow, new THREE.SphereGeometry(0.055, 20, 14), bowMat, 0, 0.02, 0);

	// --- motion ---------------------------------------------------------------
	const pop = new Spring(170, 11, 0); // 0 hidden .. 1 shown (bounces past 1)
	const hover = new Spring(260, 16, 0);
	const wob = new Spring(120, 5, 0); // wiggle (rad around z)
	const lift = new Spring(150, 12, 0); // hop on poke (units)
	const lid = new Spring(130, 9, 0); // 0 closed .. 1 open
	const slip = new Spring(90, 10, 0); // paper rising out
	const bowPop = new Spring(260, 9, 1);

	let shown = false;
	let onOpen = null;
	let openFor = 0;
	let nextWiggle = 2;
	let clock = 0;

	function setRaycast(on) {
		for (const m of meshes) {
			if (on) delete m.raycast; // falls back to the BVH-accelerated Mesh.prototype.raycast
			else m.raycast = noRaycast;
		}
	}

	function open() {
		playPop({ pitch: 1.25 });
		setTimeout(() => playChime(), 180);
		lid.target = 1;
		slip.target = 1;
		lift.kick(2.2);
		wob.kick(-2.5);
		bowPop.kick(5);
		openFor = OPEN_HOLD;
		onOpen?.();
	}

	group.userData.onPoke = () => {
		if (!shown) return;
		open();
	};
	group.userData.onHover = (on) => {
		hover.target = on && shown ? 1 : 0;
	};

	function update(t, dt) {
		if (!group.visible) return;
		clock += dt;
		if (shown && clock > nextWiggle && openFor <= 0) {
			wob.kick(3.2);
			nextWiggle = clock + WIGGLE_EVERY + Math.random() * 2;
		}
		if (openFor > 0) {
			openFor -= dt;
			if (openFor <= 0) {
				lid.target = 0;
				slip.target = 0;
			}
		}
		const s = Math.max(0, pop.update(dt));
		const h = hover.update(dt);
		body.scale.setScalar(s * (1 + 0.06 * h));
		tilt.rotation.z = wob.update(dt) * 0.07;
		body.position.y = Math.max(0, lift.update(dt)) * 0.12;
		hinge.rotation.x = -lid.update(dt) * OPEN_ANGLE;
		paper.position.y = BOX.h - 0.04 + slip.update(dt) * 0.32;
		paper.rotation.y = slip.value * 0.35;
		const bp = bowPop.update(dt);
		bow.scale.setScalar(Math.max(0.01, bp));
		// finished hiding: stop drawing it
		if (!shown && pop.settled && pop.value < 0.01) group.visible = false;
	}

	return {
		update,
		/** Pop the parcel in. `callback` runs each time the rider pokes (opens) it. */
		show(callback) {
			onOpen = callback;
			if (shown) return;
			shown = true;
			group.visible = true;
			setRaycast(true);
			clock = 0;
			nextWiggle = 2.5;
			pop.snap(0);
			pop.target = 1;
			playPop({ pitch: 0.9 });
		},
		/** Same as a poke, for a button (keyboard and screen readers). */
		open() {
			if (shown) open();
		},
		hide() {
			if (!shown && !group.visible) return;
			shown = false;
			onOpen = null;
			setRaycast(false);
			hover.snap(0);
			lid.snap(0);
			slip.snap(0);
			pop.target = 0;
			openFor = 0;
		},
		get shown() {
			return shown;
		},
	};
}
