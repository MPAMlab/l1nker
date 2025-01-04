import { Env } from '../types';
export async function hashPassword(
    password: string,
    env: Env,
    providedSalt?: Uint8Array,
): Promise<string> {
    const encoder = new TextEncoder();
    // Use provided salt if available, otherwise generate a new one
    const salt = providedSalt || crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey'],
    );
    // 使用 deriveBits 而不是 deriveKey 来导出原始的 PBKDF2 密钥
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        256, // 指定需要的密钥长度
    );
    const hashBuffer = new Uint8Array(derivedBits);
    const hashArray = Array.from(hashBuffer);
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const saltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(
    passwordAttempt: string,
    storedHash: string,
    env: Env,
): Promise<boolean> {
    const [saltHex, originalHash] = storedHash.split(':');
    if (!saltHex || !originalHash) {
        return false;
    }
    const salt = saltHex.match(/.{1,2}/g)?.reduce((acc, byte) => {
        acc.push(parseInt(byte, 16));
        return acc;
    }, [] as number[]);
    if (!salt) {
        throw new Error('Invalid salt format');
    }
    const attemptHashWithSalt = await hashPassword(passwordAttempt, env, new Uint8Array(salt));
    const [, attemptHash] = attemptHashWithSalt.split(':');
    return attemptHash === originalHash;
}
