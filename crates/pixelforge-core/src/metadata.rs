use image::{DynamicImage, GenericImageView, ImageFormat, ImageReader};
use serde::Serialize;
use std::io::Cursor;
use wasm_bindgen::JsError;

#[derive(Serialize)]
struct ImageMetadata {
    format: String,
    width: u32,
    height: u32,
    color_type: String,
    file_size: String,
    file_size_bytes: usize,
    pixel_count: u64,
    has_alpha: bool,
    is_animated: bool,
    estimated_memory_mb: f64,
}

pub fn extract_metadata(data: &[u8], format: &str) -> Result<String, JsError> {
    let format = match format.to_ascii_lowercase().as_str() {
        "jpeg" | "jpg" => ImageFormat::Jpeg,
        "png" => ImageFormat::Png,
        "gif" => ImageFormat::Gif,
        "bmp" => ImageFormat::Bmp,
        "webp" => ImageFormat::WebP,
        "tiff" | "tif" => ImageFormat::Tiff,
        "ico" => ImageFormat::Ico,
        other => return Err(JsError::new(&format!("Unsupported source format for metadata: {other}"))),
    };

    let image = ImageReader::with_format(Cursor::new(data), format)
        .decode()
        .map_err(|error| JsError::new(&format!("Failed to decode for metadata: {error}")))?;

    let (width, height) = image.dimensions();
    let color_type = image.color();
    let pixel_count = width as u64 * height as u64;
    let estimated_memory_mb = ((pixel_count * 4) as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0;

    let metadata = ImageMetadata {
        format: format.to_string(),
        width,
        height,
        color_type: format!("{color_type:?}"),
        file_size: format_file_size(data.len()),
        file_size_bytes: data.len(),
        pixel_count,
        has_alpha: color_type.has_alpha(),
        is_animated: false,
        estimated_memory_mb,
    };

    serde_json::to_string_pretty(&metadata)
        .map_err(|error| JsError::new(&format!("JSON error: {error}")))
}

fn format_file_size(bytes: usize) -> String {
    if bytes < 1024 {
        format!("{bytes} B")
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{:.2} MB", bytes as f64 / (1024.0 * 1024.0))
    }
}
