<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->away(rtrim(config('app.frontend_url'), '/').'/login');
});
