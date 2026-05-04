export function detect_format(data: Uint8Array): string;
export function is_rust_decodable(format: string): boolean;
export function convert_image(
  input_data: Uint8Array,
  source_format: string,
  target_format: string,
  quality: number,
): Uint8Array;
export function resize_image(
  input_data: Uint8Array,
  source_format: string,
  target_format: string,
  target_width: number,
  target_height: number,
  maintain_aspect: boolean,
  quality: number,
): Uint8Array;
export function resize_rgba(
  rgba_pixels: Uint8Array,
  width: number,
  height: number,
  target_format: string,
  target_width: number,
  target_height: number,
  maintain_aspect: boolean,
  quality: number,
): Uint8Array;
export function rgba_to_format(
  rgba_pixels: Uint8Array,
  width: number,
  height: number,
  target_format: string,
  quality: number,
): Uint8Array;
export function rotate_image(
  input_data: Uint8Array,
  source_format: string,
  degrees: number,
  target_format: string,
  quality: number,
): Uint8Array;
export function flip_image(
  input_data: Uint8Array,
  source_format: string,
  horizontal: boolean,
  target_format: string,
  quality: number,
): Uint8Array;
export function get_metadata(input_data: Uint8Array, source_format: string): string;
export function generate_thumbnail(input_data: Uint8Array, source_format: string): Uint8Array;
