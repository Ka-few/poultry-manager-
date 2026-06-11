import { format } from 'date-fns';
import { Download, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import {
  currentMonthKey,
  currentMonthRange,
  getPeriodRange,
  inPeriodRange,
  PeriodFilterMode,
  todayKey,
} from '../../utils/periodRange';
import { kes, number } from '../../utils/format';

export function ReportsPage() {
  const { data } = useFarmData();
  const farmName = data.profile.farmName.trim() || 'Poultry Manager';
  const farmLocation = data.profile.farmLocation.trim() || 'Local farm';
  const [pdfStatus, setPdfStatus] = useState('');
  const [filterMode, setFilterMode] = useState<PeriodFilterMode>('month');
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [customFrom, setCustomFrom] = useState(format(currentMonthRange().from, 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(currentMonthRange().to, 'yyyy-MM-dd'));

  const reportRange = useMemo(
    () => getPeriodRange(filterMode, selectedDay, selectedMonth, customFrom, customTo),
    [customFrom, customTo, filterMode, selectedDay, selectedMonth],
  );

  const periodEggs = data.eggLogs.filter((log) => inPeriodRange(log.date, reportRange));
  const periodFeedStock = data.feedStock.filter((stock) => inPeriodRange(stock.datePurchased, reportRange));
  const periodFeedUsage = data.feedUsage.filter((usage) => inPeriodRange(usage.date, reportRange));
  const periodMortality = data.mortalityLogs.filter((log) => inPeriodRange(log.date, reportRange));
  const periodHealth = data.healthRecords.filter((record) => inPeriodRange(record.dateAdministered, reportRange));
  const periodIncome = data.income.filter((item) => inPeriodRange(item.date, reportRange));
  const periodExpenses = data.expenses.filter((item) => inPeriodRange(item.date, reportRange));
  const periodIncomeTotal = periodIncome.reduce((total, item) => total + item.amountKes, 0);
  const periodExpenseTotal = periodExpenses.reduce((total, item) => total + item.amountKes, 0);
  const periodProfit = periodIncomeTotal - periodExpenseTotal;
  const totalEggs = periodEggs.reduce((total, log) => total + log.eggsCollected, 0);
  const brokenEggs = periodEggs.reduce((total, log) => total + log.brokenEggs, 0);
  const feedPurchased = periodFeedStock.reduce((total, stock) => total + stock.quantityKg, 0);
  const feedUsed = periodFeedUsage.reduce((total, usage) => total + usage.quantityKg, 0);
  const birdsLost = periodMortality.reduce((total, log) => total + log.birdsLost, 0);

  const exportPdf = async () => {
    setPdfStatus('');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${farmName} Farm Report`, 14, 18);
    doc.setFontSize(11);
    doc.text(`${reportRange.label} | ${farmLocation}`, 14, 26);

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
        ['Income', kes.format(periodIncomeTotal)],
        ['Expenses', kes.format(periodExpenseTotal)],
        ['Profit/loss', kes.format(periodProfit)],
      ],
    });

    autoTable(doc, {
      head: [['Flock', 'Type', 'Live birds', 'Status']],
      body: data.flocks.map((flock) => [flock.batchName, flock.birdType, String(flock.quantity), flock.status]),
    });

    autoTable(doc, {
      head: [['Date', 'Health item', 'Type', 'Next due']],
      body: periodHealth.map((record) => [
        record.dateAdministered,
        record.name,
        record.recordType,
        record.nextDueDate ?? '',
      ]),
    });

    const fileName = `poultry-manager-report-${reportRange.fromKey}-to-${reportRange.toKey}.pdf`;

    if (!Capacitor.isNativePlatform()) {
      doc.save(fileName);
      setPdfStatus(`Saved ${fileName}.`);
      return;
    }

    let fileUri = '';

    try {
      const base64Data = doc.output('datauristring').split(',')[1];

      if (!base64Data) {
        throw new Error('PDF data was empty.');
      }

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      fileUri = savedFile.uri;
      setPdfStatus(`Generated ${fileName}.`);
    } catch (error) {
      console.error('Could not write PDF report.', error);
      setPdfStatus('Could not generate the PDF report. Please try again.');
      return;
    }

    try {
      const canShare = await Share.canShare();

      if (canShare.value) {
        await Share.share({
          title: `${farmName} Farm Report`,
          text: `${farmName} report for ${reportRange.label}`,
          files: [fileUri],
          dialogTitle: 'Open or share PDF report',
        });
      } else {
        setPdfStatus(`Generated ${fileName}, but sharing is not available on this device.`);
      }
    } catch (error) {
      console.error('Could not open PDF share sheet.', error);
      setPdfStatus(`Generated ${fileName}, but Android could not open the share dialog.`);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Reports"
        eyebrow={`${reportRange.label} farm report`}
        actions={
          <div className="header-actions no-print">
            <button className="secondary-button" onClick={() => window.print()}>
              <Printer size={20} aria-hidden /> Print
            </button>
            <button className="primary-button" onClick={exportPdf}>
              <Download size={20} aria-hidden /> PDF
            </button>
            {pdfStatus ? <span className="action-status">{pdfStatus}</span> : null}
          </div>
        }
      />

      <section className="report-filter no-print" aria-label="Report period filter">
        <label>
          Report period
          <select value={filterMode} onChange={(event) => setFilterMode(event.target.value as PeriodFilterMode)}>
            <option value="month">Month</option>
            <option value="day">Day</option>
            <option value="custom">Custom period</option>
          </select>
        </label>

        {filterMode === 'day' ? (
          <label>
            Day
            <input type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} />
          </label>
        ) : null}

        {filterMode === 'month' ? (
          <label>
            Month
            <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
          </label>
        ) : null}

        {filterMode === 'custom' ? (
          <>
            <label>
              From
              <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </label>
          </>
        ) : null}
      </section>

      <section className="report-sheet">
        <div className="report-title">
          <div>
            <span className="eyebrow">{farmLocation}</span>
            <h2>{farmName} Report</h2>
          </div>
          <strong>{reportRange.label}</strong>
        </div>

        <section className="report-grid">
          <article className="report-box"><span>Active flocks</span><strong>{data.flocks.filter((flock) => flock.status === 'Active').length}</strong></article>
          <article className="report-box"><span>Live birds</span><strong>{number.format(data.flocks.reduce((total, flock) => total + flock.quantity, 0))}</strong></article>
          <article className="report-box"><span>Eggs collected</span><strong>{number.format(totalEggs)}</strong></article>
          <article className="report-box"><span>Feed used</span><strong>{number.format(feedUsed)} kg</strong></article>
          <article className="report-box"><span>Birds lost</span><strong>{number.format(birdsLost)}</strong></article>
          <article className="report-box"><span>Profit/loss</span><strong>{kes.format(periodProfit)}</strong></article>
        </section>

        <section className="report-section">
          <h2>Financial Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Income</strong><span>{kes.format(periodIncomeTotal)}</span></div>
            <div className="table-row"><strong>Expenses</strong><span>{kes.format(periodExpenseTotal)}</span></div>
            <div className="table-row"><strong>Profit/loss</strong><span>{kes.format(periodProfit)}</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Production Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Eggs collected</strong><span>{number.format(totalEggs)}</span></div>
            <div className="table-row"><strong>Broken eggs</strong><span>{number.format(brokenEggs)}</span></div>
            <div className="table-row"><strong>Egg log entries</strong><span>{periodEggs.length}</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Feed Efficiency Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Feed purchased</strong><span>{number.format(feedPurchased)} kg</span></div>
            <div className="table-row"><strong>Feed consumed</strong><span>{number.format(feedUsed)} kg</span></div>
            <div className="table-row"><strong>Feed purchase records</strong><span>{periodFeedStock.length}</span></div>
          </div>
        </section>

        <section className="report-section">
          <h2>Mortality and Health Report</h2>
          <div className="table-list">
            <div className="table-row"><strong>Birds lost</strong><span>{number.format(birdsLost)}</span></div>
            <div className="table-row"><strong>Mortality records</strong><span>{periodMortality.length}</span></div>
            <div className="table-row"><strong>Vaccination/treatment records</strong><span>{periodHealth.length}</span></div>
          </div>
        </section>
      </section>
    </div>
  );
}
