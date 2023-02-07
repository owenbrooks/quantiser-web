mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}
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
pub fn take_number_slice_by_shared_ref(x: &[u8]) {}

#[wasm_bindgen]
pub fn take_number_slice_by_exclusive_ref(x: &mut [u8]) -> Vec<u8> {
    for i in 0..x.len() {
        x[i] = 2;
    }
    console_log!("{:?}", x);
    x.to_vec()
}
