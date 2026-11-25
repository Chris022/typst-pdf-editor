export function deconstruct_message(buffer: ArrayBuffer):[string,Uint8Array]{
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const bytes = new Uint8Array(buffer);

    const message_idx = bytes.indexOf(enc.encode(",")[0]);

    const message_type = dec.decode(bytes.slice(0, message_idx).buffer);

    const payload = bytes.slice(message_idx + 1);

    return [message_type,payload];
}