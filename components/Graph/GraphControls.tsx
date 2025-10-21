import React from "react"

interface GraphControlsProps {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

export function GraphControls({ zoomLevel, onZoomIn, onZoomOut, onResetZoom }: GraphControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onZoomOut}
        className="text-xs text-[#666] hover:text-[#e0e0e0] transition-colors px-2 py-1 border border-[#333] rounded"
      >
        −
      </button>
      <span className="text-xs text-[#666] min-w-[60px] text-center">
        {zoomLevel.toFixed(1)}x
      </span>
      <button
        onClick={onZoomIn}
        className="text-xs text-[#666] hover:text-[#e0e0e0] transition-colors px-2 py-1 border border-[#333] rounded"
      >
        +
      </button>
      <button
        onClick={onResetZoom}
        className="text-xs text-[#666] hover:text-[#e0e0e0] transition-colors px-2 py-1 border border-[#333] rounded ml-2"
      >
        RESET
      </button>
    </div>
  )
}
