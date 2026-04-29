<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    public function created(Model $model)
    {
        $this->log('CREATE', $model);
    }

    public function updated(Model $model)
    {
        $this->log('UPDATE', $model);
    }

    public function deleted(Model $model)
    {
        $this->log('DELETE', $model);
    }

    protected function log(string $action, Model $model)
    {
        $oldValues = $action === 'UPDATE' ? array_intersect_key($model->getOriginal(), $model->getDirty()) : null;
        $newValues = $action === 'CREATE' ? $model->getAttributes() : ($action === 'UPDATE' ? $model->getDirty() : null);

        // Security: Don't log passwords
        if (isset($newValues['password'])) {
            unset($newValues['password']);
        }
        if (isset($oldValues['password'])) {
            unset($oldValues['password']);
        }

        AuditLog::log(
            $action,
            get_class($model),
            $model->id,
            $oldValues,
            $newValues
        );
    }
}
