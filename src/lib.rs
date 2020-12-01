use wasm_bindgen::prelude::*;
use std::collections::HashMap;


// #[wasm_bindgen]
// extern "C" {
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(s: &str);
//
//     #[wasm_bindgen(js_namespace = console, js_name = log)]
//     fn log_u32(a: u32);
//
//     #[wasm_bindgen(js_namespace = console, js_name = log)]
//     fn log_many(a: &str, b: &str);
// }
//
// macro_rules! console_log {
//     ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
// }

// DEBUG END!!

// EXTERN MAGIC START
// #[wasm_bindgen(module = "/src/defined-in-js.js")]
// extern "C" {
//     fn name() -> String;
//
//     type MyClass;
//
//     #[wasm_bindgen(constructor)]
//     fn new() -> MyClass;
//
//     #[wasm_bindgen(method, getter)]
//     fn number(this: &MyClass) -> u32;
//     #[wasm_bindgen(method, setter)]
//     fn set_number(this: &MyClass, number: u32) -> MyClass;
//     #[wasm_bindgen(method)]
//     fn render(this: &MyClass) -> String;
// }
//
// #[wasm_bindgen]
// extern "C" {
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(s: &str);
// }
//
//
// #[wasm_bindgen(start)]
// pub fn run() {
//     log(&format!("Hello from {}!", name())); // should output "Hello from Rust!"
//
//     let x = MyClass::new();
//     assert_eq!(x.number(), 42);
//     x.set_number(10);
//     log(&x.render());
// }
// EXTERN MAGIC END


#[wasm_bindgen(js_name = encodePng)]
pub fn encode_png(width: u32, height: u32, data: Vec<u8>) -> Vec<u8> {
    let mut out = Vec::new();
    let mut encoder = png::Encoder::new(&mut out, width, height);
    encoder.set_color(png::ColorType::RGBA);
    encoder.set_depth(png::BitDepth::Eight);
    let mut writer = encoder.write_header().unwrap();
    writer.write_image_data(&data).unwrap();
    drop(writer);
    out
}

// Decoding
#[wasm_bindgen]
pub struct ImageData {
    data: Vec<u8>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl ImageData {
    // pub fn new(data: Vec<u8>, width: u32, height: u32) -> ImageData {
    //     ImageData { width, height, data }
    // }
    pub fn width(&self) -> u32 { self.width }
    pub fn height(&self) -> u32 { self.height }
    pub fn data(&self) -> Vec<u8> { self.data.as_slice().to_vec() }
}


#[wasm_bindgen(js_name = decodePng)]
pub fn decode_png(image: Vec<u8>) -> ImageData {
    let decoder = png::Decoder::new(image.as_slice());
    let (info, mut reader) = decoder.read_info().unwrap();
    let mut buf = vec![0; info.buffer_size()];
    reader.next_frame(&mut buf).unwrap();
    // drop(reader);

    ImageData { width: info.width, height: info.height, data: buf }
}

#[wasm_bindgen(js_name = decodePngInfo)]
pub fn png_dimensions(image: Vec<u8>) -> Dimensions {
    let decoder = png::Decoder::new(image.as_slice());
    let (info, _) = decoder.read_info().unwrap();
    // drop(reader);
    Dimensions { width: info.width, height: info.height }
}

#[wasm_bindgen]
pub struct Dimensions {
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl Dimensions {
    pub fn width(&self) -> u32 { self.width }
    pub fn height(&self) -> u32 { self.height }
}

// Slicing

#[wasm_bindgen]
pub struct ImagesOptimized {
    mapping: Vec<u32>,
    data: Vec<Vec<u8>>,
    width: u32,
    height: u32,
    cols: u32,
    rows: u32,
}

#[wasm_bindgen]
impl ImagesOptimized {
    pub fn width(&self) -> u32 { self.width }
    pub fn height(&self) -> u32 { self.height }
    pub fn get(&self, i: u32) -> Vec<u8> { self.data[self.mapping[i as usize] as usize].to_vec() }
    pub fn image(&self, i: u32) -> Vec<u8> { encode_png(self.width, self.height, self.get(i)) }
    pub fn count(&self) -> usize { self.mapping.len() }
    pub fn cols(&self) -> u32 { self.cols }
    pub fn rows(&self) -> u32 { self.rows }
}

#[wasm_bindgen]
pub struct ImagesFast {
    data: Vec<Vec<u8>>,
    width: u32,
    height: u32,
    cols: u32,
    rows: u32,
}

#[wasm_bindgen]
impl ImagesFast {
    pub fn width(&self) -> u32 { self.width }
    pub fn height(&self) -> u32 { self.height }
    pub fn get(&self, i: u32) -> Vec<u8> { self.data[i as usize].to_vec() }
    pub fn image(&self, i: u32) -> Vec<u8> { encode_png(self.width, self.height, self.get(i)) }
    pub fn count(&self) -> usize { self.data.len() }
    pub fn cols(&self) -> u32 { self.cols }
    pub fn rows(&self) -> u32 { self.rows }
}


pub struct UniqueImages {
    mapping: Vec<u32>,
    data: Vec<Vec<u8>>,
}

impl UniqueImages {
    pub fn get(&self, i: usize) -> Vec<u8> { self.data[self.mapping[i] as usize].to_vec() }
    pub fn count(&self) -> usize { self.mapping.len() }
}


pub fn slice_image(image: Vec<u8>, image_width: usize, image_height: usize, target_width: usize, target_height: usize) -> Vec<Vec<u8>> {
    let col_count = div_ceil(image_width, target_width);
    let row_count = div_ceil(image_height, target_height);

    let sub_image_byte_cont = target_width * target_height * 4;
    let image_count = (col_count * row_count) as usize;
    let mut all_images = vec![vec![0; sub_image_byte_cont]; image_count];

    let rows_data = image.chunks(image_width * 4);

    for (i, row) in rows_data.enumerate() {
        let part = row.chunks(target_width * 4);
        let row_id = i / target_height;
        for (j, sub_row) in part.enumerate() {
            let inner_row_index = i % target_height;
            let inner_row_index_offset_start = target_width * inner_row_index * 4;
            let inner_row_index_offset_end = inner_row_index_offset_start + sub_row.len();
            let range = inner_row_index_offset_start..inner_row_index_offset_end;
            let image_index = row_id * col_count + j;
            all_images[image_index].splice(range, sub_row.to_vec());
        }
    }
    all_images
}

pub fn unique_images(images: Vec<Vec<u8>>) -> UniqueImages {
    let mut images_hashmap = HashMap::new();
    let mut indexes = Vec::new();
    let mut unique = Vec::new();
    let mut i = 0;
    for item in images.iter() {
        match images_hashmap.get(item) {
            Some(v) => {
                indexes.push(*v);
            }
            None => {
                images_hashmap.insert(item, i);
                unique.push(item.to_vec());
                indexes.push(i);
                i += 1;
            }
        };
    }
    UniqueImages { mapping: indexes, data: unique }
}

#[wasm_bindgen(js_name = slicePngData)]
pub fn slice_png_data(image: Vec<u8>, w: usize, h: usize) -> ImagesOptimized {
    let decoded_image = decode_png(image);
    let image_width = decoded_image.width as usize;
    let image_height = decoded_image.height as usize;
    let image_data = decoded_image.data;

    let all_images = slice_image(image_data, image_width, image_height, w, h);
    let result = unique_images(all_images);

    let col_count = div_ceil(image_width, w);
    let row_count = div_ceil(image_height, h);
    ImagesOptimized {
        mapping: result.mapping,
        data: result.data,
        width: w as u32,
        height: h as u32,
        cols: col_count as u32,
        rows: row_count as u32,
    }
}

#[wasm_bindgen(js_name = slicePngFast)]
pub fn slice_png_data_fast(image: Vec<u8>, w: usize, h: usize) -> ImagesFast {
    let decoded_image = decode_png(image);
    let image_width = decoded_image.width as usize;
    let image_height = decoded_image.height as usize;
    let image_data = decoded_image.data;

    let all_images = slice_image(image_data, image_width, image_height, w, h);

    let col_count = div_ceil(image_width, w);
    let row_count = div_ceil(image_height, h);
    ImagesFast {
        data: all_images,
        width: w as u32,
        height: h as u32,
        cols: col_count as u32,
        rows: row_count as u32,
    }
}

fn div_ceil(x: usize, d: usize) -> usize { (x + d - 1) / d }