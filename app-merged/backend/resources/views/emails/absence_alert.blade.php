<!DOCTYPE html>
<html>
<head>
    <title>Alerte d'absence</title>
</head>
<body>
    <h1>Bonjour {{ $user->name }},</h1>
    <p>Une absence a été enregistrée pour l'étudiant <strong>{{ $absence->stagiaire->user->name ?? 'N/A' }}</strong>.</p>
    <p><strong>Détails de la séance :</strong></p>
    <ul>
        <li>Date : {{ $absence->seance->date ?? 'N/A' }}</li>
        <li>Module : {{ $absence->seance->module->nom ?? 'N/A' }}</li>
    </ul>
    <p>Merci de prendre les mesures nécessaires.</p>
    <p>Cordialement,<br>L'administration GIMS</p>
</body>
</html>
