import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, ExternalLink, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const reportModules = import.meta.glob('../reports/*.html', {
  eager: true,
  query: '?url',
  import: 'default'
});

const buildReportList = () => {
  return Object.entries(reportModules)
    .map(([path, url]) => {
      const fileName = path.split('/').pop() || 'report.html';
      const name = fileName.replace(/\.html$/i, '');
      return { name, fileName, url };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const HtmlReportsViewer = ({ onChangeMode }) => {
  const reports = useMemo(() => buildReportList(), []);
  const [selectedReport, setSelectedReport] = useState(reports[0] || null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) => {
      return (
        report.name.toLowerCase().includes(query) ||
        report.fileName.toLowerCase().includes(query)
      );
    });
  }, [reports, searchQuery]);

  useEffect(() => {
    if (!selectedReport && filteredReports.length > 0) {
      setSelectedReport(filteredReports[0]);
      return;
    }

    if (selectedReport) {
      const stillVisible = filteredReports.some(
        (report) => report.fileName === selectedReport.fileName
      );
      if (!stillVisible) {
        setSelectedReport(filteredReports[0] || null);
      }
    }
  }, [filteredReports, selectedReport]);

  const handleReloadReports = () => {
    setReloadToken(Date.now());
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-background">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Reports</div>
              <div className="text-lg font-semibold">Metrics & dashboards</div>
            </div>
          </div>
          <Button variant="outline" onClick={onChangeMode}>
            Back to Modes
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 grid grid-cols-1 lg:grid-cols-[minmax(260px,22vw)_minmax(0,1fr)] gap-6">
        <aside className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>Reports</span>
            <button
              type="button"
              onClick={handleReloadReports}
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
              title="Reload the selected report"
            >
              <RefreshCw className="h-3 w-3" />
              Reload
            </button>
          </div>
          <div className="mt-3 relative">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search reports..."
              className="h-9 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {reports.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">
              No reports found.
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">
              No matching reports.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredReports.map((report) => (
                <button
                  key={report.fileName}
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                    selectedReport?.fileName === report.fileName
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:border-foreground/30'
                  }`}
                >
                  <div className="text-sm font-medium">{report.name}</div>
                  <div className="text-xs text-muted-foreground">{report.fileName}</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          {selectedReport ? (
            <div className="flex flex-col h-[78vh]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
                <div>
                  <div className="text-sm font-semibold">{selectedReport.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedReport.fileName}</div>
                </div>
                <a
                  href={selectedReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                >
                  Open in new tab
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <iframe
                title={selectedReport.name}
                src={`${selectedReport.url}?t=${reloadToken}`}
                className="w-full flex-1 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Select a report from the left panel to view it here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

HtmlReportsViewer.propTypes = {
  onChangeMode: PropTypes.func.isRequired
};

export default HtmlReportsViewer;
