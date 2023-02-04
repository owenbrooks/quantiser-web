import { useState } from "react";
import "./App.css";
import useFfmpeg from "./useFfmpeg";
import { fetchFile } from "@ffmpeg/ffmpeg";

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

  const [inputVideoSrc, setInputVideoSrc] = useState<string>();
  const [outputVideoSrc, setOutputVideoSrc] = useState<string>();

  const transcode = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const {target: { files }} = event;
    if (isLoaded && files) {
      const { name } = files[0];
      const inputData = await fetchFile(files[0]);
      setInputVideoSrc(
        URL.createObjectURL(new Blob([inputData.buffer], { type: "video/mp4" }))
      );
      ffmpeg.FS("writeFile", name, inputData);
      await ffmpeg.run("-i", name, "output.y4m"); // convert to y4m
      await ffmpeg.run("-i", name, "output.mp4");
      const data = ffmpeg.FS("readFile", "output.mp4");
      setOutputVideoSrc(
        URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
      );
    }
  };

  return (
    <div className="App py-3">
      <h1 className="py-3 text-6xl font-extralight">Quantise</h1>
      <input className="py-3" type="file" id="uploader" onChange={transcode} />
      <VideoPlayer src={inputVideoSrc} />
      <VideoPlayer src={outputVideoSrc} />
    </div>
  );
}

export default App;
