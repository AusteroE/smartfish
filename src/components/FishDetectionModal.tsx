'use client';

import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

interface FishDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectionInfo {
  length: number | null;
  width: number | null;
  category: string | null;
  confidence: number | null;
}

interface FullDetectionInfo {
  length: number;
  width: number;
  category: string;
  confidence: number;
  x: number;
  y: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface ServerStatus {
  server: 'online' | 'offline' | 'checking';
  camera: 'ready' | 'unknown' | 'not_initialized';
  model: 'loaded' | 'unknown' | 'not_loaded';
  fps: string;
}

export default function FishDetectionModal({ isOpen, onClose }: FishDetectionModalProps) {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    server: 'checking',
    camera: 'not_initialized',
    model: 'not_loaded',
    fps: '--',
  });
  const [detectionActive, setDetectionActive] = useState(false);
  const [detectionInfo, setDetectionInfo] = useState<DetectionInfo>({
    length: null,
    width: null,
    category: null,
    confidence: null,
  });
  const [allDetections, setAllDetections] = useState<FullDetectionInfo[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<tf.GraphModel | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fpsCounterRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: Date.now() });
  const isRunningRef = useRef(false); // Track if loop is actually running
  const previousFrameRef = useRef<ImageData | null>(null); // For motion detection
  const detectionHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([]); // Track detection positions

  // Initialize TensorFlow.js and load model
  useEffect(() => {
    if (isOpen) {
      initializeModel();
    } else {
      stopDetection();
      cleanup();
    }
    return () => {
      stopDetection();
      cleanup();
    };
  }, [isOpen]);

  const initializeModel = async () => {
    try {
      setServerStatus(prev => ({ ...prev, model: 'not_loaded', server: 'checking' }));
      await tf.setBackend('webgl');
      await tf.ready();
      setServerStatus(prev => ({ ...prev, model: 'loaded', server: 'online' }));
      setErrorMessage(null);
    } catch (error) {
      console.error('Model initialization error:', error);
      setServerStatus(prev => ({ ...prev, model: 'not_loaded', server: 'offline' }));
      setErrorMessage('Failed to initialize detection model. Please refresh the page.');
    }
  };

  const startDetection = async () => {
    try {
      setErrorMessage(null);
      setServerStatus(prev => ({ ...prev, camera: 'not_initialized' }));

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Try different camera constraints
      let stream: MediaStream | null = null;
      const constraints = [
        { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } },
        { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' } },
        { video: { facingMode: 'environment' } },
        { video: true }
      ];

      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          if (constraint === constraints[constraints.length - 1]) throw err;
          continue;
        }
      }

      if (!stream) {
        throw new Error('Failed to access camera');
      }

      // Wait for video element
      let retries = 0;
      while (!videoRef.current && retries < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }

      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element not available');
      }

      const video = videoRef.current;

      // Attach stream
      video.srcObject = stream;
      streamRef.current = stream;

      // Set video element styles for proper rendering
      video.style.cssText = `
        position: absolute;
        opacity: 0.01;
        pointer-events: none;
        width: 640px;
        height: 480px;
        top: 0;
        left: 0;
        z-index: -1;
        object-fit: cover;
      `;

      // Wait for video to be ready and playing
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanupListeners();
          reject(new Error('Timeout waiting for video'));
        }, 10000);

        const cleanupListeners = () => {
          clearTimeout(timeout);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('playing', onPlaying);
          video.removeEventListener('error', onError);
        };

        const onLoadedMetadata = () => {
          console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
        };

        const onPlaying = () => {
          console.log('Video is playing');
          if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
            cleanupListeners();
            resolve();
          }
        };

        const onError = (e: Event) => {
          console.error('Video error:', e);
          cleanupListeners();
          reject(new Error('Video failed to load'));
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('error', onError);

        video.play()
          .then(() => {
            setTimeout(() => {
              if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
                cleanupListeners();
                resolve();
              }
            }, 500);
          })
          .catch((err) => {
            cleanupListeners();
            reject(err);
          });
      });

      // Set states AFTER video is confirmed playing
      setServerStatus(prev => ({ ...prev, camera: 'ready' }));
      setDetectionActive(true);
      setErrorMessage(null);

      // Ensure canvas is visible
      if (canvasRef.current) {
        canvasRef.current.style.display = 'block';
        canvasRef.current.style.visibility = 'visible';
        canvasRef.current.style.opacity = '1';
      }

      // Start detection loop with a small delay
      setTimeout(() => {
        console.log('Starting detection loop, detectionActive:', detectionActive);
        startDetectionLoop();
      }, 300);
    } catch (error: any) {
      console.error('Camera access error:', error);
      let errorMsg = 'Failed to access camera. ';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg += 'Please grant camera permissions.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg += 'No camera found.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg += 'Camera is already in use.';
      } else {
        errorMsg += error.message || 'Please check your camera.';
      }
      setErrorMessage(errorMsg);
      setServerStatus(prev => ({ ...prev, camera: 'not_initialized' }));

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopDetection = () => {
    console.log('Stopping detection...');
    isRunningRef.current = false;
    setDetectionActive(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset previous frame for motion detection
    previousFrameRef.current = null;
    // Clear detection history
    detectionHistoryRef.current = [];
  };

  const cleanup = () => {
    stopDetection();
    if (modelRef.current) {
      modelRef.current.dispose();
      modelRef.current = null;
    }
  };

  const classifyFishSize = (length: number, width: number): string => {
    if (length <= 5 && width <= 2) return 'Small';
    if (length <= 10 && width <= 4) return 'Medium';
    return 'Large';
  };

  // Enhanced fish detection with multiple validation layers
  const detectFishInFrame = (imageData: ImageData, width: number, height: number): BoundingBox[] => {
    const data = imageData.data;
    const detections: BoundingBox[] = [];
    const grayData = new Uint8Array(width * height);
    const edgeData = new Uint8Array(width * height);

    // Convert to grayscale and analyze colors
    const colorData = new Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.floor((r + g + b) / 3);
      grayData[idx] = gray;
      colorData[idx] = { r, g, b, gray };
    }

    // Enhanced edge detection using Sobel operator with adaptive threshold
    let edgeMagnitudes: number[] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const gx = -grayData[(y - 1) * width + (x - 1)] + grayData[(y - 1) * width + (x + 1)]
          - 2 * grayData[y * width + (x - 1)] + 2 * grayData[y * width + (x + 1)]
          - grayData[(y + 1) * width + (x - 1)] + grayData[(y + 1) * width + (x + 1)];
        const gy = -grayData[(y - 1) * width + (x - 1)] - 2 * grayData[(y - 1) * width + x] - grayData[(y - 1) * width + (x + 1)]
          + grayData[(y + 1) * width + (x - 1)] + 2 * grayData[(y + 1) * width + x] + grayData[(y + 1) * width + (x + 1)];
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeMagnitudes.push(magnitude);
        edgeData[idx] = magnitude > 40 ? 255 : 0; // Higher threshold to reduce noise
      }
    }

    // Find connected components with fish-like characteristics
    const visited = new Set<number>();
    const minArea = 2000; // Increased minimum area
    const maxArea = width * height * 0.25; // Reduced max area

    for (let y = 3; y < height - 3; y += 4) {
      for (let x = 3; x < width - 3; x += 4) {
        const idx = y * width + x;
        if (edgeData[idx] > 0 && !visited.has(idx)) {
          const box = findConnectedComponent(edgeData, x, y, width, height, visited);
          if (box) {
            const area = box.width * box.height;
            const aspectRatio = box.width / box.height;

            // Basic size and aspect ratio filters
            if (area >= minArea && area <= maxArea && aspectRatio >= 1.5 && aspectRatio <= 5.5) {
              // Analyze the region for fish-like characteristics
              const fishScore = analyzeFishCharacteristics(
                colorData,
                box,
                width,
                height,
                aspectRatio,
                area,
                previousFrameRef.current
              );

              // Additional check: Reject detections in same location repeatedly (static objects)
              const now = Date.now();
              const recentDetections = detectionHistoryRef.current.filter(
                d => Math.abs(d.x - box.x) < 50 && Math.abs(d.y - box.y) < 50 && (now - d.time) < 2000
              );

              // If same location detected multiple times quickly, it's likely static (pattern/background)
              // Skip this detection - don't add it
              if (recentDetections.length <= 3) {
                // Only accept detections with sufficient fish-like characteristics
                // EXTREMELY STRICT threshold to 0.90 for fish-only detection (reject false positives)
                if (fishScore > 0.90) {
                  // Record this detection location
                  detectionHistoryRef.current.push({ x: box.x, y: box.y, time: now });
                  // Keep only last 10 detections
                  if (detectionHistoryRef.current.length > 10) {
                    detectionHistoryRef.current.shift();
                  }
                  detections.push({ ...box, confidence: Math.min(fishScore, 0.95) });
                }
              }
            }
          }
        }
      }
    }

    // Return all detections sorted by confidence (not just the best one)
    // Filter out overlapping detections (keep the one with higher confidence)
    const sortedDetections = detections.sort((a, b) => b.confidence - a.confidence);
    const filteredDetections: BoundingBox[] = [];

    for (const detection of sortedDetections) {
      let isOverlapping = false;
      for (const existing of filteredDetections) {
        // Check if bounding boxes overlap significantly (>30% overlap)
        const overlapX = Math.max(0, Math.min(detection.x + detection.width, existing.x + existing.width) - Math.max(detection.x, existing.x));
        const overlapY = Math.max(0, Math.min(detection.y + detection.height, existing.y + existing.height) - Math.max(detection.y, existing.y));
        const overlapArea = overlapX * overlapY;
        const detectionArea = detection.width * detection.height;
        const existingArea = existing.width * existing.height;
        const minArea = Math.min(detectionArea, existingArea);

        if (overlapArea / minArea > 0.3) {
          isOverlapping = true;
          break;
        }
      }

      if (!isOverlapping) {
        filteredDetections.push(detection);
        // Limit to maximum 6 detections for performance
        if (filteredDetections.length >= 6) break;
      }
    }

    return filteredDetections;
  };

  const findConnectedComponent = (
    edgeData: Uint8Array,
    startX: number,
    startY: number,
    width: number,
    height: number,
    visited: Set<number>
  ): BoundingBox | null => {
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    const queue: [number, number][] = [[startX, startY]];
    visited.add(startY * width + startX);

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          const nIdx = ny * width + nx;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
            !visited.has(nIdx) && edgeData[nIdx] > 0) {
            visited.add(nIdx);
            queue.push([nx, ny]);
          }
        }
      }
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, confidence: 0.8 };
  };

  // Multi-factor analysis to identify fish-like objects - FISH-ONLY MODE
  const analyzeFishCharacteristics = (
    colorData: Array<{ r: number; g: number; b: number; gray: number }>,
    box: BoundingBox,
    width: number,
    height: number,
    aspectRatio: number,
    area: number,
    previousFrame: ImageData | null
  ): number => {
    let score = 0.0;
    let fishColorPixels = 0;

    // Sample pixels within the bounding box (more dense sampling for better analysis)
    const sampleStep = Math.max(1, Math.floor(Math.min(box.width, box.height) / 25));
    const samples: Array<{ r: number; g: number; b: number; x: number; y: number; gray: number }> = [];

    for (let y = box.y; y < box.y + box.height && y < height; y += sampleStep) {
      for (let x = box.x; x < box.x + box.width && x < width; x += sampleStep) {
        const idx = y * width + x;
        if (idx >= 0 && idx < colorData.length) {
          samples.push({ ...colorData[idx], x, y });
        }
      }
    }

    if (samples.length === 0) return 0;

    // FISH-SPECIFIC VALIDATION: Check torpedo/elliptical shape (wider in middle, tapering at ends)
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    let centerDensity = 0;
    let edgeDensity = 0;
    const centerRadius = Math.min(box.width, box.height) * 0.3;

    for (const pixel of samples) {
      const distFromCenter = Math.sqrt(
        Math.pow(pixel.x - centerX, 2) + Math.pow(pixel.y - centerY, 2)
      );
      if (distFromCenter < centerRadius) {
        centerDensity++;
      } else {
        edgeDensity++;
      }
    }

    // Fish should have higher density in center (body) than edges
    const densityRatio = centerDensity / Math.max(1, edgeDensity);
    const shapeScore = densityRatio > 0.6 ? 1.0 : densityRatio > 0.4 ? 0.6 : 0.2;
    score += shapeScore * 0.15; // 15% weight for body shape

    // 1. Color analysis: Fish typically have blues, grays, silvers, or browns
    // VERY STRICT: Reject patterns, walls, and non-fish objects aggressively
    let uniformColorCount = 0;
    let brightColorCount = 0;
    let totalSaturation = 0;

    for (const pixel of samples) {
      const { r, g, b } = pixel;
      const maxColor = Math.max(r, g, b);
      const minColor = Math.min(r, g, b);
      const saturation = maxColor === 0 ? 0 : (maxColor - minColor) / maxColor;
      const brightness = (r + g + b) / 3;
      totalSaturation += saturation;

      // Check for uniform colors (patterns/backgrounds are often very uniform)
      const colorRange = maxColor - minColor;
      if (colorRange < 20) {
        uniformColorCount++;
      }

      // REJECT bright/vibrant colors (patterns, decorative objects)
      if (brightness > 200 || saturation > 0.5) {
        brightColorCount++;
      }

      // Fish colors: VERY strict - only accept aquatic colors
      // Tilapia: typically gray/silver with low saturation
      const isFishColor =
        (saturation < 0.20 && brightness > 50 && brightness < 170) || // Gray/silver (very strict)
        (b > r + 30 && b > g + 20 && saturation < 0.35 && brightness < 180) || // Blue tones (stricter)
        (g > r + 25 && g > b + 20 && saturation < 0.30 && brightness < 170) || // Green-gray (stricter)
        (r > 100 && g > 90 && b > 80 && r < 160 && g < 150 && b < 140 && saturation < 0.25); // Brown tones (very strict)

      if (isFishColor) fishColorPixels++;
    }

    const colorScore = fishColorPixels / samples.length;
    const uniformityRatio = uniformColorCount / samples.length;
    const brightRatio = brightColorCount / samples.length;
    const avgSaturation = totalSaturation / samples.length;

    // HEAVILY penalize uniform regions, bright colors, and high saturation
    let adjustedColorScore = colorScore;
    if (uniformityRatio > 0.5) {
      adjustedColorScore *= 0.3; // Heavily penalize uniform regions
    } else if (uniformityRatio > 0.35) {
      adjustedColorScore *= 0.5; // Strong penalty
    }

    if (brightRatio > 0.2) {
      adjustedColorScore *= 0.4; // Reject bright/vibrant objects
    }

    if (avgSaturation > 0.3) {
      adjustedColorScore *= 0.5; // Reject high saturation (patterns/decorations)
    }

    // Require at least 60% fish-colored pixels
    if (colorScore < 0.6) {
      adjustedColorScore *= 0.5; // Penalize if not enough fish colors
    }

    score += adjustedColorScore * 0.25; // 25% weight (reduced, motion and shape more important)

    // 2. Aspect ratio validation (fish are typically 2.5-4:1 length to width)
    // VERY STRICT: Fish have specific elongated body shape
    let aspectScore = 0;
    if (aspectRatio >= 2.5 && aspectRatio <= 4.0) {
      aspectScore = 1.0; // Ideal fish body ratio
    } else if (aspectRatio >= 2.2 && aspectRatio < 2.5) {
      aspectScore = 0.7; // Slightly short but acceptable
    } else if (aspectRatio > 4.0 && aspectRatio <= 4.5) {
      aspectScore = 0.7; // Slightly long but acceptable
    } else if (aspectRatio >= 2.0 && aspectRatio < 2.2) {
      aspectScore = 0.4; // Too short - suspicious
    } else if (aspectRatio > 4.5 && aspectRatio <= 5.0) {
      aspectScore = 0.4; // Too long - suspicious
    } else {
      aspectScore = 0.0; // Outside fish range - REJECT
    }
    score += aspectScore * 0.20; // 20% weight

    // 3. Size validation (fish size range - not too small, not too large)
    let sizeScore = 0;
    const minDimension = Math.min(box.width, box.height);
    const maxDimension = Math.max(box.width, box.height);

    // Fish must have reasonable dimensions (not too thin, not too wide)
    if (area >= 4000 && area <= 35000 && minDimension >= 40 && maxDimension <= 300) {
      sizeScore = 1.0; // Ideal fish size
    } else if (area >= 3000 && area < 4000 && minDimension >= 35) {
      sizeScore = 0.7; // Small but acceptable
    } else if (area > 35000 && area <= 50000 && maxDimension <= 350) {
      sizeScore = 0.7; // Large but acceptable
    } else if (minDimension < 30) {
      sizeScore = 0.1; // Too small - likely noise
    } else {
      sizeScore = 0.3; // Outside acceptable range
    }
    score += sizeScore * 0.10; // 10% weight

    // 4. Edge continuity analysis (fish have smooth, continuous edges - not jagged like patterns)
    // Analyze edge smoothness by checking gradient consistency
    let edgeConsistency = 0;
    let edgeSampleCount = 0;
    const edgeSamples: number[] = [];

    // Sample edges of the bounding box
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const edgeX = box.x + box.width * t;
      const edgeY = box.y + box.height * t;

      if (edgeX >= 0 && edgeX < width && edgeY >= 0 && edgeY < height) {
        const idx = Math.floor(edgeY) * width + Math.floor(edgeX);
        if (idx >= 0 && idx < colorData.length) {
          edgeSamples.push(colorData[idx].gray);
          edgeSampleCount++;
        }
      }
    }

    // Check edge consistency (fish edges are smoother than patterns)
    if (edgeSampleCount > 5) {
      let variance = 0;
      const mean = edgeSamples.reduce((a, b) => a + b, 0) / edgeSamples.length;
      for (const val of edgeSamples) {
        variance += Math.pow(val - mean, 2);
      }
      variance /= edgeSamples.length;

      // Fish have moderate edge variance (not too uniform, not too chaotic)
      if (variance > 200 && variance < 2000) {
        edgeConsistency = 1.0; // Good edge smoothness
      } else if (variance > 100 && variance < 3000) {
        edgeConsistency = 0.6; // Acceptable
      } else {
        edgeConsistency = 0.2; // Too uniform or too chaotic - likely not a fish
      }
    }

    score += edgeConsistency * 0.10; // 10% weight

    // 5. Motion detection (fish move, static objects don't) - CRITICAL FILTER
    let motionScore = 0.0; // Default: NO motion = reject (much stricter)
    if (previousFrame && previousFrame.width === width && previousFrame.height === height) {
      let motionPixels = 0;
      const motionThreshold = 25; // Lower threshold to catch subtle motion
      let totalSampled = 0;

      // Sample motion in the bounding box region (more aggressive sampling)
      const motionStep = Math.max(1, Math.floor(sampleStep / 2)); // Sample more densely
      for (let y = box.y; y < box.y + box.height && y < height; y += motionStep) {
        for (let x = box.x; x < box.x + box.width && x < width; x += motionStep) {
          const idx = (y * width + x) * 4;
          const prevIdx = (y * previousFrame.width + x) * 4;

          if (idx < previousFrame.data.length && prevIdx < previousFrame.data.length) {
            totalSampled++;
            const currGray = (colorData[y * width + x]?.gray || 0);
            const prevGray = Math.floor(
              (previousFrame.data[prevIdx] +
                previousFrame.data[prevIdx + 1] +
                previousFrame.data[prevIdx + 2]) / 3
            );

            const diff = Math.abs(currGray - prevGray);
            if (diff > motionThreshold) {
              motionPixels++;
            }
          }
        }
      }

      if (totalSampled > 0) {
        const motionRatio = motionPixels / totalSampled;
        // EXTREMELY STRICT: Require strong consistent motion (fish MUST move)
        // Patterns/static objects show NO motion, fish show strong consistent motion
        if (motionRatio > 0.35 && motionRatio < 0.60) {
          motionScore = 1.0; // Strong consistent motion (definitely fish-like)
        } else if (motionRatio > 0.25 && motionRatio < 0.70) {
          motionScore = 0.7; // Good motion (likely fish)
        } else if (motionRatio > 0.18) {
          motionScore = 0.4; // Moderate motion - suspicious, needs other strong indicators
        } else if (motionRatio > 0.10) {
          motionScore = 0.1; // Weak motion - likely static object
        } else {
          motionScore = 0.0; // NO motion - DEFINITELY REJECT (static objects like patterns/walls)
        }
      } else {
        motionScore = 0.0; // Can't determine motion - reject
      }
    } else {
      // No previous frame available - be conservative
      motionScore = 0.3; // Lower score when we can't check motion
    }
    score += motionScore * 0.30; // Increased weight to 30% - motion is CRITICAL for fish detection

    // FINAL VALIDATION: Require motion for fish (fish MUST move)
    // If no motion detected, heavily penalize (even if other factors pass)
    if (motionScore < 0.3) {
      score *= 0.5; // Cut score in half if motion is too weak
    }

    return Math.min(score, 0.95);
  };

  const calculateConfidence = (box: BoundingBox, aspectRatio: number): number => {
    // This function is no longer used but kept for compatibility
    return 0.8;
  };

  const startDetectionLoop = () => {
    console.log('startDetectionLoop called, isRunningRef:', isRunningRef.current);

    if (isRunningRef.current) {
      console.log('Loop already running, cancelling previous');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    isRunningRef.current = true;

    const detect = () => {
      // Use ref to check state instead of closure variable
      if (!isRunningRef.current || !videoRef.current || !canvasRef.current) {
        console.log('Stopping loop - isRunning:', isRunningRef.current, 'video:', !!videoRef.current, 'canvas:', !!canvasRef.current);
        isRunningRef.current = false;
        animationFrameRef.current = null;
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Ensure canvas is visible
      if (canvas.style.display === 'none') {
        canvas.style.display = 'block';
      }

      // Check video state
      if (video.readyState >= video.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
        // Set canvas dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log('Canvas dimensions set:', video.videoWidth, 'x', video.videoHeight);
        }

        // Draw video frame
        try {
          // Clear canvas before drawing new frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Update FPS
          fpsCounterRef.current.count++;
          const now = Date.now();
          if (now - fpsCounterRef.current.lastTime >= 1000) {
            setServerStatus(prev => ({ ...prev, fps: fpsCounterRef.current.count.toString() }));
            fpsCounterRef.current.count = 0;
            fpsCounterRef.current.lastTime = now;
          }

          // Run detection
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const detections = detectFishInFrame(imageData, canvas.width, canvas.height);

          // Store current frame for motion detection in next iteration
          previousFrameRef.current = imageData;

          // Draw bounding boxes for ALL detections
          const pixelToCmRatio = 0.08;
          const fullDetections: FullDetectionInfo[] = [];

          if (detections.length > 0) {
            // Colors for different detections
            const colors = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff8800', '#00ff88'];

            detections.forEach((detection, index) => {
              const color = colors[index % colors.length];

              // Draw bounding box
              ctx.strokeStyle = color;
              ctx.lineWidth = 3;
              ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

              // Draw label background
              const label = `Fish ${index + 1} ${(detection.confidence * 100).toFixed(1)}%`;
              ctx.fillStyle = color;
              ctx.font = 'bold 14px Arial';
              const textMetrics = ctx.measureText(label);
              const labelHeight = 18;
              ctx.fillRect(detection.x, detection.y - labelHeight - 2, textMetrics.width + 4, labelHeight);

              // Draw label text
              ctx.fillStyle = '#000000';
              ctx.fillText(label, detection.x + 2, detection.y - 4);

              // Calculate measurements
              const length = Math.max(detection.width, detection.height) * pixelToCmRatio;
              const width = Math.min(detection.width, detection.height) * pixelToCmRatio;
              const category = classifyFishSize(length, width);
              const confidence = detection.confidence * 100;

              fullDetections.push({
                length: parseFloat(length.toFixed(2)),
                width: parseFloat(width.toFixed(2)),
                category,
                confidence: parseFloat(confidence.toFixed(1)),
                x: detection.x,
                y: detection.y,
              });
            });

            // Update state with all detections
            setAllDetections(fullDetections);

            // Show the best detection (highest confidence) in the main display
            const best = detections[0];
            const bestLength = Math.max(best.width, best.height) * pixelToCmRatio;
            const bestWidth = Math.min(best.width, best.height) * pixelToCmRatio;
            const bestCategory = classifyFishSize(bestLength, bestWidth);
            const bestConfidence = best.confidence * 100;

            setDetectionInfo({
              length: parseFloat(bestLength.toFixed(2)),
              width: parseFloat(bestWidth.toFixed(2)),
              category: bestCategory,
              confidence: parseFloat(bestConfidence.toFixed(1)),
            });

            // Save all detections to database
            fullDetections.forEach((det) => {
              fetch('/api/fish-detection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  length: det.length.toFixed(2),
                  width: det.width.toFixed(2),
                  category: det.category,
                  confidence: det.confidence.toFixed(1),
                }),
              }).catch(err => console.error('Save error:', err));
            });

            if (soundEnabled && detections.length > 0) {
              playNotificationSound();
            }
          } else {
            setDetectionInfo({ length: null, width: null, category: null, confidence: null });
            setAllDetections([]);
          }
        } catch (error) {
          console.error('Draw error:', error);
        }
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    // Start immediately
    animationFrameRef.current = requestAnimationFrame(detect);
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('camera-feed-container');
    if (!fullscreen && container?.requestFullscreen) {
      container.requestFullscreen();
      setFullscreen(true);
    } else if (fullscreen && document.exitFullscreen) {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleViewHistory = () => {
    window.location.href = '/dashboard/fish-detection-history';
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center"
        onClick={onClose}
      ></div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[900px] w-[95%] max-h-[90vh] p-6 bg-gradient-to-b from-white/8 to-white/3 border border-white/14 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] z-[9999] overflow-y-auto overflow-x-hidden text-[#e6e9ef] md:max-h-[92vh] md:p-5">
        <button
          className="absolute top-4 right-4 bg-white/10 border-none text-[#e6e9ef] text-[28px] w-10 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center hover:bg-white/20"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        <h2 className="mt-0 mb-5 text-[28px] text-center text-[#e6e9ef]">
          <i className="fas fa-fish text-blue-500 mr-2.5"></i> Fish Size Detection
        </h2>

        <div className="grid grid-cols-4 gap-2.5 mb-6 p-4 bg-black/30 rounded-[10px] border border-white/10">
          <div className="flex items-center gap-2 text-[13px]">
            <i className="fas fa-server text-base text-[#888]"></i>
            <span className="text-[#e6e9ef]">
              Server:{' '}
              <span className={`font-semibold ${serverStatus.server === 'online' ? 'text-green-500' : serverStatus.server === 'offline' ? 'text-red-500' : 'text-yellow-400'}`}>
                {serverStatus.server === 'online' ? 'Online' : serverStatus.server === 'offline' ? 'Offline' : 'Checking...'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <i className="fas fa-video text-base text-[#888]"></i>
            <span className="text-[#e6e9ef]">
              Camera:{' '}
              <span className={`font-semibold ${serverStatus.camera === 'ready' ? 'text-green-500' : serverStatus.camera === 'unknown' ? 'text-red-500' : 'text-yellow-400'}`}>
                {serverStatus.camera === 'ready' ? 'Ready' : serverStatus.camera === 'unknown' ? 'Unknown' : 'Not initialized'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <i className="fas fa-brain text-base text-[#888]"></i>
            <span className="text-[#e6e9ef]">
              Model:{' '}
              <span className={`font-semibold ${serverStatus.model === 'loaded' ? 'text-green-500' : serverStatus.model === 'unknown' ? 'text-red-500' : 'text-yellow-400'}`}>
                {serverStatus.model === 'loaded' ? 'Loaded (TensorFlow.js)' : serverStatus.model === 'unknown' ? 'Unknown' : 'Not loaded'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <i className="fas fa-tachometer-alt text-base text-[#888]"></i>
            <span className="text-[#e6e9ef]">
              FPS: <span className="font-semibold text-yellow-400">{serverStatus.fps}</span>
            </span>
          </div>
        </div>

        <div className="mb-5 text-center">
          <button
            className={`px-[50px] py-[18px] text-xl font-bold border-none rounded-xl cursor-pointer transition-all duration-300 uppercase tracking-wider text-white ${detectionActive
              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_15px_rgba(239,68,68,0.3)]'
              : 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_4px_15px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)]'
              } ${serverStatus.model !== 'loaded' ? 'opacity-60 cursor-not-allowed shadow-none' : ''}`}
            onClick={detectionActive ? stopDetection : startDetection}
            disabled={serverStatus.model !== 'loaded'}
          >
            <i className={`fas ${detectionActive ? 'fa-stop' : 'fa-play'} mr-2`}></i>
            {detectionActive ? 'STOP DETECTION' : 'START DETECTION'}
          </button>
        </div>

        <div className="flex gap-2 justify-center flex-wrap mb-6">
          <button
            className="px-[18px] py-2.5 text-sm font-semibold border-2 border-blue-500/50 rounded-lg cursor-pointer transition-all duration-300 bg-white/5 text-blue-500 backdrop-blur-sm hover:bg-blue-500/10 hover:border-blue-500 hover:-translate-y-0.5"
            onClick={handleViewHistory}
          >
            <i className="fas fa-history mr-1.5"></i> History
          </button>
          <button
            className="px-[18px] py-2.5 text-sm font-semibold border-2 border-green-500/50 rounded-lg cursor-pointer transition-all duration-300 bg-white/5 text-green-500 backdrop-blur-sm hover:bg-green-500/10 hover:border-green-500 hover:-translate-y-0.5"
            onClick={toggleFullscreen}
          >
            <i className={`fas ${fullscreen ? 'fa-compress' : 'fa-expand'} mr-1.5`}></i> Fullscreen
          </button>
          <button
            className="px-[18px] py-2.5 text-sm font-semibold border-2 border-gray-400/50 rounded-lg cursor-pointer transition-all duration-300 bg-white/5 text-gray-400 backdrop-blur-sm hover:bg-gray-400/10 hover:border-gray-400 hover:-translate-y-0.5"
            onClick={toggleSound}
          >
            <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'} mr-1.5`}></i> Sound
          </button>
        </div>

        {errorMessage && (
          <div className="text-center mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-[15px] font-semibold">
            <span className="text-lg mr-2">⚠️</span>
            <span className="text-red-500">{errorMessage}</span>
          </div>
        )}

        <div id="camera-feed-container" className="mb-6">
          <div className="relative bg-black rounded-xl overflow-hidden min-h-[350px] max-h-[450px] flex items-center justify-center border-2 border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute opacity-0 pointer-events-none w-[640px] h-[480px] top-0 left-0 -z-10"
              style={{ display: 'block' }}
            />
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[450px] object-contain bg-black block relative z-10"
              style={{
                imageRendering: 'auto',
                display: detectionActive ? 'block' : 'none'
              }}
            />
            {!detectionActive && (
              <div className="text-[#888] text-center p-10">
                <i className="fas fa-video-slash text-[64px] mb-5 text-[#555]"></i>
                <p className="text-lg mb-2.5">Click &quot;Start Detection&quot; to begin</p>
                <small className="text-[13px] text-[#666]">Camera access will be requested</small>
              </div>
            )}
          </div>
        </div>

        <div className="mb-5 p-5 bg-black/30 rounded-xl border border-white/10">
          <h4 className="m-0 mb-4 text-lg text-[#e6e9ef] flex items-center gap-2">
            <i className="fas fa-chart-line text-blue-500"></i> Latest Detection
            {allDetections.length > 0 && (
              <span className="ml-2 text-sm text-yellow-400 font-semibold">
                ({allDetections.length} {allDetections.length === 1 ? 'fish' : 'fish detected'})
              </span>
            )}
          </h4>

          {/* Show all detections if multiple */}
          {allDetections.length > 1 && (
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-xs text-[#888] mb-2 font-semibold uppercase tracking-wider">All Detections:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allDetections.map((det, idx) => (
                  <div key={idx} className="p-2 bg-white/3 rounded border border-white/5 text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ['#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff8800', '#00ff88'][idx % 6] }}
                      ></div>
                      <span className="font-semibold text-[#e6e9ef]">Fish {idx + 1}</span>
                    </div>
                    <div className="text-[#888]">
                      L: {det.length}cm × W: {det.width}cm
                    </div>
                    <div className="text-[#888]">
                      {det.category} ({det.confidence}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/3 rounded-lg border border-white/5">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-500/10 rounded-lg text-lg text-blue-500">
                <i className="fas fa-ruler-horizontal"></i>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[11px] uppercase text-[#888] font-semibold tracking-wider">Length</span>
                <span className="text-xl font-bold text-[#e6e9ef]">{detectionInfo.length?.toFixed(2) || '--'}</span>
                <span className="text-xs text-[#888] ml-0.5">cm</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/3 rounded-lg border border-white/5">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-500/10 rounded-lg text-lg text-blue-500">
                <i className="fas fa-ruler-vertical"></i>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[11px] uppercase text-[#888] font-semibold tracking-wider">Width</span>
                <span className="text-xl font-bold text-[#e6e9ef]">{detectionInfo.width?.toFixed(2) || '--'}</span>
                <span className="text-xs text-[#888] ml-0.5">cm</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/3 rounded-lg border border-white/5">
              <div className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg ${detectionInfo.category?.toLowerCase() === 'small' ? 'bg-green-500/10 text-green-500' :
                detectionInfo.category?.toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                  detectionInfo.category?.toLowerCase() === 'large' ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                }`}>
                <i className="fas fa-fish"></i>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[11px] uppercase text-[#888] font-semibold tracking-wider">Category</span>
                <span className={`inline-block px-3 py-1 rounded-[20px] text-sm font-semibold ${detectionInfo.category?.toLowerCase() === 'small' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                  detectionInfo.category?.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                    detectionInfo.category?.toLowerCase() === 'large' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                      'text-[#e6e9ef]'
                  }`}>
                  {detectionInfo.category || '--'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/3 rounded-lg border border-white/5">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-500/10 rounded-lg text-lg text-blue-500">
                <i className="fas fa-percentage"></i>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[11px] uppercase text-[#888] font-semibold tracking-wider">Confidence</span>
                <span className="text-xl font-bold text-[#e6e9ef]">{detectionInfo.confidence?.toFixed(1) || '--'}</span>
                <span className="text-xs text-[#888] ml-0.5">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
