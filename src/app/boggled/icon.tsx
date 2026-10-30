import { ImageResponse } from "next/og";
import { Tile } from "@/components/boggled/IconTile";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Tile px={size.width} />, size);
}
