import * as OTPAuth from "otpauth";

/**
 * Decodes a Google Authenticator migration URI (otpauth-migration://)
 * which contains a Base64-encoded Protobuf payload.
 * 
 * @param {string} uri The migration URI
 * @returns {string[]} An array of standard otpauth:// URIs
 */
export function decodeMigrationUri(uri) {
    if (!uri.startsWith("otpauth-migration://")) {
        throw new Error("Invalid migration URI");
    }

    const url = new URL(uri);
    const data = url.searchParams.get("data");
    if (!data) throw new Error("No data found in migration URI");

    // Google Authenticator migration data is a Base64-encoded Protobuf message.
    // Instead of bringing in a heavy Protobuf library, we can parse it manually
    // if we know the field IDs.

    // 1. Decode Base64 to binary
    const binary = atob(data);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }

    return parseMigrationPayload(buffer);
}

/**
 * Extremely simple Protobuf parser for the MigrationPayload format.
 * 
 * Payload structure (approximate):
 * message MigrationPayload {
 *   repeated OtpParameters otp_parameters = 1;
 *   int32 version = 2;
 *   int32 batch_size = 3;
 *   int32 batch_index = 4;
 *   int32 batch_id = 5;
 * }
 * 
 * message OtpParameters {
 *   bytes secret = 1;
 *   string name = 2;
 *   string issuer = 3;
 *   Algorithm algorithm = 4;
 *   DigitCount digits = 5;
 *   OtpType type = 6;
 *   string counter = 7;
 * }
 */
function parseMigrationPayload(buffer) {
    const otps = [];
    let pos = 0;

    while (pos < buffer.length) {
        const tag = buffer[pos++];
        const wireType = tag & 0x7;
        const fieldNumber = tag >> 3;

        if (fieldNumber === 1 && wireType === 2) {
            // otp_parameters (repeated, length-delimited)
            const length = readVarint(buffer, pos);
            pos = length.nextPos;
            const otpBuffer = buffer.slice(pos, pos + length.value);
            otps.push(parseOtpParameters(otpBuffer));
            pos += length.value;
        } else {
            // Skip other fields (version, batch info, etc.)
            pos = skipField(buffer, pos, wireType);
        }
    }

    return otps.map(params => {
        // Convert to standard otpauth:// URI
        try {
            const totp = new OTPAuth.TOTP({
                issuer: params.issuer || params.name.split(":")[0] || "Unknown",
                label: params.name || "Account",
                algorithm: params.algorithm || "SHA1",
                digits: params.digits || 6,
                period: 30,
                secret: new OTPAuth.Secret({ buffer: params.secret }),
            });
            return totp.toString();
        } catch (e) {
            console.error("Failed to convert parameters to TOTP:", e, params);
            return null;
        }
    }).filter(uri => uri !== null);
}

function parseOtpParameters(buffer) {
    const params = {
        secret: null,
        name: "",
        issuer: "",
        algorithm: "SHA1",
        digits: 6,
        type: "TOTP"
    };

    let pos = 0;
    while (pos < buffer.length) {
        const tag = buffer[pos++];
        const wireType = tag & 0x7;
        const fieldNumber = tag >> 3;

        if (fieldNumber === 1 && wireType === 2) { // secret (bytes)
            const length = readVarint(buffer, pos);
            pos = length.nextPos;
            params.secret = buffer.slice(pos, pos + length.value);
            pos += length.value;
        } else if (fieldNumber === 2 && wireType === 2) { // name (string)
            const length = readVarint(buffer, pos);
            pos = length.nextPos;
            params.name = new TextDecoder().decode(buffer.slice(pos, pos + length.value));
            pos += length.value;
        } else if (fieldNumber === 3 && wireType === 2) { // issuer (string)
            const length = readVarint(buffer, pos);
            pos = length.nextPos;
            params.issuer = new TextDecoder().decode(buffer.slice(pos, pos + length.value));
            pos += length.value;
        } else if (fieldNumber === 4 && wireType === 0) { // algorithm (enum)
            const val = readVarint(buffer, pos);
            pos = val.nextPos;
            const algos = ["INVALID", "SHA1", "SHA256", "SHA512", "MD5"];
            params.algorithm = algos[val.value] || "SHA1";
        } else if (fieldNumber === 5 && wireType === 0) { // digits (enum)
            const val = readVarint(buffer, pos);
            pos = val.nextPos;
            params.digits = val.value === 1 ? 6 : (val.value === 2 ? 8 : 6);
        } else {
            pos = skipField(buffer, pos, wireType);
        }
    }
    return params;
}

function readVarint(buffer, pos) {
    let value = 0;
    let shift = 0;
    while (true) {
        const byte = buffer[pos++];
        value |= (byte & 0x7F) << shift;
        if (!(byte & 0x80)) break;
        shift += 7;
    }
    return { value, nextPos: pos };
}

function skipField(buffer, pos, wireType) {
    if (wireType === 0) { // Varint
        while (buffer[pos++] & 0x80);
    } else if (wireType === 2) { // Length-delimited
        const length = readVarint(buffer, pos);
        pos = length.nextPos + length.value;
    } else if (wireType === 1) { // 64-bit
        pos += 8;
    } else if (wireType === 5) { // 32-bit
        pos += 4;
    }
    return pos;
}
