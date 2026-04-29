<!DOCTYPE html>
<html>
<head>
    <title>Alerte de note basse</title>
</head>
<body>
    <h1>Bonjour {{ $user->name }},</h1>
    <p>Une note basse a été enregistrée pour l'étudiant <strong>{{ $user->name }}</strong>.</p>
    <p><strong>Détails :</strong></p>
    <ul>
        <li>Module : {{ $note->module->nom ?? 'N/A' }}</li>
        <li>Note : {{ $note->valeur }}/20</li>
    </ul>
    <p>Nous vous encourageons à discuter de ces résultats avec l'étudiant pour identifier les points d'amélioration.</p>
    <p>Cordialement,<br>L'administration GIMS</p>
</body>
</html>
