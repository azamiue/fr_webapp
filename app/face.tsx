"use client";

import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";

export function FaceDetect() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState<boolean>(false);
  const [faceDirection, setFaceDirection] =
    useState<string>("No face detected");

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.NEXT_PUBLIC_PUBLIC_URL + "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      setIsModelsLoaded(true);
    };
    loadModels();
  }, []);

  // activate cam
  useEffect(() => {
    if (isModelsLoaded && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 300 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        });
    }
  }, [isModelsLoaded]);

  // Calculate face pose angles
  const calculateFacePose = (landmarks: any) => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Get center points
    const noseTop = nose[3]; // Middle of nose bridge
    const noseBottom = nose[6]; // Bottom of nose

    // Calculate eye centers
    const leftEyeCenter = {
      x:
        leftEye.reduce((sum: number, point: any) => sum + point.x, 0) /
        leftEye.length,
      y:
        leftEye.reduce((sum: number, point: any) => sum + point.y, 0) /
        leftEye.length,
    };
    const rightEyeCenter = {
      x:
        rightEye.reduce((sum: number, point: any) => sum + point.x, 0) /
        rightEye.length,
      y:
        rightEye.reduce((sum: number, point: any) => sum + point.y, 0) /
        rightEye.length,
    };

    // Calculate yaw (left-right)
    const eyeDistance = rightEyeCenter.x - leftEyeCenter.x;
    const noseCenterX = (noseTop.x + noseBottom.x) / 2;
    const eyesCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const yaw = ((noseCenterX - eyesCenterX) / eyeDistance) * 100;

    // Calculate pitch (up-down)
    const eyeLevel = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const noseHeight = noseBottom.y - noseTop.y;
    const pitch = ((noseBottom.y - eyeLevel) / noseHeight - 1.5) * 50;

    return { yaw, pitch };
  };

  // Determine face direction based on angles with moving average
  const previousDirections: string[] = [];
  const getFaceDirection = (pose: { yaw: number; pitch: number }) => {
    const { yaw, pitch } = pose;

    // Adjusted thresholds
    const yawThreshold = 12; // Threshold for left-right detection
    const pitchThreshold = 10; // Threshold for up-down detection

    // Check for the most prominent direction based on pitch
    if (Math.abs(pitch) > pitchThreshold) {
      if (pitch < 90 && yaw < 10) return "Up";
      if (pitch > 140 && yaw < 10) return "Down";
    }

    // Check for the most prominent direction based on yaw
    if (Math.abs(yaw) > yawThreshold) {
      if (yaw < 0) return "Right";
      if (yaw > 15) return "Left";
    }

    return "Straight"; // Default direction if no thresholds are met
  };

  // face detect && landmarks
  const handleVideoPlay = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        const context = canvas.getContext("2d");

        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (resizedDetections.length > 0) {
            // Draw face detections
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // Calculate pose and get direction
            const pose = calculateFacePose(resizedDetections[0].landmarks);
            const direction = getFaceDirection(pose);
            setFaceDirection(`Looking: ${direction}`);

            // Debug info (optional - remove in production)
            context.fillStyle = "white";
            context.font = "16px Arial";
            context.fillText(
              `Yaw: ${pose.yaw.toFixed(1)} Pitch: ${pose.pitch.toFixed(1)}`,
              10,
              20
            );
          } else {
            setFaceDirection("No face detected");
          }
        }
      }, 100);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoPlay}
        width="720"
        height="560"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        width="720"
        height="560"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "20px",
          borderRadius: "5px",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        {faceDirection}
      </div>
    </div>
  );
}
