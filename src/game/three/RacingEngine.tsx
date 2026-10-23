/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LevelConfig, CarModel, RacingSubState } from '../../types/game';
import { buildSportsCar, CarRig } from './CarBuilder';
import { buildTrack, TrackData } from './TrackBuilder';
import { audioService } from '../../services/audioService';

interface RacingEngineProps {
  levelConfig: LevelConfig;
  carConfig: CarModel;
  racingState: RacingSubState;
  onReachCheckpoint: (checkpointIdx: number) => void;
  onFinishRace: (raceTimeSeconds: number) => void;
  onUpdateTelemetry: (speedKmh: number, distanceMeters: number, totalMeters: number, currentGear: number) => void;
  resumeTrigger: number; // incremented when user clicks "Continue Racing"
  isPaused: boolean;
  activeInput: {
    gas: boolean;
    brake: boolean;
    steerLeft: boolean;
    steerRight: boolean;
    handbrake: boolean;
  };
}

export const RacingEngine: React.FC<RacingEngineProps> = ({
  levelConfig,
  carConfig,
  racingState,
  onReachCheckpoint,
  onFinishRace,
  onUpdateTelemetry,
  resumeTrigger,
  isPaused,
  activeInput,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store mutable refs to decouple simulation loop from React rendering
  const propsRef = useRef({
    levelConfig,
    carConfig,
    racingState,
    onReachCheckpoint,
    onFinishRace,
    onUpdateTelemetry,
    isPaused,
    activeInput,
  });
  propsRef.current = {
    levelConfig,
    carConfig,
    racingState,
    onReachCheckpoint,
    onFinishRace,
    onUpdateTelemetry,
    isPaused,
    activeInput,
  };

  const resumeTriggerRef = useRef(resumeTrigger);
  const boostUntilTimeRef = useRef(0);

  useEffect(() => {
    if (resumeTrigger > resumeTriggerRef.current) {
      resumeTriggerRef.current = resumeTrigger;
      // Grant a turbo boost when continuing
      boostUntilTimeRef.current = performance.now() + 1400;
    }
  }, [resumeTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detector
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Renderer setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Scene & Studio PBR Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(levelConfig.skyColor);
    scene.fog = new THREE.Fog(levelConfig.fogColor, 60, 320);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(60, 90, 45);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 280;
      sunLight.shadow.camera.left = -60;
      sunLight.shadow.camera.right = 60;
      sunLight.shadow.camera.top = 60;
      sunLight.shadow.camera.bottom = -60;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.9);
    scene.add(hemiLight);

    // 5. Camera setup (near plane 0.2 to prevent tunnel geometry clipping)
    const camera = new THREE.PerspectiveCamera(58, width / height, 0.2, 600);
    camera.position.set(0, 5, -9);

    // 6. Build 3D Track & Car
    const trackData: TrackData = buildTrack(levelConfig, levelConfig.checkpointsCount);
    scene.add(trackData.trackGroup);

    const carRig: CarRig = buildSportsCar(carConfig);
    scene.add(carRig.rootGroup);

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Simulation state variables
    let distanceTraveled = 0;
    let currentSpeedKmh = 0; // km/h
    let lateralOffset = 0; // -4 to +4 meters left/right across road
    let steerAngle = 0;
    let nextCheckpointIndex = 0;
    let raceStartTime = performance.now();
    let hasFinished = false;

    // Keys state tracking
    const keysDown = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.code);
      keysDown.add(e.key.toLowerCase());
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      keysDown.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      keysDown.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Resize observer
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Start engine procedural audio
    audioService.startEngine();

    // 8. Main 60 FPS Animation & Physics Loop
    let animId = 0;
    let lastTime = performance.now();
    let telemetryThrottle = 0;

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // clamp frame delta

      const currentProps = propsRef.current;
      const isPausedState = currentProps.isPaused;
      const racingSubState = currentProps.racingState;

      // Animate checkpoint rings
      trackData.checkpoints.forEach((cp, idx) => {
        cp.ringMesh.rotation.y += dt * 1.5;
        cp.ringMesh.rotation.z += dt * 0.8;
        // Pulse light when active
        if (idx === nextCheckpointIndex) {
          cp.light.intensity = 3.0 + Math.sin(now * 0.006) * 1.5;
        } else {
          cp.light.intensity = 1.0;
        }
      });

      if (!isPausedState) {
        // Read input (combining keyboard and on-screen touch controls)
        const gasInput =
          keysDown.has('KeyW') ||
          keysDown.has('ArrowUp') ||
          keysDown.has('w') ||
          currentProps.activeInput.gas;

        const brakeInput =
          keysDown.has('KeyS') ||
          keysDown.has('ArrowDown') ||
          keysDown.has('s') ||
          currentProps.activeInput.brake;

        const steerLeftInput =
          keysDown.has('KeyA') ||
          keysDown.has('ArrowLeft') ||
          keysDown.has('a') ||
          currentProps.activeInput.steerLeft;

        const steerRightInput =
          keysDown.has('KeyD') ||
          keysDown.has('ArrowRight') ||
          keysDown.has('d') ||
          currentProps.activeInput.steerRight;

        const handbrakeInput =
          keysDown.has('Space') ||
          currentProps.activeInput.handbrake;

        // Check if approaching or halted at checkpoint
        const currentCheckpoint = trackData.checkpoints[nextCheckpointIndex];
        const distToCheckpoint = currentCheckpoint
          ? currentCheckpoint.distance - distanceTraveled
          : 999999;

        const isAtQuestionModal =
          racingSubState === 'checkpoint_question' ||
          racingSubState === 'checkpoint_feedback' ||
          racingSubState === 'speaking_checkpoint';

        // Vehicle physics
        const maxTopSpeed = currentProps.carConfig.topSpeed;
        const accelRate = 65 * currentProps.carConfig.acceleration;
        const brakeRate = 110;
        const dragRate = 18;

        const isBoosted = now < boostUntilTimeRef.current;

        // Continuous normal racing base speed
        const cruiseSpeed = 85;

        if (isAtQuestionModal) {
          // Car is safely stopped at checkpoint dock
          currentSpeedKmh = THREE.MathUtils.damp(currentSpeedKmh, 0, 12, dt);
        } else if (distToCheckpoint > 0 && distToCheckpoint < 32 && nextCheckpointIndex < trackData.checkpoints.length) {
          // Automated smooth slowdown as we pull into the checkpoint gate
          const targetApproachingSpeed = Math.max(8, distToCheckpoint * 1.5);
          currentSpeedKmh = THREE.MathUtils.damp(currentSpeedKmh, targetApproachingSpeed, 6, dt);

          if (distToCheckpoint < 3.2 && currentSpeedKmh < 24) {
            // Trigger checkpoint modal!
            currentSpeedKmh = 0;
            currentProps.onReachCheckpoint(nextCheckpointIndex);
            nextCheckpointIndex++;
          }
        } else {
          // Normal racing: car moves continuously
          if (isBoosted) {
            currentSpeedKmh = THREE.MathUtils.damp(currentSpeedKmh, maxTopSpeed + 25, 4, dt);
          } else if (gasInput) {
            const target = maxTopSpeed;
            currentSpeedKmh = Math.min(target, currentSpeedKmh + accelRate * dt);
          } else if (brakeInput) {
            currentSpeedKmh = Math.max(0, currentSpeedKmh - brakeRate * dt);
          } else {
            // Continuous cruising speed
            if (currentSpeedKmh < cruiseSpeed) {
              currentSpeedKmh = Math.min(cruiseSpeed, currentSpeedKmh + accelRate * 0.7 * dt);
            } else {
              currentSpeedKmh = THREE.MathUtils.damp(currentSpeedKmh, cruiseSpeed, 2, dt);
            }
          }
        }

        // Steering physics
        let targetSteer = 0;
        if (steerLeftInput) targetSteer -= 1;
        if (steerRightInput) targetSteer += 1;

        steerAngle = THREE.MathUtils.damp(steerAngle, targetSteer, 9, dt);

        if (handbrakeInput && Math.abs(steerAngle) > 0.4 && currentSpeedKmh > 50) {
          audioService.playTireScreech();
        }

        // Lateral lane displacement across road (-4.5m to +4.5m)
        const lateralSpeed = steerAngle * (currentSpeedKmh / 90) * 8 * currentProps.carConfig.handling;
        lateralOffset = Math.max(-4.8, Math.min(4.8, lateralOffset + lateralSpeed * dt));

        // Advance distance traveled along track
        const speedMs = (currentSpeedKmh * 1000) / 3600;
        distanceTraveled += speedMs * dt;

        // Check race finish
        if (distanceTraveled >= trackData.totalLength && !hasFinished) {
          hasFinished = true;
          const totalRaceTime = (performance.now() - raceStartTime) / 1000;
          currentProps.onFinishRace(totalRaceTime);
        }

        // Position car on track spline
        const trackPt = trackData.getTrackPointAtDistance(distanceTraveled);
        const carPosition = trackPt.position.clone().addScaledVector(trackPt.normal, lateralOffset);
        carRig.rootGroup.position.copy(carPosition);

        // Orient car along track tangent + steering yaw
        const carFacing = trackPt.tangent.clone();
        carFacing.addScaledVector(trackPt.normal, steerAngle * 0.18).normalize();
        carRig.rootGroup.up.set(0, 1, 0);
        carRig.rootGroup.lookAt(carPosition.clone().add(carFacing));

        // Update car wheels, suspension, lights
        carRig.update(currentSpeedKmh, steerAngle, brakeInput || isAtQuestionModal, dt);

        // Camera follow rig with smooth downhill descent tracking
        // Compute forward direction in horizontal plane
        const forwardHoriz = new THREE.Vector3(trackPt.tangent.x, 0, trackPt.tangent.z).normalize();
        const followDistance = 5.5;
        const followHeight = 2.05;

        // Target camera position stays directly behind car at fixed height above car's current elevation
        const targetCamPos = carPosition.clone()
          .addScaledVector(forwardHoriz, -followDistance)
          .addScaledVector(trackPt.normal, lateralOffset * 0.35);
        targetCamPos.y = carPosition.y + followHeight;

        // Responsive vertical damping (rate 14) ensures the camera descends synchronously with the car
        // into the tunnel, keeping the vehicle in clear 3rd-person follow view throughout the descent
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.x, 8, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.y, 14, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.z, 8, dt);

        // Look at slightly in front of car, angled naturally down the slope
        const targetLookAt = carPosition.clone()
          .addScaledVector(trackPt.tangent, 7.5)
          .add(new THREE.Vector3(0, 0.85, 0));
        camera.lookAt(targetLookAt);

        // Speed-dependent camera FOV kick
        const speedRatio = Math.min(currentSpeedKmh / maxTopSpeed, 1.2);
        camera.fov = THREE.MathUtils.damp(camera.fov, 56 + speedRatio * 8, 4, dt);
        camera.updateProjectionMatrix();

        // Audio engine update
        audioService.updateEngineRpm(currentSpeedKmh, gasInput || isBoosted);

        // Telemetry throttle (~10Hz) to update React HUD without 60Hz re-renders
        telemetryThrottle += dt;
        if (telemetryThrottle > 0.09) {
          telemetryThrottle = 0;
          const gear = currentSpeedKmh < 1 ? 1 : Math.min(6, Math.floor(currentSpeedKmh / 38) + 1);
          currentProps.onUpdateTelemetry(
            Math.round(currentSpeedKmh),
            Math.round(distanceTraveled),
            Math.round(trackData.totalLength),
            gear
          );
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        // Software WebGL pacing helper from threejs skill
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            animId = window.setTimeout(poll, 6);
          } else {
            gl.deleteSync(sync);
            animId = window.setTimeout(() => tick(performance.now()), 60);
          }
        };
        animId = window.setTimeout(poll, 6);
      } else {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      if (isSoftwareGl) {
        clearTimeout(animId);
      } else {
        cancelAnimationFrame(animId);
      }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);

      audioService.stopEngine();
      trackData.dispose();
      carRig.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [levelConfig.id, carConfig.id]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" data-testid="racing-canvas-mount" />;
};
