import api from '../../lib/axios';

async function download(path: string, filename: string): Promise<void> {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const exportsApi = {
  students: () => download('/exports/students', 'students.csv'),
  modules: () => download('/exports/modules', 'modules.csv'),
  grades: () => download('/exports/grades', 'grades.csv'),
  bulletin: (studentId: number) => download(`/students/${studentId}/report`, `bulletin-${studentId}.pdf`),
};
