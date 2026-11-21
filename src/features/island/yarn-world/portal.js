// T Party addition (not in Yarn World): a purple portal that opens in the sky above a spot, holds while a piece
// falls through it, and closes again. weave.js drives it during `dropIn`; nothing else touches it.
//
// Made of: a swirling disc (shader), a glowing rim that spins, a faint beam down to the ground, and a few
// sparkles circling the rim. All unlit, so it glows against the warm island. The group is always in the scene
// (scaled to nothing when shut) so its shaders are compiled up front like everything else.
import * as THREE from 'three';
import { Spring } from './spring.js';

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const DISC = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uOpen;
void main() {
	vec2 p = vUv * 2.0 - 1.0;
	float r = length(p);
	if (r > 1.0) discard;
	float a = atan(p.y, p.x);
	float arm = sin(a * 3.0 - r * 9.0 + uTime * 2.6) * 0.5 + 0.5;
	float curl = sin(a * 5.0 + r * 14.0 - uTime * 3.4) * 0.5 + 0.5;
	vec3 deep = vec3(0.16, 0.04, 0.34);
	vec3 mid = vec3(0.52, 0.22, 0.88);
	vec3 hi = vec3(0.88, 0.68, 1.0);
	vec3 col = mix(deep, mid, arm * (1.0 - r * 0.45));
	col = mix(col, hi, curl * 0.32 * (1.0 - r));
	col += vec3(0.5, 0.3, 0.9) * smoothstep(0.55, 0.0, r) * 0.4;
	col = mix(col, hi, smoothstep(0.76, 0.96, r) * 0.75);
	// the composer converts from linear on output; pre-darken so the colours read as written
	col = pow(col, vec3(2.2));
	gl_FragColor = vec4(col, (1.0 - smoothstep(0.93, 1.0, r)) * uOpen);
}`;

const BEAM = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uOpen;
void main() {
	float fall = 1.0 - vUv.y; // vUv.y is 1 at the top of the cylinder
	float shimmer = 0.75 + 0.25 * sin(vUv.x * 40.0 + uTime * 3.0);
	vec3 col = pow(vec3(0.62, 0.38, 0.95), vec3(2.2));
	gl_FragColor = vec4(col, 0.2 * pow(fall, 0.6) * shimmer * uOpen);
}`;

const SPARKS = 28;

export function setupPortal({ root, radius = 0.95 }) {
	const group = new THREE.Group();
	group.name = 'portal';
	group.scale.setScalar(1e-4);
	root.add(group);

	const uniforms = { uTime: { value: 0 }, uOpen: { value: 0 } };
	const glow = (frag) =>
		new THREE.ShaderMaterial({
			uniforms,
			vertexShader: VERT,
			fragmentShader: frag,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
		});

	const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), glow(DISC));
	disc.rotation.x = -Math.PI / 2; // lies flat, facing up and down
	group.add(disc);

	const rimMat = new THREE.MeshBasicMaterial({ color: '#c9a2ff', transparent: true, depthWrite: false });
	const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 10, 56), rimMat);
	rim.rotation.x = Math.PI / 2;
	group.add(rim);
	const rim2 = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.025, 8, 48), rimMat);
	rim2.rotation.x = Math.PI / 2;
	group.add(rim2);

	// a faint column of light from the portal to the ground, so it reads from low camera angles too
	const beamH = 1; // scaled to the real height in `open`
	const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius * 0.8, beamH, 32, 1, true), glow(BEAM));
	beam.position.y = -beamH / 2;
	group.add(beam);

	const sparkGeo = new THREE.BufferGeometry();
	const sparkPos = new Float32Array(SPARKS * 3);
	sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
	const sparks = new THREE.Points(
		sparkGeo,
		new THREE.PointsMaterial({
			color: '#e4ccff',
			size: 0.09,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			sizeAttenuation: true,
		}),
	);
	sparks.frustumCulled = false;
	group.add(sparks);

	// the portal is decoration: it must never catch a poke or the auto-focus ray
	for (const m of [disc, rim, rim2, beam, sparks]) m.raycast = () => {};

	const openSpring = new Spring(170, 13, 0);
	const target = new THREE.Vector3();
	let height = 3;
	let time = 0;

	function update(dt) {
		time += dt;
		const v = openSpring.update(dt);
		const s = Math.max(1e-4, v);
		group.scale.setScalar(s);
		uniforms.uTime.value = time;
		uniforms.uOpen.value = THREE.MathUtils.clamp(v, 0, 1);
		rimMat.opacity = THREE.MathUtils.clamp(v, 0, 1);
		rim.rotation.z = time * 1.2;
		rim2.rotation.z = -time * 1.8;
		// sparkles spiral around the rim and drift up and down
		for (let i = 0; i < SPARKS; i++) {
			const a = time * (0.9 + (i % 5) * 0.15) + (i / SPARKS) * Math.PI * 2;
			const r = radius * (0.55 + 0.5 * ((i * 7) % 10) / 10);
			sparkPos[i * 3] = Math.cos(a) * r;
			sparkPos[i * 3 + 1] = 0.15 * Math.sin(time * 2 + i) - ((i * 13) % 10) * 0.05;
			sparkPos[i * 3 + 2] = Math.sin(a) * r;
		}
		sparkGeo.attributes.position.needsUpdate = true;
		// follow the piece it is dropping (a sheep may wander while it waits)
		group.position.lerp(target, Math.min(1, dt * 9));
	}

	return {
		group,
		/** Open above (x, z) at `y`, with a beam down to `floorY`. Calling again moves it. */
		open(x, y, z, floorY) {
			const fresh = openSpring.target === 0;
			target.set(x, y, z);
			if (fresh) group.position.copy(target);
			height = Math.max(0.5, y - floorY);
			beam.scale.y = height;
			beam.position.y = -height / 2;
			openSpring.target = 1;
		},
		close() {
			openSpring.target = 0;
		},
		/** Snap shut with no animation (the island is being folded away). */
		reset() {
			openSpring.snap(0);
			group.scale.setScalar(1e-4);
		},
		get isOpen() {
			return openSpring.target === 1 && openSpring.value > 0.9;
		},
		update,
	};
}
