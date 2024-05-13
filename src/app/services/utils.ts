import base64url from "base64url";
import { toUint8Array } from "js-base64";

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

      const base64Str = buf.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      buffer = toUint8Array(base64Str);

    }
    else{

        buffer = new Uint8Array(buf);

    }
    
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteLength + buffer.byteOffset);
}

export const coerceToBaseUrl64 = (thing: any, name: string) => {
    if (!name) {

		throw new TypeError("name not specified in coerceToBase64");

	}

    if (typeof thing === "string") {

		// Convert from base64 to base64url

		thing = thing.replace(/\+/g, "-").replace(/\//g, "_").replace(/={0,2}$/g, "");

	}

    if(typeof thing !== "string"){
        let buffer = new Uint8Array(thing);
        thing = base64url.encode(String.fromCharCode(...buffer));   
    }

}

export const coerceToBase64 = (value: string) => {
    return btoa(value);
}

export const arrayBufferToBase64 = (value: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(value)));
}



export function toBuffer(txt :string) :ArrayBuffer {

  return Uint8Array.from(txt, c => c.charCodeAt(0)).buffer

}


export function parseBuffer(buffer :ArrayBuffer) :string {

  return String.fromCharCode(...new Uint8Array(buffer))

}



export function isBase64url(txt :string) :boolean {

  return txt.match(/^[a-zA-Z0-9\-_]+=*$/) !== null

}


export function toBase64url(buffer :ArrayBuffer) :string {

  const txt = btoa(parseBuffer(buffer)) // base64

  return txt.replaceAll('+', '-').replaceAll('/', '_')

}


export function parseBase64url(txt :string) :ArrayBuffer {

  txt = txt.replaceAll('-', '+').replaceAll('_', '/') // base64url -> base64

  return toBuffer(atob(txt))

}



export async function sha256(buffer :ArrayBuffer) :Promise<ArrayBuffer> {

  return await crypto.subtle.digest('SHA-256', buffer)

}


export function bufferToHex (buffer :ArrayBuffer) :string {

  return [...new Uint8Array (buffer)]

      .map (b => b.toString (16).padStart (2, "0"))

      .join ("");

}



export function concatenateBuffers(buffer1 :ArrayBuffer, buffer2  :ArrayBuffer) {

  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

  tmp.set(new Uint8Array(buffer1), 0);

  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

  return tmp;

};