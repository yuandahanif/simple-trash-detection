import { forwardRef, useRef } from "react";
import Webcam from "react-webcam";

const videoWidth = 500;
const videoHeight = 500;
const videoConstraints = {
  height: videoWidth,
  width: videoHeight,
  facingMode: "environment",
};

const CustomWebcam = forwardRef<Webcam>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <div
      className={`relative bg-white`}
      style={{ width: videoWidth, height: videoHeight }}
    >
      <Webcam
        audio={false}
        id="webcam"
        className={`absolute w-[${videoWidth}px] h-[${videoHeight}px]`}
        ref={ref}
        screenshotQuality={1}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        mirrored
      />

      <canvas
        id="webcam-canvas"
        ref={canvasRef}
        className="absolute"
        width={videoWidth}
        height={videoHeight}
      />
    </div>
  );
});

export default CustomWebcam;
