<?php

namespace App\Traits;

use App\Observers\AuditObserver;

trait Auditable
{
    public static function bootAuditable()
    {
        static::observe(AuditObserver::class);
    }

    /**
     * Get the fields that should be audited.
     */
    public function getAuditAttributes(): array
    {
        return $this->getDirty();
    }
}
