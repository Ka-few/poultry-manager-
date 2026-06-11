import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import { Download, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { getFinanceSummary } from '../../services/farmAnalytics';
import { kes, number } from '../../utils/format';

function currentMonthRange() {
  const now = new Date();
  return {
    from: startOfMonth(now),
    to: endOfMonth(now),
    label: format(now, 'MMMM yyyy'),
  };
}

function inCurrentMonth(date: string) {
  const { from, to } = currentMonthRange();
  const value = parseISO(date);
  return value >= from && value <= to;
}

export function ReportsPage() {
  const { data } = useFarmData();
  const reportMonth = currentMonthRange().label;
  const monthlyEggs = data.eggLogs.filter((log) => inCurrentMonth(log.date));
  const monthlyFeedStock = data.feedStock.filter((stock) => inCurrentMonth(stock.datePurchased));
  const monthlyFeedUsage = data.feedUsage.filter((usage) => inCurrentMonth(usage.date));
  const monthlyMortality = data.mortalityLogs.filter((log) => inCurrentMonth(log.date));
  const monthlyHealth = data.healthRecords.filter((record) => inCurrentMonth(record.dateAdministered));
  const finance = getFinanceSummary(data.income, data.expenses);
  const totalEggs = monthlyEggs.reduce((total, log) => total + log.eggsCollected, 0);
  const brokenEggs = monthlyEggs.reduce((total, log) => total + log.brokenEggs, 0);
  const feedPurchased = monthlyFeedStock.reduce((total, stock) => total + stock.quantityKg, 0);
  const feedUsed = monthlyFeedUsage.reduce((total, usage) => total + usage.quantityKg, 0);
  const birdsLost = monthlyMortality.reduce((total, log) => total + log.birdsLost, 0);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${data.profile.farmName} Farm Report`, 14, 18);
    doc.setFontSize(11);
    doc.text(`${reportMonth} | ${data.profile.farmLocation}`, 14, 26);

    autoTable(doc, {
      startY: 34,
      head: [['Metric', 'Value']],
      body: [
        ['Active flocks', String(data.flocks.filter((flock) => flock.status === 'Active').length)],
        ['Total live birds', number.format(data.flocks.reduce((total, flock) => total + flock.quantity, 0))],
        ['Eggs collected', number.format(totalEggs)],
        ['Broken eggs', number.format(brokenEggs)],
        ['Feed purchased', `${number.format(feedPurchased)} kg`],
        ['Feed consumed', `${number.format(feedUsed)} kg`],
        ['Birds lost', number.format(birdsLost)],
        ['Income', kes.format(finance.monthlyIncome)],
        ['Expenses', kes.format(finance.monthlyExpenses)],
        ['Profit/loss', kes.format(finance.monthlyProfit)],
      ],
    });

    autoTable(doc, {
      head: [['Flock', 'Type', 'Live birds', 'Status']],
      body: data.flocks.map((flock) => [flock.batchName, flock.birdType, String(flock.quantity), flock.status]),
    });

    autoTable(doc, {
      head: [['Date', 'Health item', 'Type', 'Next due']],
      body: monthlyHealth.map((record) => [
        record.dateAdministered,
        record.name,
        record.recordType,
        record.nextDueDate ?? '',
      ]),
    });

    doc.save(`poultry-manager-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Reports"
        eyebrow={`${reportMonth} farm report`}
        actions={
          <div className="header-actions no-print">
            <button className="secondary-button" onClick={() => window.print()}>
              <Printer size={20} aria-hidden /> Print
            </button>
            <button className="primary-button" onClick={exportPdf}>
              <Download size={20} aria-hidden /> PDF
            </button>
          </div>
        }
      />

      <section className="report-sheet">
        <div className="report-title">
          <div>
            <span className="eyebrow">{data.profile.farmLocation}</span>
            <h2>{data.profile.farmName} Report</h2>
          </div>
          <strong>{reportMonth}</strong>
        </div>

        <section className="report-grid">
          <article className="report-box"><span>Active flocks</span><strong>{data.flocks.filter((flock) => flock.status === 'Active').length}</strong></article>
          <article className="report-box"><span>Live birds</span><strong>{number.format(data.flocks.reduce((total, flock) => total + flock.quantity, 0))}</strong></article>
          <article className="report-box"><span>Eggs collected</span><strong>{number.format(totalEggs)}</strong></article>
          <article className="report-box"><span>Feed used</span><strong>{number.format(feedUsed)} kg</strong></article>
          <article className="report-box"><span>Birds lost</span><strong>{number.format(birdsLost)}</strong></article>
          <article className="report-box"><span>Profit/loss</span><strong>{kes.format(finance.monthlyProfit)}</strong></article>
        </section>

        <section className="report-section">
          <h2>Financial Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Income</strong><span>{kes.format(finance.monthlyIncome)}</span></div>
            <div className="table-row"><strong>Expenses</strong><span>{kes.format(finance.monthlyExpenses)}</span></div>
            <div className="table-row"><strong>Profit/loss</strong><span>{kes.format(finance.monthlyProfit)}</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Production Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Eggs collected</strong><span>{number.format(totalEggs)}</span></div>
            <div className="table-row"><strong>Broken eggs</strong><span>{number.format(brokenEggs)}</span></div>
            <div className="table-row"><strong>Egg log entries</strong><span>{monthlyEggs.length}</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Feed Efficiency Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Feed purchased</strong><span>{number.format(feedPurchased)} kg</span></div>
            <div className="table-row"><strong>Feed consumed</strong><span>{number.format(feedUsed)} kg</span></div>
            <div className="table-row"><strong>Feed purchase records</strong><span>{monthlyFeedStock.length}</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Mortality and Health Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Birds lost</strong><span>{number.format(birdsLost)}</span></div>
            <div className="table-row"><strong>Mortality records</strong><span>{monthlyMortality.length}</span></div>
            <div className="table-row"><strong>Vaccination/treatment records</strong><span>{monthlyHealth.length}</span></div>
          </div>
        </section>
      </section>
    </div>
  );
}
