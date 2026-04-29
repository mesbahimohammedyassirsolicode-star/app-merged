<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('attendances')) {
            return;
        }

        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'filiere_id')) {
                $table->foreignId('filiere_id')->nullable()->after('group_id')->constrained('filieres')->nullOnDelete();
            }
            if (! Schema::hasColumn('attendances', 'formateur_id')) {
                $table->foreignId('formateur_id')->nullable()->after('teacher_id')->constrained('formateurs')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('attendances', 'filiere_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->index('filiere_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('attendances')) {
            return;
        }

        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'formateur_id')) {
                $table->dropConstrainedForeignId('formateur_id');
            }
            if (Schema::hasColumn('attendances', 'filiere_id')) {
                $table->dropConstrainedForeignId('filiere_id');
            }
        });
    }
};
