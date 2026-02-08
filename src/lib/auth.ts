import bcrypt from 'bcryptjs';
import { signToken, verifyToken } from './jwt';

export { signToken, verifyToken };

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}
