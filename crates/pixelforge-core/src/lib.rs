mod convert;
mod metadata;
mod resize;
mod transform;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn detect_format(data: &[u8]) -> String {
    if data.len() >= 12 && &data[4..8] == b"ftyp" {
        let brand = &data[8..12];
        if brand == b"heic" || brand == b"heix" || brand == b"hevc" || brand == b"mif1" || brand == b"msf1" {
            return "heic".to_owned();
        }
        if brand == b"avif" || brand == b"avis" {
            return "avif".to_owned();
        }
        return "heif".to_owned();
    }

    if data.len() >= 4 && data[..4] == [0x89, b'P', b'N', b'G'] {
        return "png".to_owned();
    }
    if data.len() >= 3 && data[..3] == [0xFF, 0xD8, 0xFF] {
        return "jpeg".to_owned();
    }
    if data.len() >= 3 && &data[..3] == b"GIF" {
        return "gif".to_owned();
    }
    if data.len() >= 2 && &data[..2] == b"BM" {
        return "bmp".to_owned();
    }
    if data.len() >= 12 && &data[..4] == b"RIFF" && &data[8..12] == b"WEBP" {
        return "webp".to_owned();
    }
    if data.len() >= 4 && ((&data[..2] == b"II" && data[2] == 0x2A) || (&data[..2] == b"MM" && data[3] == 0x2A)) {
        return "tiff".to_owned();
    }

    "unknown".to_owned()
}

#[wasm_bindgen]
pub fn is_rust_decodable(format: &str) -> bool {
    matches!(format, "jpeg" | "jpg" | "png" | "gif" | "bmp" | "ico" | "tiff" | "tif" | "webp")
}

#[wasm_bindgen]
pub fn convert_image(
    input_data: &[u8],
    source_format: &str,
    target_format: &str,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    let image = convert::decode_image(input_data, source_format)?;
    convert::encode_image(&image, target_format, quality)
}

#[wasm_bindgen]
pub fn resize_image(
    input_data: &[u8],
    source_format: &str,
    target_format: &str,
    target_width: u32,
    target_height: u32,
    maintain_aspect: bool,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    let image = convert::decode_image(input_data, source_format)?;
    let resized = resize::resize_dynamic(&image, target_width, target_height, maintain_aspect)?;
    convert::encode_image(&resized, target_format, quality)
}

#[wasm_bindgen]
pub fn rgba_to_format(
    rgba_pixels: &[u8],
    width: u32,
    height: u32,
    target_format: &str,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    let image = image::RgbaImage::from_raw(width, height, rgba_pixels.to_vec())
        .ok_or_else(|| JsError::new("Failed to create RGBA image from raw pixels"))?;
    let dynamic = image::DynamicImage::ImageRgba8(image);
    convert::encode_image(&dynamic, target_format, quality)
}

#[wasm_bindgen]
pub fn resize_rgba(
    rgba_pixels: &[u8],
    width: u32,
    height: u32,
    target_format: &str,
    target_width: u32,
    target_height: u32,
    maintain_aspect: bool,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    let image = image::RgbaImage::from_raw(width, height, rgba_pixels.to_vec())
        .ok_or_else(|| JsError::new("Failed to create RGBA image from raw pixels"))?;
    let dynamic = image::DynamicImage::ImageRgba8(image);
    let resized = resize::resize_dynamic(&dynamic, target_width, target_height, maintain_aspect)?;
    convert::encode_image(&resized, target_format, quality)
}

#[wasm_bindgen]
pub fn rotate_image(
    input_data: &[u8],
    source_format: &str,
    degrees: u16,
    target_format: &str,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    let image = convert::decode_image(input_data, source_format)?;
    let rotated = match degrees {
        90 => transform::rotate90(&image),
        180 => transform::rotate180(&image),
        270 => transform::rotate270(&image),
        _ => return Err(JsError::new("Only 90, 180, and 270 degree rotations are supported")),
    };
    convert::encode_image(&rotated, target_format, quality)
}

#[wasm_bindgen]
pub fn flip_image(
    input_data: &[u8],
    source_format: &str,
    horizontal: bool,
    target_format: &str,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    let image = convert::decode_image(input_data, source_format)?;
    let flipped = if horizontal {
        transform::flip_horizontal(&image)
    } else {
        transform::flip_vertical(&image)
    };
    convert::encode_image(&flipped, target_format, quality)
}

#[wasm_bindgen]
pub fn get_metadata(input_data: &[u8], source_format: &str) -> Result<String, JsError> {
    metadata::extract_metadata(input_data, source_format)
}

#[wasm_bindgen]
pub fn generate_thumbnail(input_data: &[u8], source_format: &str) -> Result<Vec<u8>, JsError> {
    let image = convert::decode_image(input_data, source_format)?;
    let thumb = resize::resize_dynamic(&image, 256, 256, true)?;
    convert::encode_image(&thumb, "jpeg", 80)
}
