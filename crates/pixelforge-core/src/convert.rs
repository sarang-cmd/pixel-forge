use image::{DynamicImage, ImageFormat, ImageReader};
use std::io::Cursor;
use wasm_bindgen::JsError;

pub fn decode_image(data: &[u8], format: &str) -> Result<DynamicImage, JsError> {
    let format = match format.to_ascii_lowercase().as_str() {
        "jpeg" | "jpg" => ImageFormat::Jpeg,
        "png" => ImageFormat::Png,
        "gif" => ImageFormat::Gif,
        "bmp" => ImageFormat::Bmp,
        "ico" => ImageFormat::Ico,
        "tiff" | "tif" => ImageFormat::Tiff,
        "webp" => ImageFormat::WebP,
        other => return Err(JsError::new(&format!("Unsupported source format: {other}"))),
    };

    ImageReader::with_format(Cursor::new(data), format)
        .decode()
        .map_err(|error| JsError::new(&format!("Decode error: {error}")))
}

pub fn encode_image(image: &DynamicImage, target_format: &str, quality: u8) -> Result<Vec<u8>, JsError> {
    let mut output = Cursor::new(Vec::new());

    match target_format.to_ascii_lowercase().as_str() {
        "jpeg" | "jpg" => {
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, quality);
            encoder
                .encode_image(image)
                .map_err(|error| JsError::new(&format!("JPEG encode error: {error}")))?;
        }
        "png" | "webp" | "gif" | "bmp" | "tiff" | "tif" => {
            let format = match target_format.to_ascii_lowercase().as_str() {
                "png" => ImageFormat::Png,
                "webp" => ImageFormat::WebP,
                "gif" => ImageFormat::Gif,
                "bmp" => ImageFormat::Bmp,
                _ => ImageFormat::Tiff,
            };

            image
                .write_to(&mut output, format)
                .map_err(|error| JsError::new(&format!("Encode error: {error}")))?;
        }
        other => return Err(JsError::new(&format!("Unsupported target format: {other}"))),
    }

    Ok(output.into_inner())
}
