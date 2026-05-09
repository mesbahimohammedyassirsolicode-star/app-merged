import { Button } from '../components/ui/button';
import { exportsApi } from '../api/api/exports';

export default function DataExportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Data Exports</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <h2 className="font-semibold">Students CSV</h2>
          <Button onClick={() => exportsApi.students()}>Export Students</Button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <h2 className="font-semibold">Grades CSV</h2>
          <Button onClick={() => exportsApi.grades()}>Export Grades</Button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <h2 className="font-semibold">Modules CSV</h2>
          <Button onClick={() => exportsApi.modules()}>Export Modules</Button>
        </div>
      </div>
    </div>
  );
}
