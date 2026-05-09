<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AI Assistant Export</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #0f172a; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .muted { color: #64748b; margin-bottom: 16px; }
        .section { margin-bottom: 16px; }
        .label { font-weight: bold; margin-bottom: 6px; }
        ul { margin: 0; padding-left: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
        th { background: #f1f5f9; }
    </style>
</head>
<body>
    <h1>AI Assistant Report</h1>
    <p class="muted">Generated at: {{ $generatedAt }}</p>

    <div class="section">
        <div class="label">Summary</div>
        <div>{{ $summary }}</div>
    </div>

    <div class="section">
        <div class="label">Insights</div>
        <ul>
            @forelse($insights as $insight)
                <li>{{ $insight }}</li>
            @empty
                <li>No insights available.</li>
            @endforelse
        </ul>
    </div>

    <div class="section">
        <div class="label">Data</div>
        @if(count($rows) === 0)
            <p>No tabular data available.</p>
        @else
            <table>
                <thead>
                    <tr>
                        @foreach(array_keys($rows[0]) as $column)
                            <th>{{ $column }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @foreach($rows as $row)
                        <tr>
                            @foreach(array_keys($rows[0]) as $column)
                                <td>{{ $row[$column] ?? '-' }}</td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    </div>
</body>
</html>
