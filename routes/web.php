<?php

use Illuminate\Support\Facades\Route;

// Game — serves at /
Route::get('/', function () {
    return view('game');
})->name('game');

// Serve Spine character assets with correct MIME type and caching headers
Route::get('/spine/characters/{file}', function ($file) {
    $path = public_path("spine/characters/{$file}");

    if (! file_exists($path)) {
        abort(404);
    }

    $extension = pathinfo($file, PATHINFO_EXTENSION);
    $mimeTypes = [
        'atlas' => 'text/plain',
        'json'  => 'application/json',
        'png'   => 'image/png',
    ];

    return response()->file($path, [
        'Content-Type'  => $mimeTypes[$extension] ?? 'application/octet-stream',
        'Cache-Control' => 'public, max-age=3600',
    ]);
})->where('file', '.*');
