import { useEffect, useState } from "react";
import "./App.css";
import useFfmpeg from "./useFfmpeg";
import { fetchFile } from "@ffmpeg/ffmpeg";
import init, {
  greet,
  take_number_slice_by_shared_ref,
  take_number_slice_by_exclusive_ref,
} from '../wasm/pkg';

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
    greet();

    const my_array = new Uint8Array(100);
    // take_number_slice_by_shared_ref(new Uint8Array(100));
    const result = take_number_slice_by_exclusive_ref(my_array);
    console.log(my_array);
    console.log(result);


    // const result = add(1, 2);
    // alert(result);

    // const {target: { files }} = event;
    // if (isLoaded && files) {
    //   const { name } = files[0];
    //   const inputData = await fetchFile(files[0]);
    //   setInputVideoSrc(
    //     URL.createObjectURL(new Blob([inputData.buffer], { type: "video/mp4" }))
    //   );
    //   ffmpeg.FS("writeFile", name, inputData);
    //   await ffmpeg.run("-i", name, "output.y4m"); // convert to y4m
    //   const rawData = ffmpeg.FS("readFile", "output.y4m");
    //   console.log(rawData);
    //   console.log("Hello");
    //   await ffmpeg.run("-i", "output.y4m", "output.mp4");
    //   const data = ffmpeg.FS("readFile", "output.mp4");
    //   setOutputVideoSrc(
    //     URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    //   );
    // }
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
