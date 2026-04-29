<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bulletin de Notes - GIMS</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .student-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; }
        .footer { margin-top: 50px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Bulletin de Notes</h1>
        <p>GIMS - School Management System</p>
    </div>

    <div class="student-info">
        <p><strong>Étudiant :</strong> {{ $student->user->name }}</p>
        <p><strong>Filière :</strong> {{ $student->filiere->nom ?? 'N/A' }}</p>
        <p><strong>Groupe :</strong> {{ $student->groupe->nom ?? 'N/A' }}</p>
    </div>

    <h3>Notes des Modules</h3>
    <table>
        <thead>
            <tr>
                <th>Module</th>
                <th>Note (/20)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($notes as $note)
            <tr>
                <td>{{ $note->module->nom ?? 'N/A' }}</td>
                <td>{{ $note->valeur }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h3>Résumé des Absences</h3>
    <p>Total des absences enregistrées : {{ $absences->count() }}</p>

    <div class="footer">
        <p>Fait le {{ $date }}</p>
        <p>Sceau de l'établissement</p>
    </div>
</body>
</html>
