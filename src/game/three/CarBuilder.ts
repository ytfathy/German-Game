/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CarModel } from '../../types/game';

export interface CarRig {
  rootGroup: THREE.Group;
  chassisGroup: THREE.Group;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  taillightMaterial: THREE.MeshStandardMaterial;
  headlightLenses: THREE.MeshStandardMaterial[];
  update: (speed: number, steerAngle: number, isBraking: boolean, dt: number) => void;
  dispose: () => void;
}

/**
 * Creates a procedural radial soft shadow texture
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a single 3D wheel assembly with tire, chrome rim, and brake caliper
 */
function buildWheel(isFront: boolean): { group: THREE.Group; wheelMesh: THREE.Group } {
  const wheelGroup = new THREE.Group();
  const wheelMesh = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1e,
    roughness: 0.85,
    metalness: 0.05,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelMesh.add(tire);

  // Chrome alloy rim
  const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.29, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.9,
    roughness: 0.18,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelMesh.add(rim);

  // Rim spokes (cross)
  const spokeGeo = new THREE.BoxGeometry(0.04, 0.44, 0.3);
  const spoke1 = new THREE.Mesh(spokeGeo, rimMat);
  const spoke2 = new THREE.Mesh(spokeGeo, rimMat);
  spoke2.rotation.x = Math.PI / 2;
  wheelMesh.add(spoke1);
  wheelMesh.add(spoke2);

  // Center hub cap
  const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.31, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.7,
    roughness: 0.3,
  });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  wheelMesh.add(hub);

  // Red sport brake caliper behind rim
  const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.12);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.3,
    metalness: 0.4,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, 0.12, 0);
  wheelGroup.add(caliper); // caliper stays upright, doesn't spin with wheelMesh

  wheelGroup.add(wheelMesh);
  return { group: wheelGroup, wheelMesh };
}

/**
 * Procedural composite sports car builder
 */
export function buildSportsCar(carConfig: CarModel): CarRig {
  const rootGroup = new THREE.Group();
  const chassisGroup = new THREE.Group();
  rootGroup.add(chassisGroup);

  const primaryCol = new THREE.Color(carConfig.primaryColor);
  const accentCol = new THREE.Color(carConfig.accentColor);

  // 1. Car body / Paint Material
  const bodyMat = new THREE.MeshStandardMaterial({
    color: primaryCol,
    metalness: 0.7,
    roughness: 0.22,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentCol,
    metalness: 0.6,
    roughness: 0.3,
  });

  const blackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.4,
    roughness: 0.6,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.2,
    roughness: 0.08,
    transparent: true,
    opacity: 0.75,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    metalness: 0.95,
    roughness: 0.1,
  });

  // 1. Lower chassis / Hull
  const hullGeo = new THREE.BoxGeometry(1.7, 0.36, 3.8);
  hullGeo.translate(0, 0.36, 0);
  const hull = new THREE.Mesh(hullGeo, bodyMat);
  hull.castShadow = true;
  hull.receiveShadow = true;
  chassisGroup.add(hull);

  // 2. Front Nose / Aerodynamic Hood (sloped)
  const hoodGeo = new THREE.BoxGeometry(1.64, 0.22, 1.2);
  hoodGeo.translate(0, 0.45, 1.1);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.rotation.x = 0.07;
  chassisGroup.add(hood);

  // 3. Cabin / Cockpit Roof
  const cabinGeo = new THREE.BoxGeometry(1.36, 0.44, 1.6);
  cabinGeo.translate(0, 0.74, -0.2);
  const cabin = new THREE.Mesh(cabinGeo, bodyMat);
  chassisGroup.add(cabin);

  // 4. Tinted Windshield & Windows
  const windshieldGeo = new THREE.BoxGeometry(1.3, 0.42, 0.5);
  windshieldGeo.translate(0, 0.72, 0.55);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.rotation.x = -0.35;
  chassisGroup.add(windshield);

  const rearWindowGeo = new THREE.BoxGeometry(1.28, 0.4, 0.6);
  rearWindowGeo.translate(0, 0.71, -0.95);
  const rearWindow = new THREE.Mesh(rearWindowGeo, glassMat);
  rearWindow.rotation.x = 0.4;
  chassisGroup.add(rearWindow);

  // 5. Front Aerodynamic Splitter & Grille
  const splitterGeo = new THREE.BoxGeometry(1.72, 0.08, 0.4);
  splitterGeo.translate(0, 0.18, 1.9);
  const splitter = new THREE.Mesh(splitterGeo, blackTrimMat);
  chassisGroup.add(splitter);

  // 6. Rear Diffuser & Quad Chrome Exhausts
  const diffuserGeo = new THREE.BoxGeometry(1.68, 0.14, 0.3);
  diffuserGeo.translate(0, 0.22, -1.9);
  const diffuser = new THREE.Mesh(diffuserGeo, blackTrimMat);
  chassisGroup.add(diffuser);

  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustPos = [-0.45, -0.32, 0.32, 0.45];
  exhaustPos.forEach((x) => {
    const exhaust = new THREE.Mesh(exhaustGeo, chromeMat);
    exhaust.position.set(x, 0.24, -1.98);
    chassisGroup.add(exhaust);
  });

  // 7. Rear GT Spoiler Wing on dual struts
  const strutGeo = new THREE.BoxGeometry(0.05, 0.32, 0.12);
  const strutL = new THREE.Mesh(strutGeo, blackTrimMat);
  strutL.position.set(-0.55, 0.72, -1.7);
  const strutR = new THREE.Mesh(strutGeo, blackTrimMat);
  strutR.position.set(0.55, 0.72, -1.7);
  chassisGroup.add(strutL);
  chassisGroup.add(strutR);

  const wingGeo = new THREE.BoxGeometry(1.75, 0.06, 0.32);
  const wing = new THREE.Mesh(wingGeo, accentMat);
  wing.position.set(0, 0.88, -1.72);
  wing.rotation.x = -0.05;
  wing.castShadow = true;
  chassisGroup.add(wing);

  // 8. Front LED Headlights
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x93c5fd,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });
  const headlightGeo = new THREE.BoxGeometry(0.32, 0.1, 0.1);
  const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
  headlightL.position.set(-0.62, 0.46, 1.88);
  const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
  headlightR.position.set(0.62, 0.46, 1.88);
  chassisGroup.add(headlightL);
  chassisGroup.add(headlightR);

  // 9. Rear LED Taillight Bar
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xef4444,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const taillightGeo = new THREE.BoxGeometry(1.5, 0.08, 0.06);
  const taillight = new THREE.Mesh(taillightGeo, taillightMat);
  taillight.position.set(0, 0.52, -1.9);
  chassisGroup.add(taillight);

  // 10. Central Racing Livery Stripe
  const stripeGeo = new THREE.BoxGeometry(0.28, 0.02, 3.7);
  stripeGeo.translate(0, 0.56, 0);
  const stripe = new THREE.Mesh(stripeGeo, accentMat);
  stripe.position.y = 0.01;
  chassisGroup.add(stripe);

  // 11. Soft Radial Contact Shadow Plane
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(2.4, 4.4);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.02;
  rootGroup.add(contactShadow);

  // 12. Four 3D Wheels
  const wheelFL = buildWheel(true);
  const wheelFR = buildWheel(true);
  const wheelRL = buildWheel(false);
  const wheelRR = buildWheel(false);

  // Wheel positions: track width X = ±0.88, wheelbase Z = +1.15 / -1.15, Y = 0.38
  wheelFL.group.position.set(-0.88, 0.38, 1.15);
  wheelFR.group.position.set(0.88, 0.38, 1.15);
  wheelRL.group.position.set(-0.88, 0.38, -1.15);
  wheelRR.group.position.set(0.88, 0.38, -1.15);

  rootGroup.add(wheelFL.group);
  rootGroup.add(wheelFR.group);
  rootGroup.add(wheelRL.group);
  rootGroup.add(wheelRR.group);

  let wheelRotationAngle = 0;

  const update = (speed: number, steerAngle: number, isBraking: boolean, dt: number) => {
    // Steer front wheels smoothly
    wheelFL.group.rotation.y = steerAngle * 0.45;
    wheelFR.group.rotation.y = steerAngle * 0.45;

    // Spin wheels according to forward speed
    // v = omega * r -> omega = v / r
    const wheelRadius = 0.38;
    const speedMs = (speed * 1000) / 3600;
    const spinDelta = (speedMs / wheelRadius) * dt;
    wheelRotationAngle += spinDelta;

    wheelFL.wheelMesh.rotation.x = wheelRotationAngle;
    wheelFR.wheelMesh.rotation.x = wheelRotationAngle;
    wheelRL.wheelMesh.rotation.x = wheelRotationAngle;
    wheelRR.wheelMesh.rotation.x = wheelRotationAngle;

    // Taillight brake glow intensity
    taillightMat.emissiveIntensity = isBraking ? 2.8 : 0.8;

    // Suspension tilt: pitch on acceleration/braking, roll on steering
    const targetPitch = isBraking ? 0.04 : -Math.min(speed / 200, 1) * 0.025;
    const targetRoll = -steerAngle * Math.min(speed / 80, 1) * 0.05;

    chassisGroup.rotation.x = THREE.MathUtils.damp(chassisGroup.rotation.x, targetPitch, 8, dt);
    chassisGroup.rotation.z = THREE.MathUtils.damp(chassisGroup.rotation.z, targetRoll, 8, dt);
  };

  const dispose = () => {
    shadowTex.dispose();
  };

  return {
    rootGroup,
    chassisGroup,
    frontLeftWheel: wheelFL.group,
    frontRightWheel: wheelFR.group,
    rearLeftWheel: wheelRL.group,
    rearRightWheel: wheelRR.group,
    taillightMaterial: taillightMat,
    headlightLenses: [headlightMat],
    update,
    dispose,
  };
}
