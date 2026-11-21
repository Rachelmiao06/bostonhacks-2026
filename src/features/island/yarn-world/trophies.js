// T Party addition (not in Yarn World): one knitted trophy per stamp, up to `count`.
// Three shapes in turn (cup, medal, star), set out in a tidy cluster on the island's near corner.
// Each is a weave item with stage `trophyN`, so it knits in with the island and falls through the portal when earned.
import * as THREE from 'three';
import { FLOWER_CLUSTERS, CLOTHESLINE, BALL, S } from './layout.js';

const KINDS = ['cup', 'medal', 'star'];
const SCALE = 1.5; // trophies are small; this keeps them readable from the default camera
const SPACING = 1.05;

/** Picks `count` spots on open ground, nearest the default camera first, so the first trophy is the most visible. */
function pickSpots(terrain, count, avoid) {
	const { walkable, riverQuery } = terrain;
	const limit = S(4.7);
	const found = [];
	for (let x = -limit; x <= limit; x += 0.3) {
		for (let z = -limit; z <= limit; z += 0.3) {
			if (!walkable(x, z)) continue;
			if (riverQuery(x, z).d < 1.5) continue;
			if (FLOWER_CLUSTERS.some(([fx, fz]) => Math.hypot(x - fx, z - fz) < 1.1)) continue;
			if (CLOTHESLINE.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 1.0)) continue;
			if (Math.hypot(x - BALL.x, z - BALL.z) < 2.2) continue;
			if (avoid.some(([ax, az]) => Math.hypot(x - ax, z - az) < 2.0)) continue;
			found.push({ x, z, score: x + z });
		}
	}
	found.sort((a, b) => b.score - a.score);
	const spots = [];
	for (const c of found) {
		if (spots.every((s) => Math.hypot(s.x - c.x, s.z - c.z) >= SPACING)) spots.push(c);
		if (spots.length === count) break;
	}
	return spots;
}

function starShape() {
	const shape = new THREE.Shape();
	for (let i = 0; i < 10; i++) {
		const r = i % 2 === 0 ? 0.2 : 0.09;
		const a = Math.PI / 2 + (i * Math.PI) / 5;
		const x = Math.cos(a) * r;
		const y = Math.sin(a) * r;
		if (i === 0) shape.moveTo(x, y);
		else shape.lineTo(x, y);
	}
	shape.closePath();
	return shape;
}

/** `avoid`: [x, z] points (the kite) to keep clear of, on top of everything `terrain.walkable` already rules out. */
export function setupTrophies({ root, kit, terrain, count, avoid = [] }) {
	const { mat, add, cachedGeo, P } = kit;
	const gold = mat(P.gold, 'stockinette', [8, 6]);
	const silver = mat(P.stone2, 'stockinette', [8, 6]);
	const felt = mat(P.pink, 'garter', [8, 4]);
	const ribbon = mat(P.red, 'rib', [4, 8]);
	const ribbonBlue = mat(P.blue, 'rib', [4, 8]);

	const cupGeo = cachedGeo('trophy-cup', () => {
		const pts = [
			[0.001, 0.0],
			[0.15, 0.0],
			[0.15, 0.04],
			[0.05, 0.09],
			[0.04, 0.2],
			[0.11, 0.25],
			[0.2, 0.42],
			[0.18, 0.47],
			[0.15, 0.4],
			[0.001, 0.3],
		].map(([r, y]) => new THREE.Vector2(r, y));
		return new THREE.LatheGeometry(pts, 28);
	});
	const handleGeo = cachedGeo('trophy-handle', () => new THREE.TorusGeometry(0.085, 0.022, 10, 20, Math.PI * 1.15));
	const discGeo = cachedGeo('trophy-disc', () => new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32));
	const ribbonGeo = cachedGeo('trophy-ribbon', () => new THREE.BoxGeometry(0.075, 0.26, 0.02));
	const postGeo = cachedGeo('trophy-post', () => new THREE.CylinderGeometry(0.05, 0.06, 0.2, 14));
	const starGeo = cachedGeo('trophy-star', () => new THREE.ExtrudeGeometry(starShape(), { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }));
	const padGeo = cachedGeo('trophy-pad', () => new THREE.CylinderGeometry(0.26, 0.29, 0.06, 32));

	function build(kind) {
		const g = new THREE.Group();
		// a little felt pad every trophy sits on
		add(g, new THREE.Mesh(padGeo, felt)).position.y = 0.03;
		const top = new THREE.Group();
		top.position.y = 0.06;
		g.add(top);
		if (kind === 'cup') {
			add(top, new THREE.Mesh(cupGeo, gold));
			for (const side of [-1, 1]) {
				const h = add(top, new THREE.Mesh(handleGeo, gold));
				h.position.set(side * 0.19, 0.33, 0);
				h.rotation.z = side > 0 ? -Math.PI * 0.575 : Math.PI * 0.425;
			}
		} else if (kind === 'medal') {
			add(top, new THREE.Mesh(postGeo, silver)).position.y = 0.1;
			const disc = add(top, new THREE.Mesh(discGeo, silver));
			disc.rotation.x = Math.PI / 2;
			disc.position.y = 0.36;
			const inner = add(top, new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 28), gold));
			inner.rotation.x = Math.PI / 2;
			inner.position.set(0, 0.36, 0.01);
			for (const side of [-1, 1]) {
				const r = add(top, new THREE.Mesh(ribbonGeo, side > 0 ? ribbon : ribbonBlue));
				r.position.set(side * 0.06, 0.62, 0);
				r.rotation.z = side * -0.3;
			}
		} else {
			add(top, new THREE.Mesh(postGeo, gold)).position.y = 0.1;
			const star = add(top, new THREE.Mesh(starGeo, gold));
			star.position.set(0, 0.41, -0.03);
		}
		return g;
	}

	const spots = pickSpots(terrain, count, avoid);
	const items = spots.map((spot, i) => {
		const g = build(KINDS[i % KINDS.length]);
		g.scale.setScalar(SCALE);
		g.position.set(spot.x, terrain.groundAt(spot.x, spot.z), spot.z);
		// face the default camera a little, with a small spread so the row does not look stamped out
		g.rotation.y = Math.atan2(S(9) - spot.x, S(11) - spot.z) + (i % 2 ? 0.25 : -0.25);
		root.add(g);
		// the sheep walk around them
		terrain.blockers.push([spot.x, spot.z, 0.55]);
		return { obj: g, stage: `trophy${i + 1}` };
	});
	return { items, spots };
}
