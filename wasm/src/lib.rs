use std::io::BufWriter;

use itertools::Itertools;
use squish::yuv4mpeg2::{self, Encoder};
use squish::{dct_2d::quantise_frame, dct_3d::quantise_chunk};
use wasm_bindgen::prelude::*;
mod utils;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}
macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet() {
    console_log!("Hello, ");
    // console::log_1(&"Hello, 123456789asdfhkjhlkjha!".into());
}

#[wasm_bindgen]
pub fn take_number_slice_by_shared_ref(x: &[u8], quantisation_factor: f64) -> Vec<u8> {
    console_error_panic_hook::set_once();
    console_log!("Starting");

    let decoder = yuv4mpeg2::decode::Decoder::new(x);
    let reader = decoder.read_header().unwrap();

    let mut output_buffer = Vec::new();
    let encoder = Encoder::new(&mut output_buffer);

    {
        let mut writer = encoder
            .write_header(&reader.header)
            .expect("Failed to write header");

        for chunk in &reader.into_iter().chunks(8) {
            let frames = chunk.collect_vec();
            if frames.len() == 8 {
                // ignore smaller chunk at end since fast dct works on length 8 arrays
                let quantised_chunk = quantise_chunk(frames, quantisation_factor);
                for frame in quantised_chunk {
                    writer.write_frame(frame).expect("Failed to write frame");
                    // frame_count += 1;
                    console_log!("Frame count")
                    // if frame_count >= 20 {
                    //     break;
                    // }
                }
            }
        }
    }

    output_buffer
}
