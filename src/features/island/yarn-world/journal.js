// A small knitted journal lying on a little picnic mat: the place your history lives. Part of the knitted world.
// buildJournal({ parent, kit, x, y, z, yaw }) -> { group, update(t, dt), highlight(on), anchor(out) }
// Poking it (or focusing its page control) opens the journal ticket; the page draws the real history.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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

export function buildJournal({ parent, kit, x = 0, y = 0, z = 0, yaw = 0 }) {
	const { mat, P } = kit;
	const group = new THREE.Group();
	group.position.set(x, y, z);
	group.rotation.y = yaw;
	parent.add(group);

	const add = (host, mesh) => {
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		host.add(mesh);
		return mesh;
	};

	// picnic mat: a flat knitted check
	const matGroup = new THREE.Group();
	group.add(matGroup);
	add(matGroup, new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.04, 0.72, 3, 0.02), mat(P.pink, 'stockinette', [8, 6], P.white, 'check'))).position.y = 0.02;

	// the book
	const book = new THREE.Group();
	book.position.y = 0.04;
	book.rotation.y = -0.25;
	group.add(book);
	const W = 0.46;
	const D = 0.34;
	const H = 0.085;
	add(book, new THREE.Mesh(new RoundedBoxGeometry(W, H * 0.62, D, 3, 0.02), mat(P.cream, 'stockinette', [4, 3]))).position.y = H * 0.31; // pages
	add(book, new THREE.Mesh(new RoundedBoxGeometry(W + 0.03, H * 0.2, D + 0.03, 3, 0.018), mat(P.brick, 'stockinette', [4, 3]))).position.y = H * 0.1; // back cover
	const cover = add(book, new THREE.Mesh(new RoundedBoxGeometry(W + 0.03, H * 0.22, D + 0.03, 3, 0.018), mat(P.brick, 'stockinette', [4, 3])));
	cover.position.y = H * 0.62 + H * 0.11;
	// a ribbon bookmark and a small "T" patch on the cover
	add(book, new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.012, 0.12, 2, 0.005), mat(P.coral, 'rib', [2, 4]))).position.set(0.12, H * 0.62 + 0.002, D / 2 + 0.05);
	const patch = add(book, new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.012, 0.15, 2, 0.006), mat(P.cream, 'stockinette', [3, 3])));
	patch.position.set(0, H * 0.62 + H * 0.22 + 0.004, 0);
	const tBar = add(book, new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.014, 0.03, 2, 0.005), mat(P.brick, 'stockinette', [2, 1])));
	tBar.position.set(0, H * 0.62 + H * 0.22 + 0.012, -0.03);
	const tStem = add(book, new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.014, 0.09, 2, 0.005), mat(P.brick, 'stockinette', [1, 2])));
	tStem.position.set(0, H * 0.62 + H * 0.22 + 0.012, 0.02);

	// a larger, invisible target so a finger (or a mouse) hits it easily
	const hit = new THREE.Mesh(
		new THREE.SphereGeometry(0.52, 12, 8),
		new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
	);
	hit.position.y = 0.12;
	group.add(hit);

	const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0 });
	const glow = new THREE.Sprite(glowMat);
	glow.scale.setScalar(1.3);
	glow.position.y = 0.12;
	group.add(glow);

	let hover = 0;
	let hoverTarget = 0;
	const highlight = (on) => {
		hoverTarget = on ? 1 : 0;
	};
	group.userData.onHover = highlight;

	function update(t, dt) {
		hover += (hoverTarget - hover) * Math.min(1, dt * 10);
		book.position.y = 0.04 + 0.014 * hover;
		const idle = reducedMotion() ? 0.16 : 0.12 + 0.06 * Math.sin(t * 1.3 + x);
		glowMat.opacity += (idle + 0.4 * hover - glowMat.opacity) * Math.min(1, dt * 8);
	}

	const tmp = new THREE.Vector3();
	function anchor(out) {
		return group.getWorldPosition(out ?? tmp).add(new THREE.Vector3(0, 0.6, 0)); // just above the book (the group is drawn 1.8x), for labels and tickets
	}

	return { group, update, highlight, anchor };
}
