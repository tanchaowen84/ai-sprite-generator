const crcTable = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(input: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of input) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeText(text: string) {
  return new TextEncoder().encode(text);
}

function writeUInt16LE(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

function writeUInt32LE(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

function concat(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

export type ZipEntry = {
  path: string;
  data: Uint8Array | Buffer | string;
};

export function createStoredZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filename = encodeText(entry.path);
    const data =
      typeof entry.data === 'string' ? encodeText(entry.data) : entry.data;
    const checksum = crc32(data);

    const localHeader = new Uint8Array(30 + filename.byteLength);
    writeUInt32LE(localHeader, 0, 0x04034b50);
    writeUInt16LE(localHeader, 4, 20);
    writeUInt16LE(localHeader, 6, 0x0800);
    writeUInt16LE(localHeader, 8, 0);
    writeUInt16LE(localHeader, 10, 0);
    writeUInt16LE(localHeader, 12, 0);
    writeUInt32LE(localHeader, 14, checksum);
    writeUInt32LE(localHeader, 18, data.byteLength);
    writeUInt32LE(localHeader, 22, data.byteLength);
    writeUInt16LE(localHeader, 26, filename.byteLength);
    writeUInt16LE(localHeader, 28, 0);
    localHeader.set(filename, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + filename.byteLength);
    writeUInt32LE(centralHeader, 0, 0x02014b50);
    writeUInt16LE(centralHeader, 4, 20);
    writeUInt16LE(centralHeader, 6, 20);
    writeUInt16LE(centralHeader, 8, 0x0800);
    writeUInt16LE(centralHeader, 10, 0);
    writeUInt16LE(centralHeader, 12, 0);
    writeUInt16LE(centralHeader, 14, 0);
    writeUInt32LE(centralHeader, 16, checksum);
    writeUInt32LE(centralHeader, 20, data.byteLength);
    writeUInt32LE(centralHeader, 24, data.byteLength);
    writeUInt16LE(centralHeader, 28, filename.byteLength);
    writeUInt16LE(centralHeader, 30, 0);
    writeUInt16LE(centralHeader, 32, 0);
    writeUInt16LE(centralHeader, 34, 0);
    writeUInt16LE(centralHeader, 36, 0);
    writeUInt32LE(centralHeader, 38, 0);
    writeUInt32LE(centralHeader, 42, offset);
    centralHeader.set(filename, 46);
    centralParts.push(centralHeader);

    offset += localHeader.byteLength + data.byteLength;
  }

  const centralDirectory = concat(centralParts);
  const endOfCentralDirectory = new Uint8Array(22);
  writeUInt32LE(endOfCentralDirectory, 0, 0x06054b50);
  writeUInt16LE(endOfCentralDirectory, 4, 0);
  writeUInt16LE(endOfCentralDirectory, 6, 0);
  writeUInt16LE(endOfCentralDirectory, 8, entries.length);
  writeUInt16LE(endOfCentralDirectory, 10, entries.length);
  writeUInt32LE(endOfCentralDirectory, 12, centralDirectory.byteLength);
  writeUInt32LE(endOfCentralDirectory, 16, offset);
  writeUInt16LE(endOfCentralDirectory, 20, 0);

  return Buffer.from(
    concat([...localParts, centralDirectory, endOfCentralDirectory])
  );
}
