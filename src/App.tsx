import { useEffect, useState } from "react";
import useFfmpeg from "./useFfmpeg";
import { fetchFile, FFmpeg } from "@ffmpeg/ffmpeg";
import init, { quantise_video } from "../squish_wasm/pkg/squish_wasm";
import Spinner from "./Spinner";
import GithubLogo from "./assets/github-mark-white.svg";

type VideoPlayerProps = {
  src: string | undefined;
};

type QuantisationMethod = "intra" | "inter";

type ProcessingState =
  | "Inactive"
  | "Uploading"
  | "Decompressing"
  | "Quantising"
  | "Converting";

function VideoPlayer(props: VideoPlayerProps) {
  if (!props.src) {
    return null;
  }

  return <video className="w-full py-3" src={props.src} controls loop />;
}

type Video = {
  data: Uint8Array;
  name: string;
};

const quantise = async (
  inputVideo: Video,
  quantisationFactor: number,
  quantisationMethod: QuantisationMethod,
  ffmpeg: FFmpeg,
  setProcessingState: React.Dispatch<React.SetStateAction<ProcessingState>>
) => {
  if (inputVideo) {
    await init();
    // convert to y4m for processing
    // setProcessingState("Decompressing");
    setProcessingState("Quantising"); // since thread will be blocked during actual quantisation step
    
    ffmpeg.FS("writeFile", inputVideo.name, inputVideo.data);
    await ffmpeg.run("-i", inputVideo.name, "input.y4m");
    const rawData = ffmpeg.FS("readFile", "input.y4m");

    // process via wasm function
    setProcessingState("Quantising");
    const quantisedData = quantise_video(
      rawData,
      quantisationFactor,
      quantisationMethod == "inter"
    );

    // convert to mp4 for display
    setProcessingState("Converting");
    ffmpeg.FS("writeFile", "output.y4m", quantisedData);
    await ffmpeg.run("-i", "output.y4m", "output.mp4");
    const data = ffmpeg.FS("readFile", "output.mp4");

    return data;
  }
};

function App() {
  const { ffmpeg, isLoaded, errorMsg: ffmpegErrorMsg } = useFfmpeg();

  const [outputVideoSrc, setOutputVideoSrc] = useState<string>();
  const [inputVideo, setInputVideo] = useState<Video>();
  const [quantisationMethod, setQuantisationMethod] =
    useState<QuantisationMethod>("inter");
  const defaultQuantFactor = 40.0;
  const [quantisationFactor, setQuantisationFactor] =
    useState(defaultQuantFactor);
  const [temporaryQuantisationFactor, setTempQuantisationFactor] =
    useState(defaultQuantFactor);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("Inactive");
  const [quantiseErrorMessage, setQuantiseErrorMessage] = useState<string>();

  useEffect(() => {
    if (inputVideo) {
      quantise(
        inputVideo,
        quantisationFactor,
        quantisationMethod,
        ffmpeg,
        setProcessingState
      )
        .catch((e) => {
          setProcessingState("Inactive");
          alert(e)
          setQuantiseErrorMessage(e as string);
        })
        .then((quantisedVideoData) => {
          setQuantiseErrorMessage("");
          if (quantisedVideoData) {
            setOutputVideoSrc(
              URL.createObjectURL(
                new Blob([quantisedVideoData.buffer], { type: "video/mp4" })
              )
            );
          }
          setProcessingState("Inactive");
        });
    }
  }, [inputVideo, quantisationMethod, quantisationFactor]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const {
      target: { files },
    } = event;
    if (isLoaded() && files) {
      const { name } = files[0];
      setProcessingState("Uploading");
      const inputData = await fetchFile(files[0]);
      setInputVideo({ data: inputData, name });
    }
  };

  return (
    <div className="overflow-x-hidden bg-orange-600">
      <nav className="rounded bg-orange-600 px-2 py-2.5 sm:px-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between text-white px-2">
          <h1 className="text-3xl font-bold">Quantiser</h1>
          <div className="w-auto" id="navbar-default">
            <a
              href="https://github.com/owenbrooks/quantiser-web"
              className="flex items-center"
            >
              <img src={GithubLogo} className="h-9" alt="Github Logo" />
              {/* <span className="hidden md:block whitespace-nowrape self-center text-xl font-semibold">
                Github
              </span> */}
            </a>
          </div>
        </div>
      </nav>
      <div className="main-container">
        <div className="mx-auto max-w-xl py-4 px-2">
          {ffmpegErrorMsg && <ErrorMessage message={ffmpegErrorMsg} />}
          <div className="mb-2">
            <label
              className="mb-1 block pr-4 text-xl font-bold"
              htmlFor="method"
            >
              Method
            </label>
            <label className="mx-1 block font-bold">
              <input
                className="mr-2 leading-tight"
                type="radio"
                name="method"
                value="intra"
                checked={quantisationMethod == "intra"}
                onChange={(e) =>
                  setQuantisationMethod(e.target.value as QuantisationMethod)
                }
              />
              <span className="text-lg">Intra-frame DCT</span>
            </label>
            <label className="mx-1 block font-bold">
              <input
                className="mr-2 leading-tight"
                type="radio"
                name="method"
                value="inter"
                checked={quantisationMethod == "inter"}
                onChange={(e) =>
                  setQuantisationMethod(e.target.value as QuantisationMethod)
                }
              />
              <span className="text-lg">Inter-frame DCT</span>
            </label>
          </div>
          <div className="mb-2">
            <label
              className="mb-1 inline-block pr-4 align-middle text-xl font-bold"
              htmlFor="inline-full-name"
            >
              Quantisation Factor
            </label>
            <div>
              <input
                className="inline-block align-middle"
                id="quantisation-factor"
                type="range"
                min="1.0"
                max="100.0"
                value={temporaryQuantisationFactor}
                onMouseUp={() => {
                  // Synchronise temporary and stored value
                  // This is separated from onchange because onchange fires very often when sliding.
                  setQuantisationFactor(temporaryQuantisationFactor);
                }}
                onChange={(e) =>
                  setTempQuantisationFactor(parseFloat(e.target.value))
                }
              />
              <span className="mx-2">{temporaryQuantisationFactor}</span>
            </div>
          </div>

          {processingState !== "Inactive" && (
            <div className="py-3 text-center text-xl">
              <Spinner />
              {processingState}
            </div>
          )}

          {quantiseErrorMessage && (
            <ErrorMessage message={quantiseErrorMessage} />
          )}
          {!quantiseErrorMessage &&
            outputVideoSrc &&
            processingState === "Inactive" && (
              <VideoPlayer src={outputVideoSrc} />
            )}

          <input
            className="hidden"
            type="file"
            name="file"
            id="uploader"
            onChange={handleUpload}
          />
          <label
            htmlFor="uploader"
            className="my-2 block max-w-[11rem] cursor-pointer rounded border-2 border-solid border-orange-600 bg-orange-600 py-2 px-4 text-lg font-bold text-white hover:border-orange-500 hover:bg-orange-500"
          >
            Select video...
          </label>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string | unknown }) {
  let errorMsg;
  if (typeof message === "string") {
    errorMsg = message;
  } else {
    errorMsg = "An error occurred. Try reloading.";
  }

  return (
    <div className="border border-red-700 bg-red-400 p-2 text-red-900">
      {errorMsg}
    </div>
  );
}

export default App;
