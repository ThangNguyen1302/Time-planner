"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

// Types for Live2D
type Live2DModelType = {
  from: (source: string, options?: Record<string, unknown>) => Promise<unknown>
  destroy: () => void
  scale: { set: (x: number, y?: number) => void }
  anchor: { set: (x: number, y?: number) => void }
  x: number
  y: number
  width: number
  height: number
  on: (event: string, callback: (hitAreas: string[]) => void) => void
  motion: (name: string) => boolean
  expression: (name: string) => void
  internalModel?: {
    motionManager?: unknown
    coreModel?: {
      setParameterValueById?: (id: string, value: number) => void
    }
  }
}

// Lazy load PIXI and Live2D only on client
let PIXI: typeof import("pixi.js") | null = null
let Live2DModel: { from: (source: string, options?: Record<string, unknown>) => Promise<Live2DModelType> } | null = null
let isInitialized = false

async function initializeLive2D() {
  if (isInitialized || typeof window === "undefined") return
  
  try {
    PIXI = await import("pixi.js")
    
    // @ts-expect-error - PIXI global assignment for Live2D
    window.PIXI = PIXI
    
    // Import Cubism 4 SDK for .moc3 models
    const { Live2DModel: L2DModel } = await import("pixi-live2d-display/cubism4")
    Live2DModel = L2DModel as typeof Live2DModel
    
    isInitialized = true
  } catch (error) {
    console.error("Failed to initialize Live2D:", error)
    throw error
  }
}

export type Live2DExpression = 
  | "neutral" 
  | "happy" 
  | "sad" 
  | "angry" 
  | "surprised" 
  | "thinking"
  | "shy"      // Huohuo: xấu hổ khi được khen
  | "scared"   // Huohuo: sợ hãi khi gặp khó khăn

export type Live2DFitMode = "contain" | "cover"
export type Live2DMotionPreload = "NONE" | "IDLE" | "ALL"

export interface Live2DModelProps {
  modelPath: string
  className?: string
  width?: number
  height?: number
  expression?: Live2DExpression
  isSpeaking?: boolean
  fitMode?: Live2DFitMode
  focusY?: number
  motionPreload?: Live2DMotionPreload
  triggerMotion?: string | null  // Trigger một motion group cụ thể
  emotionIntensity?: number       // 0-1, cường độ cảm xúc để điều chỉnh animation
  onModelLoaded?: () => void
  onError?: (error: Error) => void
  onMotionTriggered?: () => void  // Callback khi motion được trigger
}

// Expression (exp3) names to try per mood.
// These should match Names in the model3.json Expressions array.
// Huohuo model has: angry, baozhen, cry, qizi1, qizi2, white_eyes
const expressionNameMap: Record<Live2DExpression, string[]> = {
  neutral: ["neutral", "baozhen"],  // baozhen as neutral fallback
  happy: ["baozhen", "qizi1", "qizi2"],  // Huohuo happy expressions
  sad: ["cry"],  // Huohuo sad expression
  angry: ["angry"],
  surprised: ["white_eyes"],  // Huohuo surprised expression
  thinking: ["baozhen"],  // Use baozhen for thinking (calm pose)
  shy: ["qizi1", "qizi2"],  // Huohuo shy expressions
  scared: ["white_eyes", "cry"],  // Huohuo scared expressions
}

// Motion group names to try per mood.
// These should match group keys in the model3.json Motions object.
// Huohuo model has: Idle, Happy, Sad, Angry, Tap
const expressionMotionGroupMap: Record<Live2DExpression, string[]> = {
  neutral: ["Idle"],
  happy: ["Happy"],
  sad: ["Sad"],
  angry: ["Angry"],
  surprised: ["Tap"],  // Use Tap for surprised (startled reaction)
  thinking: ["Idle"],
  shy: ["Happy"],      // Use Happy for shy (gentle movement)
  scared: ["Tap", "Sad"],  // Use Tap then Sad for scared
}

export function Live2DAvatar({
  modelPath,
  className,
  width = 300,
  height = 400,
  expression = "neutral",
  isSpeaking = false,
  fitMode = "contain",
  focusY = 0.5,
  motionPreload = "IDLE",
  triggerMotion = null,
  emotionIntensity = 0.5,
  onModelLoaded,
  onError,
  onMotionTriggered,
}: Live2DModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<unknown>(null)
  const modelRef = useRef<Live2DModelType | null>(null)
  const onErrorRef = useRef<typeof onError>(onError)
  const onModelLoadedRef = useRef<typeof onModelLoaded>(onModelLoaded)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onModelLoadedRef.current = onModelLoaded
  }, [onModelLoaded])

  const onMotionTriggeredRef = useRef<typeof onMotionTriggered>(onMotionTriggered)
  useEffect(() => {
    onMotionTriggeredRef.current = onMotionTriggered
  }, [onMotionTriggered])

  // Handle triggerMotion prop - trigger specific motion group
  useEffect(() => {
    if (!modelRef.current || !isLoaded || !triggerMotion) return

    const model = modelRef.current
    try {
      if (model.motion(triggerMotion)) {
        onMotionTriggeredRef.current?.()
      }
    } catch {
      // Motion group not found
    }
  }, [triggerMotion, isLoaded])

  // Initialize PIXI application
  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined") return

    if (width <= 0 || height <= 0) {
      const invalidSizeError = new Error("Live2D: width/height must be > 0")
      setError(invalidSizeError)
      onErrorRef.current?.(invalidSizeError)
      return
    }

    let cancelled = false

    const initApp = async () => {
      try {
        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        // We handle pointer/mouse interactions via React on the wrapper, not via Pixi.
        // Disabling pointer events on the canvas prevents Pixi's EventSystem from hit-testing
        // (which can crash when pixi-live2d-display and pixi versions differ).
        canvas.style.pointerEvents = "none"

        // Initialize Live2D first
        await initializeLive2D()

        if (cancelled) return
        setIsInitializing(false)
        
        if (!PIXI || !Live2DModel) {
          throw new Error("Failed to load Live2D libraries")
        }

        // Prefer legacy WebGL env (more compatible across devices/drivers).
        try {
          ;(PIXI as any).settings.PREFER_ENV = (PIXI as any).ENV.WEBGL_LEGACY
        } catch {
          // ignore
        }

        // Some GPUs/drivers choke on Pixi's shader probing for max texture units/if-statements,
        // resulting in invalid WebGLProgram errors. Disabling multi-texture batching avoids
        // that probe and is fine for our usage (single Live2D model).
        try {
          ;(PIXI as any).settings.SPRITE_MAX_TEXTURES = 1
        } catch {
          // ignore
        }

        // Be conservative with shader precision for compatibility.
        try {
          ;(PIXI as any).settings.PRECISION_FRAGMENT = (PIXI as any).PRECISION.MEDIUM
        } catch {
          // ignore
        }

        // IMPORTANT: Do NOT create a WebGL context on the actual render canvas here.
        // If we call canvas.getContext("webgl", ...), the context attributes become locked
        // and Pixi cannot re-request a compatible context later (stencil, etc.).
        // That can lead to subtle renderer/shader failures.
        const testCanvas = document.createElement("canvas")
        const testGl =
          (testCanvas.getContext("webgl", { stencil: true }) as WebGLRenderingContext | null) ||
          (testCanvas.getContext("experimental-webgl", { stencil: true }) as WebGLRenderingContext | null)

        if (!testGl) {
          throw new Error("Trình duyệt/GPU không hỗ trợ WebGL, không thể hiển thị Live2D")
        }

        if (cancelled) return

        // Create PIXI application. Force WebGL renderer preference (Live2D requires WebGL).
        const app = new PIXI.Application({
          view: canvas,
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          // @ts-ignore - Pixi options differ across versions
          stencil: true,
          // @ts-ignore - Pixi options differ across versions
          depth: true,
          // @ts-ignore - Pixi options differ across versions
          powerPreference: "high-performance",
        } as any)

        appRef.current = app

        // Also disable Pixi interaction at the stage level (extra safety).
        try {
          ;(app.stage as any).eventMode = "none"
        } catch {
          // ignore
        }

        // Load Live2D model
        const model = await Live2DModel.from(modelPath, {
          autoInteract: false,
          autoUpdate: true,
          motionPreload,
        }) as Live2DModelType

        if (cancelled) {
          try {
            model.destroy()
          } catch {
            // ignore
          }
          return
        }

        const safeFocusY = Math.max(0, Math.min(1, focusY))

        // Scale and position model
        // - contain: fit fully in view
        // - cover: fill view and allow cropping (useful for "upper body" framing in small UI)
        const scaleContain = Math.min(
          (width * 0.8) / model.width,
          (height * 0.9) / model.height,
        )
        const scaleCover = Math.max(
          (width * 0.95) / model.width,
          (height * 1.15) / model.height,
        )
        const scale = fitMode === "cover" ? scaleCover : scaleContain
        model.scale.set(scale)
        model.anchor.set(0.5, 0.5)
        model.x = width / 2
        // Vertical framing similar to CSS object-position.
        // focusY: 0 = align top, 0.5 = center, 1 = align bottom.
        // Only has a visible effect when the scaled model is taller than the viewport.
        const scaledModelHeight = model.height
        const overflowY = Math.max(0, scaledModelHeight - height)
        model.y = height / 2 + (0.5 - safeFocusY) * overflowY

        // Add to stage
        // @ts-expect-error - PIXI types
        app.stage.addChild(model)
        modelRef.current = model

        setIsLoaded(true)
        onModelLoadedRef.current?.()

        // NOTE: We intentionally do not register Pixi "hit" events.
        // Click/mouse tracking is handled via React events on the wrapper div.

      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to load Live2D model")
        if (cancelled) return
        setError(error)
        onErrorRef.current?.(error)
        console.error("Live2D Error:", error)
      }
    }

    initApp()

    return () => {
      cancelled = true

      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current)
      }

      const model = modelRef.current
      if (model && typeof model.destroy === "function") {
        try {
          model.destroy()
        } catch {
          // ignore
        }
      }
      modelRef.current = null

      const app = appRef.current as any
      if (app && typeof app.destroy === "function") {
        try {
          app.destroy(true)
        } catch {
          // ignore
        }
      }
      appRef.current = null
    }
  }, [modelPath, width, height, fitMode, focusY, motionPreload])

  // Handle expression changes
  useEffect(() => {
    if (!modelRef.current || !isLoaded) return

    const model = modelRef.current

    // Try expressions first (exp3)
    const expNames = expressionNameMap[expression] || []
    for (const name of expNames) {
      try {
        model.expression(name)
        break
      } catch {
        continue
      }
    }

    // Then try a motion group that matches the mood
    const groupNames = expressionMotionGroupMap[expression] || []
    for (const group of groupNames) {
      try {
        if (model.motion(group)) break
      } catch {
        continue
      }
    }
  }, [expression, isLoaded])

  // Handle speaking animation (lip sync simulation)
  useEffect(() => {
    if (!modelRef.current || !isLoaded) return

    const model = modelRef.current

    if (isSpeaking) {
      // Simulate lip sync with mouth parameter
      let mouthOpen = 0
      speakingIntervalRef.current = setInterval(() => {
        mouthOpen = Math.random() * 0.8 + 0.2 // Random mouth movement
        try {
          // Try different mouth parameter names
          const mouthParams = ["ParamMouthOpenY", "PARAM_MOUTH_OPEN_Y", "MouthOpenY"]
          for (const param of mouthParams) {
            model.internalModel?.coreModel?.setParameterValueById?.(param, mouthOpen)
          }
        } catch {
          // Parameter not found
        }
      }, 100)
    } else {
      // Close mouth
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current)
        speakingIntervalRef.current = null
      }
      try {
        const mouthParams = ["ParamMouthOpenY", "PARAM_MOUTH_OPEN_Y", "MouthOpenY"]
        for (const param of mouthParams) {
          modelRef.current?.internalModel?.coreModel?.setParameterValueById?.(param, 0)
        }
      } catch {
        // Parameter not found
      }
    }

    return () => {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current)
      }
    }
  }, [isSpeaking, isLoaded])

  // Mouse tracking for eye follow
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!modelRef.current || !canvasRef.current || !isLoaded) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width * 2 - 1 // -1 to 1
    const y = (e.clientY - rect.top) / rect.height * 2 - 1 // -1 to 1

    try {
      const model = modelRef.current
      // Try different eye parameter names
      const eyeXParams = ["ParamAngleX", "PARAM_ANGLE_X", "AngleX"]
      const eyeYParams = ["ParamAngleY", "PARAM_ANGLE_Y", "AngleY"]
      
      for (const param of eyeXParams) {
        model.internalModel?.coreModel?.setParameterValueById?.(param, x * 30)
      }
      for (const param of eyeYParams) {
        model.internalModel?.coreModel?.setParameterValueById?.(param, -y * 30)
      }
    } catch {
      // Parameters not found
    }
  }, [isLoaded])

  // Tap interaction
  const handleClick = useCallback(() => {
    if (!modelRef.current || !isLoaded) return
    
    const model = modelRef.current
    // Play tap reaction motion (try common group names)
    try {
      model.motion("Tap") ||
        model.motion("TapBody") ||
        model.motion("TapHead") ||
        model.motion("Touch") ||
        model.motion("tap") ||
        model.motion("touch")
    } catch {
      // Motion not found
    }
  }, [isLoaded])

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 rounded-xl", className)} style={{ width, height }}>
        <p className="text-sm text-muted-foreground">Không thể tải avatar</p>
      </div>
    )
  }

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
      {(!isLoaded || isInitializing) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
