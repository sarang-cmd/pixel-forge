use image::{DynamicImage, GenericImageView, ImageBuffer, Rgba};

pub fn rotate90(image: &DynamicImage) -> DynamicImage {
    let source = image.to_rgba8();
    let (width, height) = source.dimensions();
    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(height, width);

    for y in 0..height {
        for x in 0..width {
            output.put_pixel(height - 1 - y, x, *source.get_pixel(x, y));
        }
    }

    DynamicImage::ImageRgba8(output)
}

pub fn rotate180(image: &DynamicImage) -> DynamicImage {
    let source = image.to_rgba8();
    let (width, height) = source.dimensions();
    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(width, height);

    for y in 0..height {
        for x in 0..width {
            output.put_pixel(width - 1 - x, height - 1 - y, *source.get_pixel(x, y));
        }
    }

    DynamicImage::ImageRgba8(output)
}

pub fn rotate270(image: &DynamicImage) -> DynamicImage {
    let source = image.to_rgba8();
    let (width, height) = source.dimensions();
    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(height, width);

    for y in 0..height {
        for x in 0..width {
            output.put_pixel(y, width - 1 - x, *source.get_pixel(x, y));
        }
    }

    DynamicImage::ImageRgba8(output)
}

pub fn flip_horizontal(image: &DynamicImage) -> DynamicImage {
    let source = image.to_rgba8();
    let (width, height) = source.dimensions();
    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(width, height);

    for y in 0..height {
        for x in 0..width {
            output.put_pixel(width - 1 - x, y, *source.get_pixel(x, y));
        }
    }

    DynamicImage::ImageRgba8(output)
}

pub fn flip_vertical(image: &DynamicImage) -> DynamicImage {
    let source = image.to_rgba8();
    let (width, height) = source.dimensions();
    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(width, height);

    for y in 0..height {
        for x in 0..width {
            output.put_pixel(x, height - 1 - y, *source.get_pixel(x, y));
        }
    }

    DynamicImage::ImageRgba8(output)
}
