import base64url from 'base64url';
import { fromUint8Array, toBase64, toUint8Array } from 'js-base64';

export function coerceToArrayBuffer(buf: any, name: string): ArrayBuffer {
  if (!name) {
    throw new TypeError('name not specified in coerceToArrayBuffer');
  }

  let buffer: Uint8Array;

  // Handle empty strings
  if (typeof buf === 'string' && buf === '') {
    buffer = new Uint8Array(0);
  }
  // Handle base64url and base64 strings
  else if (typeof buf === 'string') {
    const base64Str = buf
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    buffer = toUint8Array(base64Str);
  } else {
    buffer = new Uint8Array(buf);
  }

  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteLength + buffer.byteOffset
  );
}

export const coerceToBaseUrl64 = (thing: any, name: string) => {
  if (!name) {
    throw new TypeError('name not specified in coerceToBase64');
  }

  if (typeof thing === 'string') {
    // Convert from base64 to base64url

    thing = thing
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/={0,2}$/g, '');
  }

  if (typeof thing !== 'string') {
    let buffer = new Uint8Array(thing);
    thing = base64url.encode(String.fromCharCode(...buffer));
  }
};

export function toBase64url(value: string | ArrayBuffer | Uint8Array ){
  if(typeof value === 'string'){
    return toBase64(value, true);
  }
  if(value instanceof ArrayBuffer){
    return fromUint8Array(new Uint8Array(value), true);
  }
  return fromUint8Array(value, true);
}

export function parseBase64url(value: string): ArrayBuffer{
  return base64url.toBuffer(value).buffer;
}

export function fromStrToArrayBuffer(value: string){
  return new TextEncoder().encode(value).buffer;
}

export async function sha256(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  return await crypto.subtle.digest('SHA-256', buffer);
}

export function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]

    .map((b) => b.toString(16).padStart(2, '0'))

    .join('');
}

export function concatenateBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

  tmp.set(new Uint8Array(buffer1), 0);

  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

  return tmp;
}

/**
 * Parses the authenticator data received from a WebAuthn authenticator.
 * 
 * @param {ArrayBuffer} authData - The authenticator data buffer.
 * @returns {Object} - An object containing parsed values including rpIdHash, flags, counter, aaguid, credId, and COSEPublicKey.
 * @throws {Error} - If the authData is less than 37 bytes.
 */
export const parseAuthData = (authData: ArrayBuffer) => {
  // Ensure that the authenticator data is at least 37 bytes long
  if (authData.byteLength < 37) {
    throw new Error('Authenticator data must be at least 37 bytes long');
  }

  // Extract the first 32 bytes which contain the SHA-256 hash of the RP ID
  let rpIdHash = authData.slice(0, 32); // 32 bytes

  // Move the cursor forward by 32 bytes
  authData = authData.slice(32);

  // Extract the next byte which contains various flags
  let flagsBuf = authData.slice(0, 1);

  // Convert the flags buffer to an integer
  let flagsInt = new DataView(new Uint8Array(flagsBuf).buffer).getUint8(0);

  // Extract individual flags
  let up = !!(flagsInt & 0x01);  // User Present
  let uv = !!(flagsInt & 0x04);  // User Verified
  let at = !!(flagsInt & 0x40);  // Attestation Data
  let ed = !!(flagsInt & 0x80);  // Extension Data

  // Move the cursor forward by 1 byte
  authData = authData.slice(1);

  // Extract the next 4 bytes which contain the signature counter
  let counterBuf = authData.slice(0, 4);

  // Convert the counter buffer to an integer
  let counter = new DataView(new Uint8Array(counterBuf).buffer).getUint32(0);

  // Move the cursor forward by 4 bytes
  authData = authData.slice(4);

  console.log('Length of remaining authData:', authData.byteLength);

  // If the Attestation Data flag is not set or there is no remaining data, return the parsed values so far
  if (!at || authData.byteLength === 0) {
    return {
      rpIdHash,
      flags: {
        up,
        uv,
        at,
        ed
      },
      counter,
    };
  }

  // Extract the next 16 bytes which contain the AAGUID (Authenticator Attestation GUID)
  let aaguidBuffer = authData.slice(0, 16);

  // Move the cursor forward by 16 bytes
  authData = authData.slice(16);

  // Extract the next 2 bytes which contain the length of the credential ID
  let credIdLenBuf = authData.slice(0, 2);

  // Convert the credential ID length buffer to an integer
  let credIdLen = new DataView(new Uint8Array(credIdLenBuf).buffer).getUint16(0);

  console.log('Credential ID Length:', credIdLen);

  // Move the cursor forward by 2 bytes
  authData = authData.slice(2);

  // Extract the credential ID using the length from the previous step
  let credIdBuf = authData.slice(0, credIdLen);

  // Convert the credential ID buffer to a base64url string
  let credId = toBase64url(credIdBuf);

  // Move the cursor forward by the length of the credential ID
  authData = authData.slice(credIdLen);

  console.log('Length of final authData:', authData.byteLength);

  // The remaining bytes are the COSE encoded public key
  let COSEPublicKey = authData;

  // Return the parsed values as an object
  return {
    rpIdHash,
    flags: {
      up,
      uv,
      at,
      ed,
    },
    counter,
    aaguid: aaguidBuffer,
    credId,
    COSEPublicKey,
  };
};

export const convertCOSEtoJwk = (COSEPublicKey: any) => {
  const COSEKeyType = COSEPublicKey[1]; // 2 = Elliptic Curve
  const COSEAlg = COSEPublicKey[3]; // -7 = ES256
  const COSECurve = COSEPublicKey[-1]; // 1 = P-256
  const COSEX = COSEPublicKey[-2];
  const COSEY = COSEPublicKey[-3];
  
  const jwkX = toBase64url(COSEX);
  const jwkY = toBase64url(COSEY);

  const jwkKey = {
    kty: 'EC',
    crv: 'P-256',
    x: jwkX,
    y: jwkY,
    alg: 'ES256',
    use: 'sig',
  };

  return jwkKey;
}