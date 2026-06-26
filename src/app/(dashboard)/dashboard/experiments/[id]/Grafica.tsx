"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const COLORES = [
  { border: "rgb(59, 130, 246)", bg: "rgba(59, 130, 246, 0.1)" },
  { border: "rgb(16, 185, 129)", bg: "rgba(16, 185, 129, 0.1)" },
  { border: "rgb(245, 158, 11)", bg: "rgba(245, 158, 11, 0.1)" },
];

type Medicion = { timeHours: number; absorbance: number };

export function Grafica({ replicas }: { replicas: { replicateNum: number; measurements: Medicion[] }[] }) {
  const datasets = replicas
    .filter((r) => r.measurements.length > 0)
    .map((r, i) => {
      const sorted = [...r.measurements].sort((a, b) => a.timeHours - b.timeHours);
      const color = COLORES[i % COLORES.length];
      return {
        label: `Réplica ${r.replicateNum}`,
        data: sorted.map((m) => ({ x: m.timeHours, y: m.absorbance })),
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: false,
      };
    });

  if (datasets.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-400">Agrega mediciones para ver la gráfica</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-zinc-200 p-4 md:p-6">
      <h3 className="font-semibold text-zinc-900 mb-4 text-sm">Absorbancia vs Tiempo</h3>
      <div className="relative">
        <Line
          data={{
            datasets,
          }}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.8,
            interaction: { mode: "nearest", axis: "x", intersect: false },
            plugins: {
              legend: {
                position: "top",
                labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const p = ctx.parsed as { x: number; y: number };
                    return `${ctx.dataset.label}: t=${p.x}h, A=${p.y}`;
                  },
                },
              },
            },
            scales: {
              x: {
                type: "linear",
                title: { display: true, text: "Tiempo (h)", font: { size: 11 } },
                grid: { color: "rgba(0,0,0,0.06)" },
              },
              y: {
                title: { display: true, text: "Absorbancia", font: { size: 11 } },
                grid: { color: "rgba(0,0,0,0.06)" },
                beginAtZero: false,
              },
            },
          }}
        />
      </div>
    </div>
  );
}
