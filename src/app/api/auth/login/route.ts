import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { verifyUnknownPassword } from '@/lib/config';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        // Get IP (fallback to header or remoteAddress mock)
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        const allowed = await checkRateLimit(ip);
        if (!allowed) {
            return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
        }

        const { password } = await request.json();

        const isValid = await verifyUnknownPassword(password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const token = await signToken({ role: 'admin' });

        const response = NextResponse.json({ success: true });

        // Set HTTP-only cookie
        // Secure is false to allow access via IP address (http)
        // No maxAge = Session Cookie (cleared on browser close)
        response.cookies.set('server_dash_session', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
