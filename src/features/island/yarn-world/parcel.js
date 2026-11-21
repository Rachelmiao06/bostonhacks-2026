// A small wool-wrapped parcel that waits on the island. Part of the knitted world, not a UI icon:
// knit box, ribbon bands, a bow, a lid that lifts when it is opened, a soft halo and an occasional wiggle
// while it is still closed.
//
// buildParcel({ parent, kit, x, z, y, onOpen }) -> { group, update(t, dt), open(), setOpened(on), anchor(out) }
//   group      positioned at the ground point; the weave module wraps it so it knits in with the rest
//   open()     play the opening (lid lifts, bow hops); safe to call again (it then only nudges)
//   setOpened  show it already opened (returning visitor) without animation, or closed again
//   anchor     world point just above the parcel, for anchoring the offer ticket
//
// Reusable: call buildParcel again with another x / z / colours for more gifts.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BODY = { w: 0.34, h: 0.24, d: 0.34 };
const LID_H = 0.075;
const RIBBON = 0.07;

const spring = (t, k = 11, d = 0.55) => 1 - Math.exp(-d * k * t) * Math.cos(k * t * Math.sqrt(1 - d * d));

/** Soft round glow on the ground, drawn once on a canvas. */
function haloTexture() {
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

export function buildParcel({ parent, kit, x, z, y, yaw = 0.5, wrap = 'cream', ribbon = 'coral', onOpen }) {
	const { mat, P } = kit;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');

	const group = new THREE.Group();
	group.position.set(x, y, z);
	group.rotation.y = yaw;
	parent.add(group);

	const shake = new THREE.Group(); // wiggles as a whole
	group.add(shake);

	const wrapMat = mat(P[wrap], 'stockinette', [3, 3]);
	const ribbonMat = mat(P[ribbon], 'rib', [2, 4]);
	const bowMat = mat(P[ribbon], 'stockinette', [2, 2]);
	const add = (host, mesh) => {
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		host.add(mesh);
		return mesh;
	};

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
	const pom = add(shake, new THREE.Mesh(new THREE.SphereGeometry(0.058, 20, 14), mat(P.mustard, 'boucle', [6, 3])));
	pom.position.y = BODY.h - 0.02;
	pom.scale.setScalar(0.001);

	// a larger, invisible target so a finger (or a mouse) hits it easily
	const hit = new THREE.Mesh(
		new THREE.SphereGeometry(0.34, 12, 8),
		new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
	);
	hit.position.y = 0.2;
	group.add(hit);

	// soft halo on the ground, only while closed
	const haloMat = new THREE.MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false, opacity: 0 });
	const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), haloMat);
	halo.rotation.x = -Math.PI / 2;
	halo.position.y = 0.025;
	halo.renderOrder = 1;
	group.add(halo);

	let opened = false;
	let openT = -1; // seconds since open() was called, or -1
	let nudgeT = -1;
	let hover = 0;
	let hoverTarget = 0;
	let nextWiggle = 3.5;
	let wiggleT = -1;
	const LID_OPEN = 1.05; // radians

	const setLid = (k) => {
		hinge.rotation.x = -LID_OPEN * k;
		bow.position.y = LID_H + 0.005 + 0.05 * Math.max(0, Math.sin(Math.min(1, k) * Math.PI)) * (k < 1 ? 1 : 0);
		pom.scale.setScalar(Math.max(0.001, Math.min(1, (k - 0.25) / 0.75)));
		pom.position.y = BODY.h - 0.02 + 0.07 * Math.min(1, k);
	};
	setLid(0);

	group.userData.onHover = (on) => {
		hoverTarget = on ? 1 : 0;
	};

	function open() {
		if (opened) {
			nudgeT = 0;
			return;
		}
		opened = true;
		openT = 0;
		wiggleT = -1;
		onOpen?.();
	}

	function setOpened(on) {
		opened = on;
		openT = -1;
		nudgeT = -1;
		setLid(on ? 1 : 0);
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

		// closed: breathe a soft halo, and wiggle now and then
		if (!opened) {
			const pulse = reduced.matches ? 0.22 : 0.2 + 0.1 * Math.sin(t * 1.6);
			haloMat.opacity = pulse;
			if (!reduced.matches && wiggleT < 0 && t > nextWiggle) {
				wiggleT = 0;
				nextWiggle = t + 6 + (Math.sin(t * 12.9898) * 0.5 + 0.5) * 3;
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
			haloMat.opacity += (0 - haloMat.opacity) * Math.min(1, dt * 4);
		}
	}

	const tmp = new THREE.Vector3();
	function anchor(out) {
		return group.getWorldPosition(out ?? tmp).add(new THREE.Vector3(0, 0.42, 0));
	}

	return { group, update, open, setOpened, anchor, get opened() { return opened; } };
}
