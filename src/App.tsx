import { useEffect, useState } from "react";
import useFfmpeg from "./useFfmpeg";
import { fetchFile } from "@ffmpeg/ffmpeg";
import init, { quantise_video } from "../wasm/pkg";
import Spinner from "./Spinner";

function useWasm() {
  useEffect(() => {
    // await init();
  }, []);
}

type VideoPlayerProps = {
  src: string | undefined;
};

type QuantisationMethod = "intra" | "inter";

type ProcessingState = "Inactive" | "Uploading" | "Decompressing" | "Quantising" | "Converting";

function VideoPlayer(props: VideoPlayerProps) {
  if (!props.src) {
    return null;
  }

  return <video className="py-3 max-w-lg" src={props.src} controls />;
}

function App() {
  const { ffmpeg, isLoaded } = useFfmpeg();
  useWasm();

  const [inputVideoSrc, setInputVideoSrc] = useState<string>();
  const [outputVideoSrc, setOutputVideoSrc] = useState<string>();
  const [quantisationMethod, setQuantisationMethod] =
    useState<QuantisationMethod>("inter");
  const [quantisationFactor, setQuantisationFactor] = useState(40.0);

  const [processingState, setProcessingState] = useState<ProcessingState>("Inactive");

  const transcode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await init();

    const {
      target: { files },
    } = event;
    if (isLoaded && files) {
      const { name } = files[0];
      setProcessingState("Uploading");
      const inputData = await fetchFile(files[0]);
      setInputVideoSrc(
        URL.createObjectURL(new Blob([inputData.buffer], { type: "video/mp4" }))
      );

      try {
        const my_array = new Uint8Array(100);
        quantise_video(my_array, 100, true);
      } catch (e) {
        console.error(e);
      }

      // convert to y4m for processing
      setProcessingState("Decompressing");
      ffmpeg.FS("writeFile", name, inputData);
      await ffmpeg.run("-i", name, "input.y4m");
      const rawData = ffmpeg.FS("readFile", "input.y4m");

      // process via wasm function
      setProcessingState("Quantising");
      try {
        const quantisedData = quantise_video(rawData, 50.0, quantisationMethod=="inter");

        // convert to mp4 for display
        setProcessingState("Converting");
        ffmpeg.FS("writeFile", "output.y4m", quantisedData);
        await ffmpeg.run("-i", "output.y4m", "output.mp4");
        const data = ffmpeg.FS("readFile", "output.mp4");

        setOutputVideoSrc(
          URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
        );
        setProcessingState("Inactive");
      } catch (e) {
        setProcessingState("Inactive");
        console.error(e);
      }
    }
  };

  return (
    <div className="px-2">
      <div>
        <h1 className="py-3 text-3xl font-bold">Quantise</h1>
      </div>
      <div className="mb-2">
          <label
            className="text-xl block font-bold mb-1 pr-4"
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
            onChange={(e) => setQuantisationMethod(e.target.value as QuantisationMethod)}
          />
          <span className="text-lg">Intra-frame</span>
        </label>
        <label className="mx-1 block font-bold">
          <input
            className="mr-2 leading-tight"
            type="radio"
            name="method"
            value="inter"
            checked={quantisationMethod == "inter"}
            onChange={(e) => setQuantisationMethod(e.target.value as QuantisationMethod)}
          />
          <span className="text-lg">Inter-frame</span>
        </label>
      </div>
      <div className="mb-2">
        <label
          className="text-xl align-middle inline-block font-bold mb-1 pr-4"
          htmlFor="inline-full-name"
        >
          Quantisation Factor
        </label>
        <input
          className="align-middle inline-block"
          id="quantisation-factor"
          type="range"
          min="1.0"
          max="100.0"
          value={quantisationFactor}
          onChange={(e) => setQuantisationFactor(parseFloat(e.target.value))}
        />
        <span className="mx-2">{quantisationFactor}</span>
      </div>

      {processingState !== "Inactive" &&
        <div className="text-center text-xl py-3">
          <Spinner />
          {processingState}
        </div>
      }

      <input className="py-3" type="file" id="uploader" onChange={transcode} />
      <button
        className="shadow bg-orange-600 hover:bg-orange-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
        type="button"
      >
        Select video
      </button>
      <VideoPlayer src={inputVideoSrc} />
      <VideoPlayer src={outputVideoSrc} />
    </div>
  );
}

export default App;
