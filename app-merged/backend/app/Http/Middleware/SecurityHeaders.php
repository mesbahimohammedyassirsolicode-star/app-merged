<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // FIXED: Added Content-Security-Policy to prevent XSS.
        // 'unsafe-inline' kept for styles because Tailwind/shadcn inject inline styles;
        // tighten further by nonce-based CSP once a build-time nonce is configured.
        $frontendOrigin = config('app.frontend_url', 'http://localhost:5173');
        $response->headers->set('Content-Security-Policy',
            "default-src 'self'; ".
            "script-src 'self'; ".
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ".
            "font-src 'self' https://fonts.gstatic.com; ".
            "img-src 'self' data: blob:; ".
            "connect-src 'self' {$frontendOrigin}; ".
            "frame-ancestors 'none';"
        );

        // FIXED: HSTS header forces HTTPS. Set a short max-age in dev; 1 year in prod.
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // FIXED: Permissions-Policy disables unnecessary browser features.
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        // Kept from original:
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY'); // FIXED: was SAMEORIGIN; DENY is stricter for an API
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return $response;
    }
}
