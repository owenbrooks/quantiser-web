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

#[derive(Debug, Clone)]

pub enum QuantiseError {
    DecodeError(String),
    EncodeError(String),
}

impl Into<JsValue> for QuantiseError {
    fn into(self) -> JsValue {
        match self {
            QuantiseError::DecodeError(msg) => JsValue::from_str(&msg),
            QuantiseError::EncodeError(msg) => JsValue::from_str(&msg),
        }
    }
}

impl From<squish::yuv4mpeg2::Error> for QuantiseError {
    fn from(e: squish::yuv4mpeg2::Error) -> Self {
        match e {
            yuv4mpeg2::Error::DecodeHeader => QuantiseError::DecodeError("Failed to decode header".to_string()),
            yuv4mpeg2::Error::DecodeDimensions => QuantiseError::DecodeError("Failed to decode dimensions".to_string()),
            yuv4mpeg2::Error::DecodeColorSpace => QuantiseError::DecodeError("Failed to decode color space".to_string()),
            yuv4mpeg2::Error::DecodeFrameRate => QuantiseError::DecodeError("Failed to decode frame rate".to_string()),
            yuv4mpeg2::Error::DecodeInterlaceMode => QuantiseError::DecodeError("Failed to decode interlace mode".to_string()),
            yuv4mpeg2::Error::IOError(e) => QuantiseError::DecodeError(format!("IO Error: {}", e.to_string())),
        }
    }
}

#[wasm_bindgen]
pub fn quantise_video(
    x: &[u8],
    quantisation_factor: f64,
    temporal_quantisation: bool,
) -> Result<Vec<u8>, QuantiseError> {
    console_error_panic_hook::set_once();

    let decoder = yuv4mpeg2::decode::Decoder::new(x);
    let reader = decoder.read_header().map_err(|_e| QuantiseError::DecodeError("Failed to read header".to_string()))?;

    let mut frame_count = 0;

    let mut output_buffer = Vec::new();
    let encoder = Encoder::new(&mut output_buffer);

    {
        let mut writer = encoder
            .write_header(&reader.header)
            .map_err(|_e| QuantiseError::EncodeError("Failed to write header".to_string()))?;

        if temporal_quantisation {
            // inter-frame DCT quantisation
            for chunk in &reader.into_iter().chunks(8) {
                let frames = chunk.collect_vec();
                if frames.len() == 8 {
                    // ignore smaller chunk at end since fast dct works on length 8 arrays
                    let quantised_chunk = quantise_chunk(frames, quantisation_factor);
                    for frame in quantised_chunk {
                        writer.write_frame(frame).map_err(|_e| {
                            QuantiseError::EncodeError("Failed to write frame".to_string())
                        })?;
                        frame_count += 1;
                        console_log!("Frame count: {}", frame_count);
                    }
                }
            }
        } else {
            // 2D quantisation, intra-frame only
            for frame in reader {
                let new_frame = quantise_frame(frame, quantisation_factor);
                writer.write_frame(new_frame)?;
                frame_count += 1;
            }
        }
    }

    Ok(output_buffer)
}
