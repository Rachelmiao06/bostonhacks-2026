// T Party addition (not in Yarn World): play with the trophies.
// - Poke (click): a hard little hop, a ringing wobble and a metal clink. No squash: they are metal, not wool.
// - Grab and drag (same gesture as lifting a sheep): the trophy hangs from the hand, lags and tilts behind it,
//   and on release it drops with real gravity, bounces once, rings, and settles on the nearest free ground.
// Compared with the soft things on the island (sheep, trees, stones) the springs are stiffer, gravity is
// heavier and the bounce is small. That is the "tougher physics".
import * as THREE from 'three';
import { Spring } from './spring.js';
import { S } from './layout.js';
import { playPlink, playStone, playThump } from './sound.js';

const GRAVITY = 28; // sheep drop slowly; a trophy falls hard
const RESTITUTION = 0.3; // and bounces very little
const HOP = 2.3; // upward speed of a poke
const PICK_R = 0.5;
const HAND_LIMIT = S(5.2);
const HANG = 0.4; // how far below the hand the trophy's base hangs
const SWING_GAIN = 0.045; // lag tilt per unit of speed: low, because they are heavy
const SWING_MAX = 0.32;
const HOVER = 1.06;
const FAR = 1e6; // a blocker parked here does not block anything

const REST = 0;
const HELD = 1;
const FALL = 2;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _c = new THREE.Vector3();
const _v = new THREE.Vector3();

/**
 * @param trophies   { items: [{ obj, stage, blocker }] } from trophies.js
 * @param terrain    { groundAt, walkable, riverQuery } from world.js
 * @param weave      the weave module: `live(obj)` says whether a piece is on the island and not mid-animation
 */
export function setupTrophyPlay({ trophies, terrain, weave }) {
	const { groundAt, walkable, riverQuery } = terrain;
	const lives = trophies.items.map((item) => {
		const g = item.obj;
		g.rotation.order = 'YXZ'; // yaw first, so pitch and roll tilt about the trophy's own axes
		const l = {
			item,
			g,
			baseScale: g.scale.x,
			yaw: g.rotation.y,
			home: g.position.clone(),
			state: REST,
			token: 0,
			vx: 0,
			vy: 0,
			vz: 0,
			goal: new THREE.Vector2(), // where it will land
			// follows the hand; stiff and well damped, so it feels heavy
			fx: new Spring(150, 17),
			fy: new Spring(150, 17),
			fz: new Spring(150, 17),
			// ringing wobble after a hit: lightly damped, so it rings a while
			pitch: new Spring(260, 6),
			roll: new Spring(260, 6),
			hover: new Spring(200, 17, 1),
			hx: 0,
			hy: 0,
			hz: 0,
		};
		return l;
	});

	function parkBlocker(l, on) {
		const b = l.item.blocker;
		if (!b) return;
		if (on) b[0] = b[1] = FAR;
	}
	function placeBlocker(l) {
		const b = l.item.blocker;
		if (b) {
			b[0] = l.g.position.x;
			b[1] = l.g.position.z;
		}
	}

	// the nearest ground a trophy may rest on: dry, clear of the house, trees, ball and the other trophies
	function freeSpot(x, z, out) {
		const ok = (px, pz) => Math.abs(px) < HAND_LIMIT && Math.abs(pz) < HAND_LIMIT && walkable(px, pz) && riverQuery(px, pz).d > 0.9;
		if (ok(x, z)) return out.set(x, z);
		for (let r = 0.25; r <= 3.5; r += 0.25) {
			const n = Math.max(8, Math.ceil(r * 14));
			for (let i = 0; i < n; i++) {
				const a = (i / n) * Math.PI * 2;
				const px = x + Math.sin(a) * r;
				const pz = z + Math.cos(a) * r;
				if (ok(px, pz)) return out.set(px, pz);
			}
		}
		return out.set(x, z);
	}

	function setTilt(l, dt) {
		const p = l.pitch.update(dt);
		const r = l.roll.update(dt);
		l.g.rotation.x = p;
		l.g.rotation.z = r;
		l.g.scale.setScalar(l.baseScale * l.hover.update(dt));
	}

	function startFall(l, vx = 0, vy = 0, vz = 0) {
		l.state = FALL;
		l.vx = vx;
		l.vy = vy;
		l.vz = vz;
		parkBlocker(l, true);
		freeSpot(l.g.position.x + vx * 0.25, l.g.position.z + vz * 0.25, l.goal);
	}

	function poke(l) {
		if (l.state !== REST) return;
		startFall(l, 0, HOP, 0);
		l.goal.set(l.g.position.x, l.g.position.z); // a hop stays where it is
		// a random knock, so each poke wobbles a little differently
		l.pitch.velocity += (Math.random() - 0.5) * 7;
		l.roll.velocity += (Math.random() - 0.5) * 7;
		playStone();
		playPlink({ pitch: 1.5 + Math.random() * 0.5 });
	}

	function land(l, impact) {
		l.pitch.velocity += (Math.random() - 0.5) * impact * 0.9;
		l.roll.velocity += (Math.random() - 0.5) * impact * 0.9;
		if (impact > 3) {
			playThump({ pitch: 0.8 });
			playPlink({ pitch: 1.2 + Math.random() * 0.4 });
		} else playPlink({ pitch: 1.9 });
	}

	function updateHeld(l, dt) {
		const p = l.g.position;
		l.fx.update(dt);
		l.fy.update(dt);
		l.fz.update(dt);
		p.set(l.fx.value, l.fy.value - HANG, l.fz.value);
		// it lags behind the hand: lean against the motion
		const sn = Math.sin(l.yaw);
		const cs = Math.cos(l.yaw);
		const vx = l.fx.velocity;
		const vz = l.fz.velocity;
		l.pitch.target = clamp((vx * sn + vz * cs) * SWING_GAIN, -SWING_MAX, SWING_MAX);
		l.roll.target = clamp(-(vx * cs - vz * sn) * SWING_GAIN, -SWING_MAX, SWING_MAX);
	}

	function updateFall(l, dt) {
		const p = l.g.position;
		l.vy -= GRAVITY * dt;
		// slide toward the landing spot, and let any throw speed die away
		const k = Math.min(1, dt * 7);
		p.x += (l.goal.x - p.x) * k + l.vx * dt * 0.4;
		p.z += (l.goal.y - p.z) * k + l.vz * dt * 0.4;
		l.vx *= 0.92;
		l.vz *= 0.92;
		p.y += l.vy * dt;
		const floor = groundAt(p.x, p.z);
		if (p.y > floor) return;
		p.y = floor;
		const impact = Math.abs(l.vy);
		if (impact > 2.4) {
			// one small bounce
			l.vy = impact * RESTITUTION;
			land(l, impact);
			return;
		}
		land(l, 1);
		l.state = REST;
		l.vy = 0;
		p.x = l.goal.x;
		p.z = l.goal.y;
		p.y = groundAt(p.x, p.z);
		placeBlocker(l);
	}

	function update(dt) {
		for (const l of lives) {
			// the island is being folded away: let go of whatever is in the hand
			if (l.state === HELD && weave.busy) startFall(l);
			if (l.state === HELD) updateHeld(l, dt);
			else if (l.state === FALL) updateFall(l, dt);
			if (l.state === REST && l.pitch.settled && l.roll.settled && l.hover.settled) continue;
			if (l.state !== HELD) {
				l.pitch.target = 0;
				l.roll.target = 0;
			}
			setTilt(l, dt);
		}
	}

	function grabbableOf(l) {
		return {
			pick(ray) {
				if (l.state === HELD || !weave.live(l.g)) return null;
				_c.set(0, 0.4, 0).applyMatrix4(l.g.matrixWorld);
				_v.subVectors(_c, ray.origin);
				const tca = _v.dot(ray.direction);
				const d2 = _v.lengthSq() - tca * tca;
				if (d2 > PICK_R * PICK_R) return null;
				return { distance: Math.max(0, tca - Math.sqrt(PICK_R * PICK_R - d2)) };
			},
			grab() {
				const none = { move() {}, release() {} };
				if (l.state === HELD || !weave.live(l.g)) return none;
				const token = ++l.token;
				l.state = HELD;
				parkBlocker(l, true);
				const p = l.g.position;
				l.fx.snap(p.x);
				l.fy.snap(p.y + HANG);
				l.fz.snap(p.z);
				l.hx = p.x;
				l.hy = p.y + HANG + 0.3;
				l.hz = p.z;
				l.fx.target = l.hx;
				l.fy.target = l.hy;
				l.fz.target = l.hz;
				l.hover.target = HOVER;
				l.pitch.value = l.roll.value = 0;
				playPlink({ pitch: 2.1 });
				return {
					move(target) {
						if (l.token !== token || l.state !== HELD) return;
						l.hx = clamp(target.x, -HAND_LIMIT, HAND_LIMIT);
						l.hz = clamp(target.z, -HAND_LIMIT, HAND_LIMIT);
						// hand height from poke.js is the ground under the cursor plus a little; keep it clear of the ground
						l.hy = Math.max(target.y, groundAt(l.hx, l.hz) + 0.3) + HANG;
						l.fx.target = l.hx;
						l.fy.target = l.hy;
						l.fz.target = l.hz;
					},
					release() {
						if (l.token !== token || l.state !== HELD) return;
						l.hover.target = 1;
						startFall(l, clamp(l.fx.velocity, -5, 5), Math.min(l.fy.velocity, 1), clamp(l.fz.velocity, -5, 5));
					},
				};
			},
		};
	}

	for (const l of lives) {
		l.g.userData.onPoke = () => poke(l);
		l.g.userData.onHover = (on) => {
			if (l.state !== HELD) l.hover.target = on ? HOVER : 1;
		};
	}

	return {
		update,
		grabbables: lives.map(grabbableOf),
		/** Back to where they were set out (the island is knitting in again). */
		reset() {
			for (const l of lives) {
				l.token++;
				l.state = REST;
				l.vx = l.vy = l.vz = 0;
				l.g.position.copy(l.home);
				l.pitch.snap(0);
				l.roll.snap(0);
				l.hover.snap(1);
				l.g.rotation.x = l.g.rotation.z = 0;
				l.g.scale.setScalar(l.baseScale);
				placeBlocker(l);
			}
		},
	};
}
