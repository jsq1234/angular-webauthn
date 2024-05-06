import base64url from "base64url";

export const coerceToArrayBuffer = (value: string) => {
    const encoder = new TextEncoder();
    const encodedValue = encoder.encode(value);
    return encodedValue.buffer.slice(encodedValue.byteOffset, encodedValue.byteLength + encodedValue.byteOffset);
};

export const coerceToBaseUrl64 = (value: ArrayBuffer) => {
    return base64url.encode(Buffer.from(value));
}

export const coerceToBase64 = (value: string) => {
    return btoa(value);
}

export const arrayBufferToBase64 = (value: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(value)));
}