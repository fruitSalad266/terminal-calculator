import React, { useEffect, useState } from "react"
import { GraphCanvas } from "./GraphCanvas"
import { GraphControls } from "./GraphControls"

interface GraphContainerProps {
  expression: string
  variables: Record<string, number>
}

export function GraphContainer({ expression, variables }: GraphContainerProps) {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)

  const shouldGraph = (expr: string): boolean => {
    const lower = expr.toLowerCase().trim()
    return (
      lower.includes("sin") ||
      lower.includes("cos") ||
      lower.includes("tan") ||
      lower.includes("y=") ||
      lower.includes("y =") ||
      lower.match(/\b[xy]\b/) !== null
    )
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(10, prev * 1.2))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.1, prev / 1.2))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoomLevel = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor))
    setZoomLevel(newZoomLevel)
  }

  // Reset pan offset and zoom when expression changes
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 })
    setZoomLevel(1)
  }, [expression])

  if (!expression || !shouldGraph(expression)) {
    return null
  }

  return (
    <div className="w-[600px] bg-[#0a0a0a] flex flex-col" onWheel={handleWheel}>
      <div className="bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 py-1 flex items-center justify-between">
        <span className="text-[#777] text-sm">GRAPH</span>
        <GraphControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>
      <GraphCanvas
        expression={expression}
        variables={variables}
        panOffset={panOffset}
        zoomLevel={zoomLevel}
        onPanChange={setPanOffset}
      />
    </div>
  )
}
