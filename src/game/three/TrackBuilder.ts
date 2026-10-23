/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { LevelConfig } from '../../types/game';

export interface CheckpointGateMesh {
  index: number;
  distance: number;
  position: THREE.Vector3;
  group: THREE.Group;
  ringMesh: THREE.Mesh;
  light: THREE.PointLight;
}

export interface TrackData {
  trackGroup: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  totalLength: number;
  checkpoints: CheckpointGateMesh[];
  finishLinePosition: THREE.Vector3;
  tunnelRange: { start: number; end: number };
  getTrackPointAtDistance: (dist: number) => { position: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3 };
  dispose: () => void;
}

/**
 * Creates a procedural asphalt texture with grain and subtle road wear
 */
function createAsphaltTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.Texture() as unknown as THREE.CanvasTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#23252b';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.strokeStyle = 'rgba(15, 15, 18, 0.2)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(140, 0);
  ctx.lineTo(140, 512);
  ctx.moveTo(370, 0);
  ctx.lineTo(370, 512);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 24);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates procedural red & white curb texture
 */
function createCurbTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.Texture() as unknown as THREE.CanvasTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const stripeH = 32;
  for (let y = 0; y < 128; y += stripeH) {
    ctx.fillStyle = (y / stripeH) % 2 === 0 ? '#dc2626' : '#f8fafc';
    ctx.fillRect(0, y, 128, stripeH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 48);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates procedural banner texture for trackside sponsor boards
 */
function createBannerTexture(text: string, subtitle: string, bgColor: string): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.Texture() as unknown as THREE.CanvasTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 4);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 4, 512, 4);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 8, 512, 4);

  ctx.font = 'bold 36px "Montserrat", "Arial Black", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 64);

  ctx.font = 'bold 18px "Arial", sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.fillText(subtitle, 256, 100);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates illuminated sign texture for Tunnel Entrance/Exit Portals
 */
function createPortalSignTexture(title: string, subtitle: string): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.Texture() as unknown as THREE.CanvasTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  const stripeW = 24;
  ctx.fillStyle = '#f59e0b';
  for (let x = 0; x < 512; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW - 8, 16);
    ctx.lineTo(x - 8, 16);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, 112);
    ctx.lineTo(x + stripeW, 112);
    ctx.lineTo(x + stripeW - 8, 128);
    ctx.lineTo(x - 8, 128);
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = '900 32px "Montserrat", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 62);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(subtitle, 256, 96);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates start / finish line gantry banner texture
 */
function createStartFinishBannerTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.Texture() as unknown as THREE.CanvasTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const bCtx = canvas.getContext('2d')!;
  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(0, 0, 512, 128);
  bCtx.fillStyle = '#ffffff';
  bCtx.font = 'bold 32px sans-serif';
  bCtx.textAlign = 'center';
  bCtx.fillText('★ DEUTSCH RACER: START / ZIEL ★', 256, 75);
  const bannerTex = new THREE.CanvasTexture(canvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  return bannerTex;
}

/**
 * Creates checkpoint sign texture
 */
function createCheckpointSignTexture(checkpointNumber: number): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.Texture() as unknown as THREE.CanvasTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const sCtx = canvas.getContext('2d')!;
  sCtx.fillStyle = '#0284c7';
  sCtx.fillRect(0, 0, 512, 128);
  sCtx.fillStyle = '#ffffff';
  sCtx.font = 'bold 36px "Montserrat", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.fillText(`FRAGE-CHECKPOINT ${checkpointNumber}`, 256, 60);
  sCtx.font = 'bold 20px sans-serif';
  sCtx.fillStyle = '#fde047';
  sCtx.fillText('HALT & ANTWORTEN', 256, 100);
  const signTex = new THREE.CanvasTexture(canvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  return signTex;
}

/**
 * Procedural composite Pine Tree
 */
function buildPineTree(): THREE.Group {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.2, 8);
  trunkGeo.translate(0, 1.1, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
    metalness: 0.05,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  group.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    roughness: 0.8,
    metalness: 0.1,
  });

  const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.0, 8), foliageMat);
  tier1.position.y = 2.4;
  group.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.8, 8), foliageMat);
  tier2.position.y = 3.6;
  group.add(tier2);

  const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 8), foliageMat);
  tier3.position.y = 4.7;
  group.add(tier3);

  return group;
}

/**
 * Procedural Elevation Profile:
 * Dedicated downhill plunge into the subterranean mountain tunnel from t = 0.28 to 0.58.
 * The entrance portal sits atop the crest at t = 0.28 (+2.4m), plunging down to -5.4m inside the mountain.
 */
function getTrackElevation(t: number): number {
  const normT = ((t % 1) + 1) % 1;

  if (normT >= 0.22 && normT <= 0.62) {
    if (normT < 0.28) {
      // Mountain crest approach (climbs smoothly to +2.4m)
      const p = (normT - 0.22) / 0.06;
      return 0.8 + Math.sin(p * Math.PI * 0.5) * 1.6;
    } else if (normT < 0.38) {
      // Downhill plunge straight through entrance portal into tunnel (2.4 -> -5.4)
      const p = (normT - 0.28) / 0.10;
      return 2.4 - (1 - Math.cos(p * Math.PI)) * 0.5 * 7.8;
    } else if (normT < 0.50) {
      // Subterranean tunnel floor (-5.4m to -5.0m)
      const p = (normT - 0.38) / 0.12;
      return -5.4 + Math.sin(p * Math.PI) * 0.4;
    } else if (normT < 0.58) {
      // Uphill climb toward exit portal (-5.4 -> +0.8)
      const p = (normT - 0.50) / 0.08;
      return -5.4 + (1 - Math.cos(p * Math.PI)) * 0.5 * 6.2;
    } else {
      // Transition out of portal into open sunshine
      const p = (normT - 0.58) / 0.04;
      return 0.8 + p * 0.2;
    }
  } else {
    // Open surface sections: gentle undulating hills strictly above ground level (y >= 0.4)
    return 0.8 + Math.sin(normT * Math.PI * 4) * 0.4;
  }
}

/**
 * Builds the 3D Tunnel Mesh Structure:
 * Tubular arched ceiling, structural reinforcement arch rings, overhead light strips, and interior point lights.
 */
function buildTunnel(
  curve: THREE.CatmullRomCurve3,
  tEntrance: number,
  tExit: number,
  trackWidth: number
): THREE.Group {
  const tunnelGroup = new THREE.Group();

  const sampleCount = 100;
  const archSegments = 16;
  const tunnelWidth = trackWidth + 2.8; // 14.8m wide
  const tunnelHeight = 5.6; // 5.6m clearance

  const vertices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const lightStripVertices: number[] = [];
  const lightStripIndices: number[] = [];

  for (let i = 0; i <= sampleCount; i++) {
    const fraction = i / sampleCount;
    const t = tEntrance + fraction * (tExit - tEntrance);
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Generate arch points from right curb to left curb
    for (let j = 0; j <= archSegments; j++) {
      const angle = (j / archSegments) * Math.PI; // 0 to PI
      const xOffset = Math.cos(angle) * (tunnelWidth / 2);
      const yOffset = Math.sin(angle) * tunnelHeight;

      const vPos = pt.clone().addScaledVector(normal, xOffset).addScaledVector(up, yOffset);
      vertices.push(vPos.x, vPos.y, vPos.z);

      const normVec = normal.clone().multiplyScalar(-Math.cos(angle)).addScaledVector(up, Math.sin(angle)).normalize();
      normals.push(normVec.x, normVec.y, normVec.z);
      uvs.push(j / archSegments, fraction * 24);

      // Apex overhead light strip
      if (j === Math.floor(archSegments / 2)) {
        const lightL = vPos.clone().addScaledVector(normal, -0.4);
        const lightR = vPos.clone().addScaledVector(normal, 0.4);
        lightStripVertices.push(lightL.x, lightL.y - 0.06, lightL.z);
        lightStripVertices.push(lightR.x, lightR.y - 0.06, lightR.z);
      }
    }

    if (i < sampleCount) {
      for (let j = 0; j < archSegments; j++) {
        const row1 = i * (archSegments + 1) + j;
        const row2 = (i + 1) * (archSegments + 1) + j;

        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }

      const lRow1 = i * 2;
      const lRow2 = (i + 1) * 2;
      lightStripIndices.push(lRow1, lRow1 + 1, lRow2);
      lightStripIndices.push(lRow1 + 1, lRow2 + 1, lRow2);
    }

    // Structural arch reinforcement rings every 7 steps
    if (i % 7 === 0) {
      const ringGroup = new THREE.Group();
      ringGroup.position.copy(pt);
      ringGroup.up.copy(up);
      ringGroup.lookAt(pt.clone().add(tangent));

      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.6,
        metalness: 0.6,
      });

      const beamCurve = new THREE.EllipseCurve(0, 0, tunnelWidth / 2, tunnelHeight, 0, Math.PI, false, 0);
      const beamPoints = beamCurve.getPoints(16);
      const beamGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(beamPoints.map((p) => new THREE.Vector3(p.x, p.y, 0))),
        16,
        0.35,
        6,
        false
      );
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      ringGroup.add(beamMesh);
      tunnelGroup.add(ringGroup);
    }

    // Overhead tunnel sodium-vapor lights every 14 steps (~25 meters)
    if (i % 14 === 0) {
      const apexPos = pt.clone().addScaledVector(up, tunnelHeight - 0.4);
      const tunnelLight = new THREE.PointLight(0xfef08a, 2.2, 28);
      tunnelLight.position.copy(apexPos);
      tunnelGroup.add(tunnelLight);
    }
  }

  // Tunnel tube mesh (double-sided basalt concrete)
  const tunnelGeo = new THREE.BufferGeometry();
  tunnelGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  tunnelGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  tunnelGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  tunnelGeo.setIndex(indices);

  const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x1e2430,
    roughness: 0.85,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
  tunnelGroup.add(tunnelMesh);

  // Continuous overhead glowing light strip
  const lightGeo = new THREE.BufferGeometry();
  lightGeo.setAttribute('position', new THREE.Float32BufferAttribute(lightStripVertices, 3));
  lightGeo.setIndex(lightStripIndices);
  const lightMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });
  const lightStrip = new THREE.Mesh(lightGeo, lightMat);
  tunnelGroup.add(lightStrip);

  return tunnelGroup;
}

/**
 * Builds heavy concrete Entrance & Exit Portals for the Tunnel
 */
function buildTunnelPortal(
  curve: THREE.CatmullRomCurve3,
  t: number,
  trackWidth: number,
  isEntrance: boolean
): THREE.Group {
  const portalGroup = new THREE.Group();
  const pt = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const up = new THREE.Vector3(0, 1, 0);

  portalGroup.position.copy(pt);
  portalGroup.up.copy(up);
  portalGroup.lookAt(pt.clone().add(isEntrance ? tangent : tangent.clone().negate()));

  const portalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.3,
  });

  const hazardMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Left & right heavy support pillars
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.8, 2.4), portalMat);
  p1.position.set(-trackWidth / 2 - 1.8, 3.8, 0);
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.8, 2.4), portalMat);
  p2.position.set(trackWidth / 2 + 1.8, 3.8, 0);
  portalGroup.add(p1);
  portalGroup.add(p2);

  // Heavy crossbeam over road
  const header = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 6.0, 1.8, 2.4), portalMat);
  header.position.set(0, 7.0, 0);
  portalGroup.add(header);

  // Hazard striped warning bar
  const hazardBar = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 5.6, 0.4, 2.5), hazardMat);
  hazardBar.position.set(0, 6.0, 0);
  portalGroup.add(hazardBar);

  // Signboard canvas
  const title = isEntrance ? '★ SPEED-TUNNEL ★' : '★ TUNNEL-AUSFAHRT ★';
  const subtitle = isEntrance ? 'LICHT EINSCHALTEN · 600m' : 'WILLKOMMEN IM ZIELBEREICH';
  const signTex = createPortalSignTexture(title, subtitle);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(trackWidth + 2.0, 1.2),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, 7.1, 1.25);
  portalGroup.add(signMesh);

  // Status signal lamps
  const lampGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  lampGeo.rotateX(Math.PI / 2);
  const lampMat = new THREE.MeshBasicMaterial({ color: isEntrance ? 0x22c55e : 0x38bdf8 });
  const lampL = new THREE.Mesh(lampGeo, lampMat);
  lampL.position.set(-trackWidth / 2 - 0.4, 6.0, 1.25);
  const lampR = new THREE.Mesh(lampGeo, lampMat);
  lampR.position.set(trackWidth / 2 + 0.4, 6.0, 1.25);
  portalGroup.add(lampL);
  portalGroup.add(lampR);

  return portalGroup;
}

/**
 * Builds mountain cliff rock formations flanking the tunnel portals
 */
function buildMountainRocks(
  curve: THREE.CatmullRomCurve3,
  tEntrance: number,
  tExit: number,
  trackWidth: number
): THREE.Group {
  const rocksGroup = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = tEntrance + (i / steps) * (tExit - tEntrance);
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Place mountain boulders on left and right sides
    const leftRock = new THREE.Mesh(new THREE.DodecahedronGeometry(5.0 + Math.random() * 4.0, 1), rockMat);
    leftRock.position.copy(pt).addScaledVector(normal, -trackWidth / 2 - 6.5 - Math.random() * 4);
    leftRock.position.y += 2.0 + Math.random() * 3.0;
    leftRock.scale.set(1.2, 1.6 + Math.random() * 0.8, 1.2);
    rocksGroup.add(leftRock);

    const rightRock = new THREE.Mesh(new THREE.DodecahedronGeometry(5.0 + Math.random() * 4.0, 1), rockMat);
    rightRock.position.copy(pt).addScaledVector(normal, trackWidth / 2 + 6.5 + Math.random() * 4);
    rightRock.position.y += 2.0 + Math.random() * 3.0;
    rightRock.scale.set(1.2, 1.6 + Math.random() * 0.8, 1.2);
    rocksGroup.add(rightRock);
  }

  return rocksGroup;
}

/**
 * Builds the entire 3D racing track for a given level
 */
export function buildTrack(levelConfig: LevelConfig, checkpointsCount: number): TrackData {
  const trackGroup = new THREE.Group();

  // 1. Spline points with downhill subterranean tunnel section
  const basePoints: THREE.Vector3[] = [];
  const segments = 36;
  const radiusX = 140;
  const radiusZ = 220;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = t * Math.PI * 2;
    const rX = radiusX + Math.sin(theta * 3) * 24 + Math.cos(theta * 2) * 15;
    const rZ = radiusZ + Math.cos(theta * 2) * 35;
    const x = Math.sin(theta) * rX;
    const z = Math.cos(theta) * rZ;
    const y = getTrackElevation(t);
    basePoints.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(basePoints, true, 'centripetal');
  const totalLength = curve.getLength();

  // Tunnel range parameters: entrance at t = 0.28, exit at t = 0.58 (30% of total circuit lap)
  const tunnelEntranceT = 0.28;
  const tunnelExitT = 0.58;

  // 2. Track ribbon geometry (12 meters wide)
  const trackWidth = 12;
  const sampleCount = 360;
  const roadGeometry = new THREE.BufferGeometry();
  const roadVertices: number[] = [];
  const roadUVs: number[] = [];
  const roadNormals: number[] = [];
  const roadIndices: number[] = [];

  const centerLineVertices: number[] = [];
  const centerLineIndices: number[] = [];

  const curbLVertices: number[] = [];
  const curbRVertices: number[] = [];
  const curbIndices: number[] = [];

  // Surface verges (terrain ribbon flanking the road in open air)
  const vergeLVertices: number[] = [];
  const vergeRVertices: number[] = [];
  const vergeIndices: number[] = [];

  const asphaltTex = createAsphaltTexture();
  const curbTex = createCurbTexture();

  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Road outer edges
    const leftPt = pt.clone().addScaledVector(normal, -trackWidth / 2);
    const rightPt = pt.clone().addScaledVector(normal, trackWidth / 2);

    roadVertices.push(leftPt.x, leftPt.y + 0.02, leftPt.z);
    roadVertices.push(rightPt.x, rightPt.y + 0.02, rightPt.z);

    roadUVs.push(0, t * 40);
    roadUVs.push(1, t * 40);

    roadNormals.push(0, 1, 0);
    roadNormals.push(0, 1, 0);

    // Curbs (width = 0.8m)
    const curbLOuter = leftPt.clone().addScaledVector(normal, -0.8);
    curbLVertices.push(curbLOuter.x, curbLOuter.y + 0.06, curbLOuter.z);
    curbLVertices.push(leftPt.x, leftPt.y + 0.04, leftPt.z);

    const curbROuter = rightPt.clone().addScaledVector(normal, 0.8);
    curbRVertices.push(rightPt.x, rightPt.y + 0.04, rightPt.z);
    curbRVertices.push(curbROuter.x, curbROuter.y + 0.06, curbROuter.z);

    // Center dash lines
    const cL = pt.clone().addScaledVector(normal, -0.15);
    const cR = pt.clone().addScaledVector(normal, 0.15);
    centerLineVertices.push(cL.x, cL.y + 0.04, cL.z);
    centerLineVertices.push(cR.x, cR.y + 0.04, cR.z);

    // Surface landscape verges (generated ONLY outside tunnel to prevent any clipping)
    const isInTunnel = t >= tunnelEntranceT && t <= tunnelExitT;
    const vergeWidth = 35.0;
    const vergeLOut = leftPt.clone().addScaledVector(normal, -vergeWidth);
    vergeLOut.y = pt.y - (isInTunnel ? 0.8 : 0.12);
    const vergeROut = rightPt.clone().addScaledVector(normal, vergeWidth);
    vergeROut.y = pt.y - (isInTunnel ? 0.8 : 0.12);

    vergeLVertices.push(vergeLOut.x, vergeLOut.y, vergeLOut.z);
    vergeLVertices.push(leftPt.x, leftPt.y - 0.04, leftPt.z);

    vergeRVertices.push(rightPt.x, rightPt.y - 0.04, rightPt.z);
    vergeRVertices.push(vergeROut.x, vergeROut.y, vergeROut.z);

    if (i < sampleCount) {
      const row1 = i * 2;
      const row2 = (i + 1) * 2;
      roadIndices.push(row1, row1 + 1, row2);
      roadIndices.push(row1 + 1, row2 + 1, row2);

      curbIndices.push(row1, row1 + 1, row2);
      curbIndices.push(row1 + 1, row2 + 1, row2);

      // Only draw landscape verge triangles in open surface sections
      if (!isInTunnel) {
        vergeIndices.push(row1, row1 + 1, row2);
        vergeIndices.push(row1 + 1, row2 + 1, row2);
      }

      if (i % 4 < 2) {
        centerLineIndices.push(row1, row1 + 1, row2);
        centerLineIndices.push(row1 + 1, row2 + 1, row2);
      }
    }
  }

  roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  roadGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeometry.setIndex(roadIndices);

  const roadMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.8,
    metalness: 0.1,
  });
  const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
  roadMesh.receiveShadow = true;
  trackGroup.add(roadMesh);

  // Curbs mesh (Left & Right)
  const curbLGeo = new THREE.BufferGeometry();
  curbLGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbLVertices, 3));
  curbLGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  curbLGeo.setIndex(curbIndices);
  curbLGeo.computeVertexNormals();

  const curbRGeo = new THREE.BufferGeometry();
  curbRGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbRVertices, 3));
  curbRGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  curbRGeo.setIndex(curbIndices);
  curbRGeo.computeVertexNormals();

  const curbMaterial = new THREE.MeshStandardMaterial({
    map: curbTex,
    roughness: 0.6,
    metalness: 0.1,
  });
  const curbLMesh = new THREE.Mesh(curbLGeo, curbMaterial);
  const curbRMesh = new THREE.Mesh(curbRGeo, curbMaterial);
  trackGroup.add(curbLMesh);
  trackGroup.add(curbRMesh);

  // Center dashes mesh
  const centerGeo = new THREE.BufferGeometry();
  centerGeo.setAttribute('position', new THREE.Float32BufferAttribute(centerLineVertices, 3));
  centerGeo.setIndex(centerLineIndices);
  centerGeo.computeVertexNormals();
  const centerMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
  });
  const centerMesh = new THREE.Mesh(centerGeo, centerMat);
  trackGroup.add(centerMesh);

  // Surface landscape verges (conforming to track elevation, never bridging across)
  const vergeMat = new THREE.MeshStandardMaterial({
    color: levelConfig.sceneryTheme === 'alps' ? 0x334155 : 0x1e3a1e,
    roughness: 0.9,
    metalness: 0.05,
  });

  const vergeLGeo = new THREE.BufferGeometry();
  vergeLGeo.setAttribute('position', new THREE.Float32BufferAttribute(vergeLVertices, 3));
  vergeLGeo.setIndex(vergeIndices);
  vergeLGeo.computeVertexNormals();
  const vergeLMesh = new THREE.Mesh(vergeLGeo, vergeMat);
  trackGroup.add(vergeLMesh);

  const vergeRGeo = new THREE.BufferGeometry();
  vergeRGeo.setAttribute('position', new THREE.Float32BufferAttribute(vergeRVertices, 3));
  vergeRGeo.setIndex(vergeIndices);
  vergeRGeo.computeVertexNormals();
  const vergeRMesh = new THREE.Mesh(vergeRGeo, vergeMat);
  trackGroup.add(vergeRMesh);

  // 3. 3D Mountain Tunnel Structure & Portals
  const tunnelStructure = buildTunnel(curve, tunnelEntranceT, tunnelExitT, trackWidth);
  trackGroup.add(tunnelStructure);

  const entrancePortal = buildTunnelPortal(curve, tunnelEntranceT, trackWidth, true);
  trackGroup.add(entrancePortal);

  const exitPortal = buildTunnelPortal(curve, tunnelExitT, trackWidth, false);
  trackGroup.add(exitPortal);

  const mountainRocks = buildMountainRocks(curve, tunnelEntranceT, tunnelExitT, trackWidth);
  trackGroup.add(mountainRocks);

  // 4. Distant Horizon Bedrock (positioned at y = -16.0, well below road and tunnel)
  const distantGroundGeo = new THREE.PlaneGeometry(1200, 1200);
  distantGroundGeo.rotateX(-Math.PI / 2);
  const distantGround = new THREE.Mesh(distantGroundGeo, vergeMat);
  distantGround.position.y = -16.0;
  trackGroup.add(distantGround);

  // 5. Start / Finish Line Gantry
  const startT = 0;
  const startPt = curve.getPointAt(startT);
  const startTangent = curve.getTangentAt(startT).normalize();

  const gantryGroup = new THREE.Group();
  gantryGroup.position.copy(startPt);
  gantryGroup.up.set(0, 1, 0);
  gantryGroup.lookAt(startPt.clone().add(startTangent));

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 0.8), pillarMat);
  p1.position.set(-trackWidth / 2 - 1.2, 3.2, 0);
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 0.8), pillarMat);
  p2.position.set(trackWidth / 2 + 1.2, 3.2, 0);
  gantryGroup.add(p1);
  gantryGroup.add(p2);

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 3.2, 1.2, 0.9), pillarMat);
  crossbar.position.set(0, 6.0, 0);
  gantryGroup.add(crossbar);

  // Checkered banner
  const bannerTex = createStartFinishBannerTexture();
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(trackWidth + 2.5, 1.0),
    new THREE.MeshBasicMaterial({ map: bannerTex })
  );
  bannerMesh.position.set(0, 6.0, 0.46);
  gantryGroup.add(bannerMesh);

  trackGroup.add(gantryGroup);

  // 6. Build Checkpoints along track
  const checkpoints: CheckpointGateMesh[] = [];
  const spacing = 1 / (checkpointsCount + 1);

  for (let c = 1; c <= checkpointsCount; c++) {
    const cpT = c * spacing;
    const cpDist = cpT * totalLength;
    const cpPt = curve.getPointAt(cpT);
    const cpTangent = curve.getTangentAt(cpT).normalize();

    const cpGroup = new THREE.Group();
    cpGroup.position.copy(cpPt);
    cpGroup.up.set(0, 1, 0);
    cpGroup.lookAt(cpPt.clone().add(cpTangent));

    // Glowing Arch Frame (height tuned to 5.0m to fit both surface & inside tunnel)
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.2,
    });
    const cpPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.0, 0.6), archMat);
    cpPillar1.position.set(-trackWidth / 2 - 0.8, 2.5, 0);
    const cpPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.0, 0.6), archMat);
    cpPillar2.position.set(trackWidth / 2 + 0.8, 2.5, 0);
    cpGroup.add(cpPillar1);
    cpGroup.add(cpPillar2);

    const cpTop = new THREE.Mesh(new THREE.BoxGeometry(trackWidth + 2.2, 0.8, 0.6), archMat);
    cpTop.position.set(0, 4.8, 0);
    cpGroup.add(cpTop);

    // Rotating Glowing Diamond / Ring Indicator in middle
    const ringGeo = new THREE.TorusGeometry(1.5, 0.16, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      metalness: 0.3,
      roughness: 0.1,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 3.2, 0);
    cpGroup.add(ringMesh);

    // Checkpoint Sign Canvas ("KONTROLLPUNKT #")
    const signTex = createCheckpointSignTexture(c);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth, 0.7),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(0, 4.8, 0.32);
    cpGroup.add(signMesh);

    // Light
    const cpLight = new THREE.PointLight(0x38bdf8, 2.5, 20);
    cpLight.position.set(0, 3.6, 0);
    cpGroup.add(cpLight);

    trackGroup.add(cpGroup);

    checkpoints.push({
      index: c - 1,
      distance: cpDist,
      position: cpPt,
      group: cpGroup,
      ringMesh,
      light: cpLight,
    });
  }

  // 7. Trackside Props: Pine trees & Grandstand Sponsor Boards (in open surface zones)
  const sponsors = [
    { title: 'DEUTSCHLAND GP', subtitle: 'Lerne Deutsch am Limit', color: '#1e293b' },
    { title: 'AUTOBAHN GT', subtitle: 'Schnell sprechen, schnell fahren', color: '#b91c1c' },
    { title: 'WORT-MEISTER', subtitle: 'Grammatik & Wortschatz Champ', color: '#0369a1' },
    { title: 'PB3 & PETRA', subtitle: 'Das Raumschiff im Garten', color: '#047857' },
  ];

  for (let i = 0; i < 28; i++) {
    const t = (i / 28 + 0.03) % 1.0;

    // Do not place surface trees directly inside subterranean tunnel
    if (t >= tunnelEntranceT && t <= tunnelExitT) {
      continue;
    }

    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    // Place trees on both sides
    const treeL = buildPineTree();
    treeL.position.copy(pt).addScaledVector(normal, -trackWidth / 2 - 4.5 - Math.random() * 8);
    treeL.scale.setScalar(0.75 + Math.random() * 0.45);
    trackGroup.add(treeL);

    const treeR = buildPineTree();
    treeR.position.copy(pt).addScaledVector(normal, trackWidth / 2 + 4.5 + Math.random() * 8);
    treeR.scale.setScalar(0.75 + Math.random() * 0.45);
    trackGroup.add(treeR);

    // Sponsor billboards every few intervals
    if (i % 4 === 0) {
      const sp = sponsors[(i / 4) % sponsors.length];
      const boardTex = createBannerTexture(sp.title, sp.subtitle, sp.color);
      const boardGeo = new THREE.PlaneGeometry(8, 2.2);
      const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
      const board = new THREE.Mesh(boardGeo, boardMat);

      const boardPos = pt.clone().addScaledVector(normal, trackWidth / 2 + 2.5);
      boardPos.y += 1.8;
      board.position.copy(boardPos);
      board.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().negate());
      trackGroup.add(board);
    }
  }

  const getTrackPointAtDistance = (dist: number) => {
    const normalized = Math.max(0, Math.min(dist / totalLength, 0.9999));
    const position = curve.getPointAt(normalized);
    const tangent = curve.getTangentAt(normalized).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    return { position, tangent, normal };
  };

  const dispose = () => {
    asphaltTex.dispose();
    curbTex.dispose();
  };

  return {
    trackGroup,
    curve,
    totalLength,
    checkpoints,
    finishLinePosition: startPt,
    tunnelRange: { start: tunnelEntranceT, end: tunnelExitT },
    getTrackPointAtDistance,
    dispose,
  };
}
