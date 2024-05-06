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