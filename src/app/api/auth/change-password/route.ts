import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyUnknownPassword, updateAdminPassword } from '@/lib/config';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Authentication
        const token = request.cookies.get('auth_token')?.value;
        if (!token || !(await verifyToken(token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (newPassword.length < 4) {
            return NextResponse.json({ error: 'New password must be at least 4 characters' }, { status: 400 });
        }

        // 2. Verify Old Password
        const isValid = await verifyUnknownPassword(currentPassword);
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
        }

        // 3. Update Password
        await updateAdminPassword(newPassword);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
