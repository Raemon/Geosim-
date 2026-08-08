import { deflateSync } from 'node:zlib';
import type { RasterImage } from '../src/view/equirectangularMap';

export function pngBuffer(image: RasterImage): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', headerBytes(image)),
    chunk('IDAT', deflateSync(scanlines(image))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function headerBytes(image: RasterImage): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 2;
  return header;
}

function scanlines(image: RasterImage): Buffer {
  const stride = image.width * 3;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let row = 0; row < image.height; row++) {
    raw[row * (stride + 1)] = 0;
    Buffer.from(image.pixels.buffer, row * stride, stride)
      .copy(raw, row * (stride + 1) + 1);
  }
  return raw;
}

function chunk(type: string, body: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([length, typed, crc]);
}

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
