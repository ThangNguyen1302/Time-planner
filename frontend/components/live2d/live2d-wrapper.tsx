"use client"

import { useCallback } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import type { Live2DExpression, Live2DModelProps } from "./live2d-model"

// Dynamic import with SSR disabled for Live2D
const Live2DModelComponent = dynamic(
  () => import("./live2d-model").then((mod) => mod.Live2DAvatar),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export interface Live2DAvatarWrapperProps extends Omit<Live2DModelProps, "onError"> {
  fallbackIcon?: React.ReactNode
  onError?: () => void
}

export function Live2DAvatarWrapper({
  onError,
  fallbackIcon,
  ...props
}: Live2DAvatarWrapperProps) {
  const handleError = useCallback(
    (err: Error) => {
      console.error("Live2D Error:", err)
      onError?.()
    },
    [onError],
  )

  const width = props.width ?? 300
  const height = props.height ?? 400

  return (
    <div className={cn("relative", props.className)} style={{ width, height }}>
      <Live2DModelComponent
        {...props}
        onError={handleError}
      />
    </div>
  )
}

// Re-export types
export type { Live2DExpression, Live2DModelProps }
