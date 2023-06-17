import { useEffect, useState, useRef } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";

const videoWidth = 500;
const videoHeight = 500;
const videoConstraints = {
  height: videoWidth,
  width: videoHeight,
  facingMode: "environment",
};

function App() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection>();
  const webcamRef = useRef<Webcam>(null);
  const loopId = useRef<number | null>(null);

  async function loadModel() {
    try {
      const model = await cocoSsd.load();
      setModel(model);
      console.log("set loaded Model");
    } catch (err) {
      console.log(err);
      console.log("failed load model");
    }
  }

  async function predictionFunction() {
    //Clear the canvas for each prediction
    const cnvs = document.getElementById("myCanvas") as HTMLCanvasElement;
    const ctx = cnvs?.getContext("2d");

    if (webcamRef?.current == null) return;
    if (ctx == null) return;

    ctx?.clearRect(
      0,
      0,
      webcamRef.current.video?.videoWidth ?? 0,
      webcamRef.current.video?.videoHeight ?? 0
    );

    //Start prediction
    const predictions = await model?.detect(
      document.getElementById("img") as HTMLImageElement
    );

    if (predictions && predictions.length > 0) {
      console.log(predictions);

      for (let n = 0; n < predictions.length; n++) {
        if (predictions[n].score > 0.2) {
          //Threshold is 0.8 or 80%
          //Extracting the coordinate and the bounding box information
          const bboxLeft = predictions[n].bbox[0];
          const bboxTop = predictions[n].bbox[1];
          const bboxWidth = predictions[n].bbox[2];
          const bboxHeight = predictions[n].bbox[3] - bboxTop;

          //Drawing begin
          ctx.beginPath();
          ctx.font = "28px Arial";
          ctx.fillStyle = "red";
          ctx.fillText(
            predictions[n].class +
              ": " +
              Math.round(parseFloat(predictions[n].score.toString()) * 100) +
              "%",
            bboxLeft,
            bboxTop
          );
          ctx.rect(bboxLeft, bboxTop, bboxWidth, bboxHeight);
          ctx.strokeStyle = "#FF0000";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

    //Rerun prediction by timeout
    loopId.current = setTimeout(() => predictionFunction(), 500);
  }

  function predictionStop() {
    if (loopId.current) {
      clearInterval(loopId.current);
    }
  }

  useEffect(() => {
    tf.ready().then(() => {
      loadModel();
    });
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-red-300">
      <div
        className={`relative bg-red-100 w-[${videoWidth}px] h-[${videoHeight}px]`}
      >
        <Webcam
          audio={false}
          id="img"
          className={`w-[${videoWidth}px] h-[${videoHeight}px]`}
          ref={webcamRef}
          screenshotQuality={1}
          screenshotFormat="image/jpeg"
          width={videoWidth}
          height={videoHeight}
          videoConstraints={videoConstraints}
        />
        <canvas
          id="myCanvas"
          className="absolute top-0"
          width={videoWidth}
          height={videoHeight}
          style={{ backgroundColor: "transparent" }}
        />
      </div>

      <div className="">
        <button
          onClick={() => {
            predictionFunction();
          }}
        >
          Start Detect
        </button>

        <button
          onClick={() => {
            predictionStop();
          }}
        >
          Stop Detect
        </button>
      </div>
    </div>
  );
}

export default App;
