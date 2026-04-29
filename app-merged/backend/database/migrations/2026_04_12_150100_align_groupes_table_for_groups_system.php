<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('groupes')) {
            Schema::create('groupes', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('filiere_id')->constrained('filieres')->cascadeOnDelete();
                $table->string('name');
                $table->string('label')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('groupes', function (Blueprint $table): void {
            if (! Schema::hasColumn('groupes', 'filiere_id')) {
                $table->foreignId('filiere_id')->nullable()->after('id')->constrained('filieres')->cascadeOnDelete();
            }

            if (! Schema::hasColumn('groupes', 'name')) {
                $table->string('name')->nullable()->after('filiere_id');
            }

            if (! Schema::hasColumn('groupes', 'label')) {
                $table->string('label')->nullable()->after('name');
            }
        });

        $groups = DB::table('groupes')
            ->select('id', 'niveau_id', 'filiere_id', 'name', 'label')
            ->get();

        foreach ($groups as $group) {
            $filiereId = $group->filiere_id;

            if ($filiereId === null && Schema::hasColumn('groupes', 'niveau_id') && $group->niveau_id !== null) {
                $filiereId = DB::table('niveaux')
                    ->where('id', $group->niveau_id)
                    ->value('filiere_id');
            }

            DB::table('groupes')
                ->where('id', $group->id)
                ->update([
                    'filiere_id' => $filiereId,
                    'name' => $group->name ?: ($group->label ?: 'GROUP-'.$group->id),
                    'label' => $group->label ?: ($group->name ?: 'GROUP-'.$group->id),
                ]);
        }
    }

    public function down(): void {}
};
