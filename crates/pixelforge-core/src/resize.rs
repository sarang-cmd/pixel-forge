use image::{DynamicImage, GenericImageView};
use wasm_bindgen::JsError;

pub fn resize_dynamic(
    image: &DynamicImage,
    target_width: u32,
    target_height: u32,
    maintain_aspect: bool,
) -> Result<DynamicImage, JsError> {
    let (source_width, source_height) = image.dimensions();

    let (width, height) = if maintain_aspect {
        let scale = (target_width as f32 / source_width as f32).min(target_height as f32 / source_height as f32);
        let width = (source_width as f32 * scale).round().max(1.0) as u32;
        let height = (source_height as f32 * scale).round().max(1.0) as u32;
        (width, height)
    } else {
        (target_width.max(1), target_height.max(1))
    };

    Ok(image.resize_exact(width, height, image::imageops::FilterType::Lanczos3))
}
