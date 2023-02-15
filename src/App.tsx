import { useEffect, useState } from "react";
import "./App.css";
import useFfmpeg from "./useFfmpeg";
import { fetchFile } from "@ffmpeg/ffmpeg";
import init, { quantise_video } from "../wasm/pkg";

function useWasm() {
  useEffect(() => {
    // await init();
  }, []);
}

type VideoPlayerProps = {
  src: string | undefined;
};

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

  const transcode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await init();

    const {
      target: { files },
    } = event;
    if (isLoaded && files) {
      const { name } = files[0];
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
      ffmpeg.FS("writeFile", name, inputData);
      await ffmpeg.run("-i", name, "input.y4m");
      const rawData = ffmpeg.FS("readFile", "input.y4m");

      // process via wasm function
      console.log("before processing");
      try {
        const quantisedData = quantise_video(rawData, 50.0, true);
        console.log("after processing");
        console.log(quantisedData);

        // convert to mp4 for display
        ffmpeg.FS("writeFile", "output.y4m", quantisedData);
        await ffmpeg.run("-i", "output.y4m", "output.mp4");
        const data = ffmpeg.FS("readFile", "output.mp4");

        setOutputVideoSrc(
          URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="App py-3">
      <h1 className="py-3 text-xl font-extralight">Quantise</h1>
      <input className="py-3" type="file" id="uploader" onChange={transcode} />
      <VideoPlayer src={inputVideoSrc} />
      <VideoPlayer src={outputVideoSrc} />
    </div>
  );
}

export default App;
