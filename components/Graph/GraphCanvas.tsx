import React, { useEffect, useRef, useState } from "react"
import { evaluate } from "mathjs"

interface GraphCanvasProps {
  expression: string
  variables: Record<string, number>
  panOffset: { x: number; y: number }
  zoomLevel: number
  onPanChange: (offset: { x: number; y: number }) => void
}

export function GraphCanvas({ expression, variables, panOffset, zoomLevel, onPanChange }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null)

  const replaceVariables = (expr: string): string => {
    let result = expr
    for (const [varName, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\b${varName}\\b`, "g")
      result = result.replace(pattern, String(value))
    }
    return result
  }

  const calculateYFromX = (x: number, expr: string): number | null => {
    try {
      let evalExpr = expr
        .toLowerCase()
        .replace(/y\s*=\s*/, "")
        .trim()
      
      // Replace custom variables
      evalExpr = replaceVariables(evalExpr)
      
      const exprWithX = evalExpr.replace(/x/g, `(${x})`)
      const y = evaluate(exprWithX)
      if (typeof y === "number" && isFinite(y)) {
        return y
      }
    } catch (e) {
      // Invalid expression
    }
    return null
  }

  const drawGraph = (expr: string, offsetX: number, offsetY: number, hoverPt: { x: number; y: number } | null = null) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Calculate view bounds with pan offset and zoom
    const baseRange = 10 / zoomLevel
    const xMin = -baseRange + offsetX
    const xMax = baseRange + offsetX
    const yMin = -baseRange + offsetY
    const yMax = baseRange + offsetY

    // Clear canvas
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Calculate axis positions based on offset
    // X-axis is at y=0, Y-axis is at x=0
    const xAxisY = height - ((0 - yMin) / (yMax - yMin)) * height
    const yAxisX = ((0 - xMin) / (xMax - xMin)) * width

    // Draw axes
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(0, xAxisY)
    ctx.lineTo(width, xAxisY)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(yAxisX, 0)
    ctx.lineTo(yAxisX, height)
    ctx.stroke()

    // Plot function
    ctx.strokeStyle = "#4a9eff"
    ctx.lineWidth = 2
    ctx.beginPath()

    let firstPoint = true
    const step = (xMax - xMin) / width

    // Prepare expression for evaluation
    let evalExpr = expr
      .toLowerCase()
      .replace(/y\s*=\s*/, "")
      .trim()
    
    // Replace custom variables
    evalExpr = replaceVariables(evalExpr)

    for (let px = 0; px < width; px++) {
      const x = xMin + px * step
      try {
        // Replace x with actual value
        const exprWithX = evalExpr.replace(/x/g, `(${x})`)
        const y = evaluate(exprWithX)

        if (typeof y === "number" && isFinite(y)) {
          // Convert to canvas coordinates
          const canvasX = px
          // Map y from [yMin, yMax] to canvas [height, 0] (inverted because canvas y increases downward)
          const canvasY = height - ((y - yMin) / (yMax - yMin)) * height

          if (firstPoint) {
            ctx.moveTo(canvasX, canvasY)
            firstPoint = false
          } else {
            ctx.lineTo(canvasX, canvasY)
          }
        }
      } catch (e) {
        // Skip invalid points
      }
    }

    ctx.stroke()

    // Draw hover dot if hovering
    if (hoverPt) {
      const canvasX = ((hoverPt.x - xMin) / (xMax - xMin)) * width
      const canvasY = height - ((hoverPt.y - yMin) / (yMax - yMin)) * height
      
      ctx.fillStyle = "#4a9eff"
      ctx.beginPath()
      ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI)
      ctx.fill()
      
      // Draw inner white dot
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw axis labels and scale numbers
    ctx.fillStyle = "#666"
    ctx.font = "11px monospace"
    
    // Origin label at (0, 0) if visible
    if (xAxisY >= 0 && xAxisY <= height && yAxisX >= 0 && yAxisX <= width) {
      ctx.fillText("0", yAxisX + 4, xAxisY - 4)
    }
    
    // X-axis labels - adjust based on zoom level
    const xLabelStep = Math.max(1, Math.ceil(baseRange / 5))
    const xLabelValues = []
    for (let i = -Math.ceil(baseRange); i <= Math.ceil(baseRange); i += xLabelStep) {
      xLabelValues.push(i)
    }
    xLabelValues.forEach(val => {
      const actualVal = val + offsetX
      const xPos = width / 2 + ((val) * width) / (xMax - xMin)
      if (xAxisY >= 0 && xAxisY <= height) {
        ctx.fillText(String(Math.round(actualVal * 100) / 100), xPos - 12, xAxisY + 14)
      }
    })
    
    // Y-axis labels - adjust based on zoom level
    const yLabelStep = Math.max(1, Math.ceil(baseRange / 5))
    const yLabelValues = []
    for (let i = -Math.ceil(baseRange); i <= Math.ceil(baseRange); i += yLabelStep) {
      yLabelValues.push(i)
    }
    yLabelValues.forEach(val => {
      const actualVal = val + offsetY
      const yPos = height / 2 - ((val) * height) / (yMax - yMin)
      if (yAxisX >= 0 && yAxisX <= width) {
        ctx.fillText(String(Math.round(actualVal * 100) / 100), yAxisX + 8, yPos + 4)
      }
    })
    
    // Axis names
    if (xAxisY >= 0 && xAxisY <= height) {
      ctx.fillText("x", width - 20, xAxisY - 8)
    }
    if (yAxisX >= 0 && yAxisX <= width) {
      ctx.fillText("y", yAxisX + 8, 16)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      
      // Convert pixel movement to graph units (adjusted for zoom)
      const baseRange = 10 / zoomLevel
      const graphDx = -(dx / canvas.width) * (baseRange * 2)
      const graphDy = (dy / canvas.height) * (baseRange * 2)
      
      onPanChange({
        x: panOffset.x + graphDx,
        y: panOffset.y + graphDy
      })
      
      setDragStart({ x: e.clientX, y: e.clientY })
    } else {
      // Calculate hover position
      const rect = canvas.getBoundingClientRect()
      const canvasX = e.clientX - rect.left
      
      // Convert canvas x to graph x
      const baseRange = 10 / zoomLevel
      const xMin = -baseRange + panOffset.x
      const xMax = baseRange + panOffset.x
      
      const graphX = xMin + (canvasX / canvas.width) * (xMax - xMin)
      const graphY = calculateYFromX(graphX, expression)
      
      if (graphY !== null) {
        setHoverPoint({ x: graphX, y: graphY })
      } else {
        setHoverPoint(null)
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoverPoint(null)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    // Wheel handling will be managed by parent component
  }

  useEffect(() => {
    if (expression) {
      drawGraph(expression, panOffset.x, panOffset.y, hoverPoint)
    }
  }, [expression, panOffset, hoverPoint, variables, zoomLevel])

  return (
    <div className="flex-1 flex flex-col p-1 overflow-auto">
      <div className="flex-1 flex items-center justify-center flex-shrink-0 px-2">
        <canvas 
          ref={canvasRef} 
          width={570} 
          height={520} 
          className={`border border-[#1a1a1a] w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />
      </div>
      <div className="mt-2 mx-2 border border-[#1a1a1a] bg-[#0f0f0f] px-3 py-2 flex-shrink-0">
        <div className="text-[#777] text-xs mb-1">DOT POSITION</div>
        <div className="text-[#e0e0e0] text-sm font-mono">
          {hoverPoint ? (
            <>
              <span className="text-[#4a9eff]">x:</span> {hoverPoint.x.toFixed(3)}
              <span className="ml-4 text-[#4a9eff]">y:</span> {hoverPoint.y.toFixed(3)}
            </>
          ) : (
            <span className="text-[#666]">hover over graph</span>
          )}
        </div>
      </div>
    </div>
  )
}
