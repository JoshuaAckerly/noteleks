<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $isDev = app()->environment('local', 'testing');

        // Content Security Policy
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.jsdelivr.net".($isDev ? ' http://localhost:* http://*.graveyardjokes.local:*' : ''),
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
            "font-src 'self' https://fonts.bunny.net",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://graveyardjokes.com https://www.graveyardjokes.com https://www.google-analytics.com https://region1.google-analytics.com".($isDev ? ' http://localhost:* ws://localhost:* http://*.graveyardjokes.local:* ws://*.graveyardjokes.local:*' : ''),
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            ...($isDev ? [] : ['upgrade-insecure-requests']),
        ]);

        $response->headers->set('Content-Security-Policy', $csp);
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');
        $response->headers->remove('X-Powered-By');

        if (! $isDev) {
            $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
