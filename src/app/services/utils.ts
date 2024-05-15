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

export const parseAuthData = (authData: ArrayBuffer) => {
  if (authData.byteLength < 37) {
    throw new Error('Authenticator data must be at least 37 bytes long');
  }

  let rpIdHash = authData.slice(0, 32); // 32 bytes

  authData = authData.slice(32);

  let flagsBuf = authData.slice(0, 1);

  let flagsInt = new DataView(new Uint8Array(flagsBuf).buffer).getUint8(0);

  let up = !!(flagsInt & 0x01);
  let uv = !!(flagsInt & 0x04);
  let at = !!(flagsInt & 0x40);
  let ed = !!(flagsInt & 0x80);

  authData = authData.slice(1);

  let counterBuf = authData.slice(0, 4);

  let counter = new DataView(new Uint8Array(counterBuf).buffer).getUint32(0);

  authData = authData.slice(4);

  console.log('length of remaining authData', authData.byteLength);

  if(!at || authData.byteLength === 0){
    return {
      rpIdHash,
      flags: {
        up,
        uv,
        at,
        ed
      },
      counter,
    }
  }

  let aaguidBuffer = authData.slice(0, 16);

  authData = authData.slice(16);

  let credIdLenBuf = authData.slice(0, 2);

  let credIdLen = new DataView(new Uint8Array(credIdLenBuf).buffer).getUint16(0);

  console.log('Credential ID Length: ', credIdLen);

  authData = authData.slice(2);

  let credIdBuf = authData.slice(0, credIdLen);

  let credId = toBase64url(credIdBuf);

  authData = authData.slice(credIdLen);

  console.log('Length of final authData: ', authData.byteLength);
  
  let COSEPublicKey = authData;

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