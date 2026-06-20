import React from 'react';
import { useTable, usePagination } from 'react-table';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';

interface AnalyticsTableProps {
  data: any[];
  loading: boolean;
  columns: any[];
}

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({ data, loading, columns }) => {
  const resolvedColumns = React.useMemo(() => {
    if (columns && columns.length > 0) {
      return columns;
    }

    const sample = data?.[0];
    if (!sample || typeof sample !== 'object') {
      return [];
    }

    return Object.keys(sample).map((key) => ({
      Header: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      accessor: key,
    }));
  }, [columns, data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
      {
      columns: resolvedColumns,
      data,
      initialState: { pageIndex: 0 },
    },
    usePagination
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (data.length === 0) {
    return <EmptyState message="Aucune donnee disponible pour ces filtres." />;
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-[var(--analytics-border)] bg-[var(--analytics-card)]">
      <table {...getTableProps()} className="min-w-full border-collapse">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()} className="bg-[var(--analytics-surface-soft)]">
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()} className="border-b border-[var(--analytics-border)] px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[var(--analytics-text-soft)]">
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className="border-b border-[var(--analytics-border)] transition-colors hover:bg-[var(--analytics-surface-soft)]">
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()} className="px-4 py-3 text-sm text-[var(--analytics-text)]">
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-col gap-4 border-t border-[var(--analytics-border)] bg-[var(--analytics-surface-soft)] px-4 py-4 text-sm text-[var(--analytics-text-soft)] md:flex-row md:items-center md:justify-between">
        <span>
          Page{' '}
          <strong className="text-[var(--analytics-text)]">
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button className="analytics-button analytics-button-secondary !px-3 !py-2" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {'<<'}
          </button>{' '}
          <button className="analytics-button analytics-button-secondary !px-3 !py-2" onClick={() => previousPage()} disabled={!canPreviousPage}>
            {'<'}
          </button>{' '}
          <button className="analytics-button analytics-button-secondary !px-3 !py-2" onClick={() => nextPage()} disabled={!canNextPage}>
            {'>'}
          </button>{' '}
          <button className="analytics-button analytics-button-secondary !px-3 !py-2" onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage}>
            {'>>'}
          </button>
        </div>
        <select
          className="analytics-table-select"
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AnalyticsTable;
