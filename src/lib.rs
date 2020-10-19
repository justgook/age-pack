use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = doPng)]
pub fn do_png(width: u32, height: u32, data: Vec<u8>) -> Vec<u8> {
    let mut out = Vec::new();
    let mut encoder = png::Encoder::new(&mut out, width, height);
    encoder.set_color(png::ColorType::RGBA);
    encoder.set_depth(png::BitDepth::Eight);
    let mut writer = encoder.write_header().unwrap();
    writer.write_image_data(&data).unwrap();
    drop(writer);
    out
}
