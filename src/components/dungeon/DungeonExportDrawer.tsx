"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import DungeonMapView from "./DungeonMapView";
import type { DungeonDetail } from "../../types/dungeon";
import type { DungeonType } from "../../lib/dungeon-textures";

type ExportFormat = "svg" | "png" | "pdf" | "json";
type ViewMode = "dm" | "player";

interface DungeonExportDrawerProps {
  open: boolean;
  dungeon: DungeonDetail;
  onClose: () => void;
  pushToast?: (message: string, variant?: "success" | "error" | "info") => void;
}

export default function DungeonExportDrawer({
  open,
  dungeon,
  onClose,
  pushToast,
}: DungeonExportDrawerProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("svg");
  const [viewMode, setViewMode] = useState<ViewMode>("dm");
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [levelIndex, setLevelIndex] = useState(0);
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    setSvgElement(null);
  }, [levelIndex, showGrid, showLabels, viewMode]);

  useEffect(() => {
    if (!open) {
      setExporting(false);
    }
  }, [open]);

  useEffect(() => {
    if (viewMode === "player") {
      setShowLabels(false);
    }
  }, [viewMode]);
  useEffect(() => {
    if (viewMode === "player" && showLabels) {
      setShowLabels(false);
    }
  }, [showLabels, viewMode]);

  const currentLevel = dungeon.structure.levels[levelIndex];

  const filenameBase = useMemo(() => {
    const safeName = dungeon.identity.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return `${safeName || "dungeon"}-l${levelIndex + 1}-${viewMode}`;
  }, [dungeon.identity.name, levelIndex, viewMode]);

  const handleExport = async () => {
    if (!svgElement && selectedFormat !== "json") {
      pushToast?.("Preparing map for export...", "info");
      return;
    }
    setExporting(true);
    try {
      const clone = svgElement ? cloneSvg(svgElement) : null;
      switch (selectedFormat) {
        case "svg":
          await exportSvg(clone!, filenameBase);
          break;
        case "png":
          await exportPng(clone!, filenameBase);
          break;
        case "pdf":
          await exportPdf(clone!, filenameBase);
          break;
        case "json":
          await exportJson(dungeon, levelIndex, filenameBase);
          break;
      }
      pushToast?.("Export complete", "success");
      onClose();
    } catch (error) {
      pushToast?.(
        error instanceof Error ? `Export failed: ${error.message}` : "Export failed",
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-gray-800 bg-gray-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Export Dungeon</h2>
            <p className="text-sm text-gray-500">{dungeon.identity.name}</p>
          </div>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-200">
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-200">Format</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(["svg", "png", "pdf", "json"] as ExportFormat[]).map((format) => (
                <label
                  key={format}
                  className={`flex items-center gap-2 rounded border px-3 py-2 ${
                    selectedFormat === format ? "border-blue-500 bg-blue-500/20" : "border-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="export-format"
                    checked={selectedFormat === format}
                    onChange={() => setSelectedFormat(format)}
                    className="h-4 w-4 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  {format.toUpperCase()}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-200">View Mode</h3>
            <div className="flex gap-3 text-sm">
              {(["dm", "player"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 rounded border px-3 py-2 ${
                    viewMode === mode ? "border-blue-500 bg-blue-500/20 text-white" : "border-gray-800 text-gray-300"
                  }`}
                >
                  {mode === "dm" ? "DM View" : "Player View"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-300">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                />
                Grid
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                  disabled={viewMode === "player"}
                />
                Labels
              </label>
              <label className="flex items-center gap-2">
                <span>Level:</span>
                <select
                  value={levelIndex}
                  onChange={(e) => setLevelIndex(Number.parseInt(e.target.value, 10))}
                  className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs focus:border-blue-500"
                >
                  {dungeon.structure.levels.map((lvl, idx) => (
                    <option key={lvl.level_index} value={idx}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? "Exporting…" : "Export"}
          </button>

          <p className="text-xs text-gray-500">
            Exports run locally in your browser. Larger maps may take a few seconds to process.
          </p>
        </div>
      </div>

      {/* Hidden renderer */}
      <div className="fixed -left-[2000px] -top-[2000px] h-0 w-0 overflow-hidden">
        <DungeonMapView
          level={currentLevel}
          cellSize={24}
          showGrid={showGrid}
          showLabels={showLabels}
          interactive={false}
          onSvgReady={setSvgElement}
          dungeonType={dungeon.identity.type as DungeonType}
          showControls={false}
        />
      </div>
    </>
  );
}

function cloneSvg(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const { width, height } = getSvgDimensions(svg);
  clone.setAttribute("width", width.toString());
  clone.setAttribute("height", height.toString());
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return clone;
}

function getSvgDimensions(svg: SVGSVGElement) {
  const viewBox = svg.viewBox.baseVal;
  if (viewBox && viewBox.width && viewBox.height) {
    return { width: viewBox.width, height: viewBox.height };
  }
  return {
    width: svg.width.baseVal.value || svg.getBoundingClientRect().width,
    height: svg.height.baseVal.value || svg.getBoundingClientRect().height,
  };
}

async function exportSvg(svg: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `${filename}.svg`);
}

async function exportPng(svg: SVGSVGElement, filename: string) {
  const canvas = await svgToCanvas(svg);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  if (!blob) {
    throw new Error("Failed to create PNG");
  }
  downloadBlob(blob, `${filename}.png`);
}

async function exportPdf(svg: SVGSVGElement, filename: string) {
  const canvas = await svgToCanvas(svg);
  const { width, height } = getSvgDimensions(svg);
  const imgData = canvas.toDataURL("image/png");
  const doc = new jsPDF({
    orientation: width >= height ? "landscape" : "portrait",
    unit: "pt",
    format: [width, height],
  });
  doc.addImage(imgData, "PNG", 0, 0, width, height);
  doc.save(`${filename}.pdf`);
}

async function exportJson(dungeon: DungeonDetail, levelIndex: number, filename: string) {
  const json = JSON.stringify({ dungeon, level_index: levelIndex }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

async function svgToCanvas(svg: SVGSVGElement): Promise<HTMLCanvasElement> {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  const { width, height } = getSvgDimensions(svg);
  image.width = width;
  image.height = height;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to acquire canvas context");
  }
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(url);
  return canvas;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

